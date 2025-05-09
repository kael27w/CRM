// server/twilio.ts
import { Request, Response, NextFunction } from 'express'; // Ensure these types are imported
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


export const twilioWebhook = (baseUrl: string) => {
  const authToken = process.env.TWILIO_AUTH_TOKEN || '';

  if (!authToken) {
    // Log a critical error if the auth token is missing.
    // The request will likely fail validation or Twilio SDK might error.
    console.error('CRITICAL_ERROR: TWILIO_AUTH_TOKEN is not set. Request validation will likely fail.');
  }
  if (!baseUrl) {
    // Log a critical error if the baseUrl is missing, as validation needs it.
    console.error('CRITICAL_ERROR: baseUrl for Twilio webhook validation is empty or not set. Request validation will likely fail.');
  }
  console.log(`[DEBUG] Twilio webhook middleware setup. Validation URL: ${baseUrl}, AuthToken Present: ${!!authToken}`);

  // Return the actual Twilio validation middleware
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



export const handleStatusCallback = async (req: Request, res: Response) => {
  const outgoingCallSid = req.body.CallSid || 'UNKNOWN_OUTGOING_SID'; // SID of the dialed leg
  const parentCallSid = req.body.ParentCallSid || req.body.DialCallSid; // Twilio might use DialCallSid for parent on simple Dial
  const effectiveCallSidToUpdate = parentCallSid || outgoingCallSid; // Prefer ParentCallSid if available

  console.log(`[${outgoingCallSid}] handleStatusCallback START. Parent/DialCallSid: ${parentCallSid}. Will attempt to update record for SID: ${effectiveCallSidToUpdate}`);

  try {
    const callStatus = req.body.CallStatus;
    const duration = parseInt(req.body.CallDuration || '0', 10);
    const twilioErrorCode = req.body.ErrorCode; // Capture Twilio error code if any

    console.log(`[${outgoingCallSid}] Data: Status=${callStatus}, Duration=${duration}, TwilioErrorCode=${twilioErrorCode}`);

    if (!effectiveCallSidToUpdate || effectiveCallSidToUpdate.startsWith('UNKNOWN_')) {
      console.error(`[${outgoingCallSid}] Missing or invalid CallSid/ParentCallSid to update in status callback.`);
      return res.status(400).send('Missing CallSid/ParentCallSid to identify call record.');
    }

    let updatePayload: any = {
      status: callStatus,
      duration: duration,
      updated_at: new Date()
    };

    if (twilioErrorCode) {
      updatePayload.notes = `Twilio Error: ${twilioErrorCode}. ${req.body.ErrorMessage || ''}`.trim();
    }

    console.log(`[${outgoingCallSid}] Attempting to update call record in Supabase for SID: ${effectiveCallSidToUpdate} with payload:`, updatePayload);
    const { data, error: updateError } = await supabase
      .from('calls')
      .update(updatePayload)
      .eq('call_sid', effectiveCallSidToUpdate) // Update based on the incoming (parent) call's SID
      .select(); // Select to see if anything was updated

    if (updateError) {
      console.error(`[${outgoingCallSid}] Supabase call log UPDATE error for SID ${effectiveCallSidToUpdate}:`, updateError.message);
      return res.status(200).send('Error updating record, but acknowledged.');
    }

    if (data && data.length > 0) {
        console.log(`[${outgoingCallSid}] Successfully updated call record for SID ${effectiveCallSidToUpdate}.`);
    } else {
        console.warn(`[${outgoingCallSid}] No call record found in Supabase for SID ${effectiveCallSidToUpdate} to update. This might be expected if ParentCallSid was not available and outgoingCallSid was used.`);
    }

    res.status(200).send();
    console.log(`[${outgoingCallSid}] handleStatusCallback END - Response sent for SID ${effectiveCallSidToUpdate}.`);

  } catch (error: any) {
    console.error(`[${outgoingCallSid}] UNEXPECTED ERROR in handleStatusCallback:`, error.message, error.stack);
    res.status(500).send('Internal server error');
    console.log(`[${outgoingCallSid}] handleStatusCallback END - Error response sent.`);
  }
};