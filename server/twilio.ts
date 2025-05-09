// server/twilio.ts
import { Request, Response } from 'express'; // Ensure these types are imported
import twilio from 'twilio';
import { supabase, normalizePhone } from './supabase.js'; // Ensure .js extension

// Extended interface to include the statusCallback properties
interface ExtendedDialAttributes {
  callerId?: string;
  statusCallback?: string;
  statusCallbackMethod?: string;
  statusCallbackEvent?: string[];
  // Add other standard DialAttributes if needed
}

/**
 * Validates the incoming Twilio request using the Twilio auth token
 */
export const twilioWebhook = (baseUrl: string) => {
  const authToken = process.env.TWILIO_AUTH_TOKEN || '';
  // For production, always validate. For local dev, you might bypass.
  // if (process.env.NODE_ENV !== 'production' && process.env.BYPASS_TWILIO_VALIDATION === 'true') {
  //   console.warn('Development mode: Bypassing Twilio signature validation. DO NOT USE IN PRODUCTION.');
  //   return (req: Request, res: Response, next: Function) => next();
  // }
  return twilio.webhook({ validate: true, url: baseUrl });
};

/**
 * Handles incoming Twilio voice webhook requests
 */
export const handleVoiceWebhook = async (req: Request, res: Response) => {
  const callSid = req.body.CallSid || 'UNKNOWN_SID'; // Get SID early for logging
  console.log(`[${callSid}] handleVoiceWebhook START`);

  try {
    const fromNumber = req.body.From;
    const toNumber = req.body.To;
    console.log(`[${callSid}] Data: From=${fromNumber}, To=${toNumber}`);

    // --- Log initial call ---
    console.log(`[${callSid}] Attempting to log initial call to Supabase...`);
    const { error: callError } = await supabase
      .from('calls')
      .insert([{
        call_sid: callSid,
        direction: 'inbound',
        from_number: fromNumber,
        to_number: toNumber,
        call_type: 'inbound', // Assuming all calls to this webhook are inbound
        status: 'initiated',
        duration: 0
      }]);
      // .select(); // Select is not strictly needed for insert if you don't use the returned data

    if (callError) {
      console.error(`[${callSid}] Supabase call log INSERT error:`, callError.message);
      // Continue processing even if logging fails for now, but this is an issue to fix
    } else {
      console.log(`[${callSid}] Supabase call log INSERT success.`);
    }

    // --- Look up contact ---
    let contactName = '';
    if (fromNumber) {
      console.log(`[${callSid}] Attempting contact lookup in Supabase for ${fromNumber}...`);
      const normalizedPhone = normalizePhone(fromNumber);
      console.log(`[${callSid}] Normalized phone: ${normalizedPhone}`);

      const { data: contacts, error: contactError } = await supabase
        .from('contacts')
        .select('first_name, last_name')
        .or(`phone.ilike.%${normalizedPhone}%,phone.ilike.%${fromNumber}%`) // This OR can be slow
        .limit(1);

      if (contactError) {
        console.error(`[${callSid}] Supabase contact SELECT error:`, contactError.message);
      } else if (contacts && contacts.length > 0) {
        contactName = contacts[0].first_name;
        console.log(`[${callSid}] Contact found: ${contactName}`);
      } else {
        console.log(`[${callSid}] Contact not found.`);
      }
    } else {
       console.log(`[${callSid}] No From number provided, skipping contact lookup.`);
    }

    // --- Generate TwiML ---
    console.log(`[${callSid}] Generating TwiML...`);
    const twiml = new twilio.twiml.VoiceResponse();

    if (contactName) {
      twiml.say(`Hello ${contactName}, connecting your call.`);
    } else {
      twiml.say('Hello, connecting your call.');
    }

    const forwardNum = process.env.FORWARDING_NUMBER;
    const callerIdNum = process.env.TWILIO_PHONE_NUMBER;
    const statusCallbackUrl = process.env.TWILIO_STATUS_CALLBACK_URL || `${process.env.API_URL || ''}/api/twilio/status-callback`;

    if (!forwardNum || !callerIdNum) {
       console.error(`[${callSid}] CRITICAL ERROR: Missing FORWARDING_NUMBER or TWILIO_PHONE_NUMBER env variable!`);
       twiml.say("Sorry, there is a configuration error with this phone number. Please contact support.");
       // Do not attempt to dial if these are missing
    } else {
       console.log(`[${callSid}] Dialing options: Forward=${forwardNum}, CallerID=${callerIdNum}, StatusCallback=${statusCallbackUrl}`);
       const dialOptions: ExtendedDialAttributes = {
         callerId: callerIdNum,
         statusCallback: statusCallbackUrl,
         statusCallbackMethod: 'POST',
         statusCallbackEvent: ['completed']
       };
       twiml.dial(dialOptions, forwardNum);
    }

    // --- Send Response ---
    console.log(`[${callSid}] Sending TwiML response.`);
    res.type('text/xml');
    res.send(twiml.toString());
    console.log(`[${callSid}] handleVoiceWebhook END - Response sent.`);

  } catch (error: any) { // Catch ANY unexpected errors during the process
    console.error(`[${callSid}] UNEXPECTED ERROR in handleVoiceWebhook:`, error.message, error.stack);

    // Attempt to send an error TwiML response
    try {
      const errorTwiml = new twilio.twiml.VoiceResponse();
      errorTwiml.say('Sorry, an application error occurred. Please try again later.');
      errorTwiml.hangup();
      if (!res.headersSent) {
        res.type('text/xml');
        res.status(500).send(errorTwiml.toString());
      }
      console.log(`[${callSid}] handleVoiceWebhook END - Error response sent.`);
    } catch (sendError: any) {
      console.error(`[${callSid}] FAILED TO SEND ERROR TWIML:`, sendError.message);
       if (!res.headersSent) {
         res.status(500).send("An unexpected error occurred."); // Fallback plain text
       }
    }
  }
};

