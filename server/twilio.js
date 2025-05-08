import { Request, Response } from 'express';
import twilio from 'twilio';
import { supabase, normalizePhone } from './supabase.js';

// Extended interface to include the statusCallback properties which are supported by Twilio but
// may not be in the type definition
interface ExtendedDialAttributes {
  callerId?: string;
  statusCallback?: string;
  statusCallbackMethod?: string;
  statusCallbackEvent?: string[];
  // Add other standard DialAttributes if needed (e.g., timeout, timeLimit etc.)
}

/**
 * Validates the incoming Twilio request using the Twilio auth token
 */
export const twilioWebhook = (baseUrl: string) => {
  const authToken = process.env.TWILIO_AUTH_TOKEN || '';
  // Simple validation bypass for development (optional)
  // if (process.env.NODE_ENV !== 'production') {
  //   return (req: Request, res: Response, next: Function) => next();
  // }
  return twilio.webhook({ validate: true, url: baseUrl });
};

/**
 * Handles incoming Twilio voice webhook requests
 */
export const handleVoiceWebhook = async (req: Request, res: Response) => {
  try {
    // Extract relevant data from the Twilio webhook request
    const callSid = req.body.CallSid;
    const fromNumber = req.body.From;
    const toNumber = req.body.To;

    console.log(`Received Twilio voice webhook: CallSid=${callSid}, From=${fromNumber}, To=${toNumber}`);

    // Create initial call record in Supabase
    const { data: callData, error: callError } = await supabase
      .from('calls')
      .insert([{
        call_sid: callSid,
        direction: 'inbound',
        from_number: fromNumber,
        to_number: toNumber,
        call_type: 'inbound',
        status: 'initiated',
        duration: 0 // Will be updated later by Twilio status callbacks
      }])
      .select();

    if (callError) {
      console.error('Error logging initial call:', callError);
      // Continue processing even if logging fails
    }

    // Look up contact by phone number
    let contactName = '';
    if (fromNumber) {
      const normalizedPhone = normalizePhone(fromNumber);

      // Query Supabase for contacts with matching phone number
      const { data: contacts, error: contactError } = await supabase
        .from('contacts')
        .select('first_name, last_name')
        .or(`phone.ilike.%${normalizedPhone}%,phone.ilike.%${fromNumber}%`);

      if (contactError) {
        console.error('Error looking up contact:', contactError);
      } else if (contacts && contacts.length > 0) {
        contactName = contacts[0].first_name;
      }
    }

    // Generate TwiML response
    const twiml = new twilio.twiml.VoiceResponse();

    // Add greeting based on whether contact was found
    if (contactName) {
      twiml.say(`Hello ${contactName}, connecting your call.`);
    } else {
      twiml.say('Hello, connecting your call.');
    }

    // Forward call to the configured number
    const dialOptions: ExtendedDialAttributes = {
      callerId: process.env.TWILIO_PHONE_NUMBER || '',
      // Add status callback URL to receive call status updates
      statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL || `${process.env.API_URL || ''}/api/twilio/status-callback`,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['completed']
    };

    // Create the dial element and add to TwiML
    const dial = twiml.dial(dialOptions, process.env.FORWARDING_NUMBER || '');

    // Send TwiML response
    res.type('text/xml');
    res.send(twiml.toString());

  } catch (error) {
    console.error('Error in Twilio voice webhook:', error);

    // Respond with a simple TwiML that apologizes and hangs up
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('Sorry, an error occurred processing your call.');
    twiml.hangup();

    res.type('text/xml');
    res.send(twiml.toString());
  }
};

/**
 * Handles Twilio status callback webhook requests
 */
export const handleStatusCallback = async (req: Request, res: Response) => {
  try {
    // Extract relevant data from the Twilio status callback
    const callSid = req.body.CallSid;
    const callStatus = req.body.CallStatus;
    const duration = parseInt(req.body.CallDuration || '0', 10);

    console.log(`Received Twilio status callback: CallSid=${callSid}, Status=${callStatus}, Duration=${duration}`);

    if (!callSid) {
      return res.status(400).json({ error: 'Missing CallSid parameter' });
    }

    // Find the call record in Supabase by call_sid
    const { data: callRecords, error: findError } = await supabase
      .from('calls')
      .select('*')
      .eq('call_sid', callSid);

    if (findError) {
      console.error('Error finding call record:', findError);
      return res.status(500).json({ error: 'Database error finding call record' });
    }

    if (!callRecords || callRecords.length === 0) {
      console.error(`No call record found for CallSid: ${callSid}`);
      // Return 200 OK even if record not found, Twilio doesn't need to retry.
      return res.status(200).send('Call record not found, no action taken.');
    }

    // Update the call record with the final status and duration
    const { error: updateError } = await supabase
      .from('calls')
      .update({
        status: callStatus,
        duration: duration,
        updated_at: new Date() // Use Date object directly
      })
      .eq('call_sid', callSid);

    if (updateError) {
      console.error('Error updating call record:', updateError);
      return res.status(500).json({ error: 'Database error updating call record' });
    }

    console.log(`Successfully updated call record for CallSid=${callSid} with duration=${duration}`);

    // Return success response to Twilio (empty 200 OK is fine)
    res.status(200).send();

  } catch (error) {
    console.error('Error in Twilio status callback handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 