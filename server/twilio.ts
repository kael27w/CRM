// server/twilio.ts
import { Request, Response, NextFunction } from 'express';
import twilio from 'twilio';
import { supabase, normalizePhone } from './supabase.js';

// Extended interface for Dial attributes if needed, though we'll use nested <Number>
// interface ExtendedDialAttributes {
//   callerId?: string;
// }

/**
 * Validates the incoming Twilio request using the Twilio auth token
 */
export const twilioWebhook = (baseUrl: string) => {
  const authToken = process.env.TWILIO_AUTH_TOKEN || '';

  if (!authToken) {
    console.error('CRITICAL_ERROR: TWILIO_AUTH_TOKEN is not set. Request validation will likely fail.');
  }
  if (!baseUrl) {
    console.error('CRITICAL_ERROR: baseUrl for Twilio webhook validation is empty or not set. Request validation will likely fail.');
  }
  console.log(`[DEBUG] Twilio webhook middleware setup. Validation URL: ${baseUrl}, AuthToken Present: ${!!authToken}`);

  return twilio.webhook({ validate: true, url: baseUrl });
};

/**
 * Handles incoming Twilio voice webhook requests
 */
export const handleVoiceWebhook = async (req: Request, res: Response) => {
  const callSid = req.body.CallSid || 'UNKNOWN_SID';
  console.log(`[${callSid}] handleVoiceWebhook START`);

  try {
    const fromNumber = req.body.From;
    const toNumber = req.body.To;
    console.log(`[${callSid}] Data: From=${fromNumber}, To=${toNumber}`);

    // Attempt to find the contact before inserting the call record
    let foundContactId: number | null = null;
    let contactName = '';
    
    if (fromNumber) {
      console.log(`[${callSid}] Attempting contact lookup in Supabase for ${fromNumber}...`);
      const normalizedPhone = normalizePhone(fromNumber);
      console.log(`[${callSid}] Normalized phone: ${normalizedPhone}`);

      const { data: contacts, error: contactError } = await supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .or(`phone.ilike.%${normalizedPhone}%,phone.ilike.%${fromNumber}%`)
        .limit(1);

      if (contactError) {
        console.error(`[${callSid}] Supabase contact SELECT error:`, contactError.message);
      } else if (contacts && contacts.length > 0) {
        foundContactId = contacts[0].id;
        contactName = contacts[0].first_name;
        console.log(`[${callSid}] Contact found: ${contactName}, ID: ${foundContactId}`);
        console.log(`[${callSid}] Linking incoming call to existing contact ID: ${foundContactId}`);
      } else {
        console.log(`[${callSid}] Contact not found.`);
      }
    } else {
       console.log(`[${callSid}] No From number provided, skipping contact lookup.`);
    }

    console.log(`[${callSid}] Attempting to log initial call to Supabase...`);
    const { error: callError } = await supabase
      .from('calls')
      .insert([{
        call_sid: callSid,
        direction: 'inbound',
        from_number: fromNumber,
        to_number: toNumber,
        call_type: 'inbound',
        status: 'initiated',
        duration: 0,
        contact_id: foundContactId || null // Include the contact ID in the insert
      }]);

    if (callError) {
      console.error(`[${callSid}] Supabase call log INSERT error:`, callError.message);
    } else {
      console.log(`[${callSid}] Supabase call log INSERT success.`);
    }

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
    } else {
       console.log(`[${callSid}] Dialing: Forward=${forwardNum}, CallerID=${callerIdNum}, StatusCallback=${statusCallbackUrl}`);
       const dialNode = twiml.dial({ callerId: callerIdNum });
       dialNode.number({
           statusCallback: statusCallbackUrl,
           statusCallbackEvent: ['completed'] // Corrected: ensure it's an array
       }, forwardNum);
    }

    console.log(`[${callSid}] Sending TwiML response: ${twiml.toString()}`);
    res.type('text/xml');
    res.send(twiml.toString());
    console.log(`[${callSid}] handleVoiceWebhook END - Response sent.`);

  } catch (error: any) {
    console.error(`[${callSid}] UNEXPECTED ERROR in handleVoiceWebhook:`, error.message, error.stack);
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
         res.status(500).send("An unexpected error occurred.");
       }
    }
  }
};

// handleStatusCallback remains the same as the last version you had,
// which correctly uses ParentCallSid/DialCallSid
export const handleStatusCallback = async (req: Request, res: Response) => {
  const outgoingCallSid = req.body.CallSid || 'UNKNOWN_OUTGOING_SID';
  const parentCallSid = req.body.ParentCallSid || req.body.DialCallSid;
  const effectiveCallSidToUpdate = parentCallSid || outgoingCallSid;

  console.log(`[${outgoingCallSid}] handleStatusCallback START. Parent/DialCallSid: ${parentCallSid}. Will attempt to update record for SID: ${effectiveCallSidToUpdate}`);

  try {
    const callStatus = req.body.CallStatus;
    const duration = parseInt(req.body.CallDuration || '0', 10);
    const twilioErrorCode = req.body.ErrorCode;

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
      .eq('call_sid', effectiveCallSidToUpdate)
      .select();

    if (updateError) {
      console.error(`[${outgoingCallSid}] Supabase call log UPDATE error for SID ${effectiveCallSidToUpdate}:`, updateError.message);
      return res.status(200).send('Error updating record, but acknowledged.');
    }

    if (data && data.length > 0) {
        console.log(`[${outgoingCallSid}] Successfully updated call record for SID ${effectiveCallSidToUpdate}.`);
    } else {
        console.warn(`[${outgoingCallSid}] No call record found in Supabase for SID ${effectiveCallSidToUpdate} to update.`);
    }

    res.status(200).send();
    console.log(`[${outgoingCallSid}] handleStatusCallback END - Response sent for SID ${effectiveCallSidToUpdate}.`);

  } catch (error: any) {
    console.error(`[${outgoingCallSid}] UNEXPECTED ERROR in handleStatusCallback:`, error.message, error.stack);
    res.status(500).send('Internal server error');
    console.log(`[${outgoingCallSid}] handleStatusCallback END - Error response sent.`);
  }
};