/**
 * Handles Twilio status callback webhook requests
 */
export const handleStatusCallback = async (req: Request, res: Response) => {
  const callSid = req.body.CallSid || 'UNKNOWN_SID_STATUS';
  console.log(`[${callSid}] handleStatusCallback START`);

  try {
    const callStatus = req.body.CallStatus;
    const duration = parseInt(req.body.CallDuration || '0', 10);
    console.log(`[${callSid}] Data: Status=${callStatus}, Duration=${duration}`);

    if (!callSid || callSid === 'UNKNOWN_SID_STATUS') { // Check for our default too
      console.error(`[${callSid}] Missing CallSid in status callback.`);
      return res.status(400).json({ error: 'Missing CallSid parameter' });
    }

    // Update the call record with the final status and duration
    console.log(`[${callSid}] Attempting to update call record in Supabase...`);
    const { error: updateError } = await supabase
      .from('calls')
      .update({
        status: callStatus,
        duration: duration,
        updated_at: new Date() // Use Date object directly
      })
      .eq('call_sid', callSid);

    if (updateError) {
      console.error(`[${callSid}] Supabase call log UPDATE error:`, updateError.message);
      // Twilio doesn't care about the response body on status callbacks as much,
      // but we should log the error. A 500 might make Twilio retry, which isn't ideal.
      // Let's send 200 OK so Twilio stops.
      return res.status(200).send('Error updating record, but acknowledged.');
    }

    console.log(`[${callSid}] Successfully updated call record.`);
    res.status(200).send(); // Send 200 OK to Twilio
    console.log(`[${callSid}] handleStatusCallback END - Response sent.`);

  } catch (error: any) {
    console.error(`[${callSid}] UNEXPECTED ERROR in handleStatusCallback:`, error.message, error.stack);
    res.status(500).send('Internal server error'); // Send 500 to Twilio for unexpected errors
    console.log(`[${callSid}] handleStatusCallback END - Error response sent.`);
  }
};