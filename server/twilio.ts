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
      twiml.say(`Hello ${contactName}, connecting you to the next available agent.`);
    } else {
      twiml.say('Hello, connecting you to the next available agent.');
    }

    // Instead of dialing a phone number, we'll dial a client
    const clientIdentity = 'agent1'; // Hardcoded client identity for MVP
    const callerIdNum = process.env.TWILIO_PHONE_NUMBER;
    const statusCallbackUrl = process.env.TWILIO_STATUS_CALLBACK_URL || `${process.env.API_URL || ''}/api/twilio/status-callback`;

    if (!callerIdNum) {
      console.error(`[${callSid}] WARNING: Missing TWILIO_PHONE_NUMBER env variable for caller ID!`);
    }

    console.log(`[${callSid}] Dialing Client: Identity=${clientIdentity}, CallerID=${callerIdNum || 'Not Set'}, StatusCallback=${statusCallbackUrl}`);
    
    // Create dial options with ONLY caller ID if available
    const dialOptions: any = {};
    if (callerIdNum) {
      dialOptions.callerId = callerIdNum;
    }
    
    // Dial the client
    const dialNode = twiml.dial(dialOptions);
    
    // Create client options with status callback
    const clientOptions: any = {};
    if (statusCallbackUrl) {
      clientOptions.statusCallback = statusCallbackUrl;
      clientOptions.statusCallbackEvent = ['initiated', 'ringing', 'in-progress', 'answered', 'completed'];
    }
    
    // Add client element with options
    dialNode.client(clientOptions, clientIdentity);

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

/**
 * Generates a Twilio Voice Access Token for browser-based clients
 */
export const generateTwilioToken = (req: Request, res: Response) => {
  const { AccessToken } = twilio.jwt;
  const { VoiceGrant } = AccessToken;
  
  try {
    console.log('generateTwilioToken - Request received');
    
    // Get credentials from environment variables
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioApiKeySid = process.env.TWILIO_API_KEY_SID;
    const twilioApiKeySecret = process.env.TWILIO_API_KEY_SECRET;
    const twilioAppSid = process.env.TWILIO_APP_SID;
    
    // Check if all required environment variables are set
    if (!twilioAccountSid || !twilioApiKeySid || !twilioApiKeySecret || !twilioAppSid) {
      console.error('generateTwilioToken - Missing required Twilio credentials in environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    // Create an access token
    const accessToken = new AccessToken(
      twilioAccountSid,
      twilioApiKeySid,
      twilioApiKeySecret,
      { identity: 'agent1' } // Hardcoded identity for MVP
    );
    
    // Create a Voice grant for this token
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twilioAppSid,
      incomingAllow: true // Allow incoming connections
    });
    
    // Add the grant to the token
    accessToken.addGrant(voiceGrant);
    
    // Generate the token string
    const token = accessToken.toJwt();
    console.log('generateTwilioToken - Token generated successfully for agent1');
    
    // Send the token to the client
    res.status(200).json({ token });
  } catch (error: any) {
    console.error('generateTwilioToken - Error generating token:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to generate token', error: error.message });
  }
};

/**
 * Handles status callbacks from Twilio
 */
export const handleStatusCallback = async (req: Request, res: Response) => {
  // Extremely early detailed logging to confirm the handler is being invoked
  console.log(`[STATUS_CALLBACK_HANDLER] INVOKED. CallSid: ${req.body.CallSid}, Status: ${req.body.CallStatus}, Duration: ${req.body.CallDuration}, Full Body:`, JSON.stringify(req.body, null, 2));
  
  const outgoingCallSid = req.body.CallSid || 'UNKNOWN_OUTGOING_SID';
  const parentCallSid = req.body.ParentCallSid || req.body.DialCallSid;
  
  // For outbound calls from browser client, we need to use the original CallSid from the outbound request
  // But for status updates on the dialed leg, we need to look at the parent relationship
  const callSidToUpdate = parentCallSid || outgoingCallSid;

  console.log(`[STATUS_CALLBACK_HANDLER] Parsed values - SID: ${callSidToUpdate}, Status: ${req.body.CallStatus}, Duration: ${req.body.CallDuration}`);
  
  // Send a 200 OK response early to prevent Twilio from retrying due to timeouts
  // This is important as database operations might take time
  res.status(200).send('OK');
  console.log(`[STATUS_CALLBACK_HANDLER] Sent immediate 200 OK response to Twilio to acknowledge receipt`);

  try {
    const callStatus = req.body.CallStatus || 'unknown';
    const callDuration = req.body.CallDuration || '0';
    const duration = parseInt(callDuration, 10);
    const twilioErrorCode = req.body.ErrorCode;
    
    // Log more call details that might help diagnose issues
    console.log(`[STATUS_CALLBACK_HANDLER] Call details:`);
    console.log(`[STATUS_CALLBACK_HANDLER] - Status: ${callStatus}`);
    console.log(`[STATUS_CALLBACK_HANDLER] - Duration: ${duration} seconds`);
    console.log(`[STATUS_CALLBACK_HANDLER] - From: ${req.body.From || 'unknown'}`);
    console.log(`[STATUS_CALLBACK_HANDLER] - To: ${req.body.To || 'unknown'}`);
    console.log(`[STATUS_CALLBACK_HANDLER] - Direction: ${req.body.Direction || 'unknown'}`);
    console.log(`[STATUS_CALLBACK_HANDLER] - Error Code: ${twilioErrorCode || 'none'}`);
    
    if (!callSidToUpdate || callSidToUpdate.startsWith('UNKNOWN_')) {
      console.error(`[STATUS_CALLBACK_HANDLER] CRITICAL: Missing or invalid CallSid to update in status callback.`);
      // Response already sent, so we just log the error and continue
    }

    // Log what we're looking for in Supabase
    console.log(`[STATUS_CALLBACK_HANDLER] Attempting to find call with SID: ${callSidToUpdate} in Supabase.`);
    
    // First approach: Try to find record using the effective SID (parent/dial or direct)
    let { data: existingCallData, error: existingCallError } = await supabase
      .from('calls')
      .select('*')
      .eq('call_sid', callSidToUpdate)
      .single();

    // Log the lookup result
    if (existingCallError) {
      console.error(`[STATUS_CALLBACK_HANDLER] Supabase error finding call: ${existingCallError.message}`);
    } else if (!existingCallData) {
      console.log(`[STATUS_CALLBACK_HANDLER] No existing call found for SID: ${callSidToUpdate}.`);
    } else {
      console.log(`[STATUS_CALLBACK_HANDLER] Found call record. DB ID: ${existingCallData.id}`);
    }

    // Second approach if first fails: Try with direct outgoing SID
    if (!existingCallData && parentCallSid && parentCallSid !== outgoingCallSid) {
      console.log(`[STATUS_CALLBACK_HANDLER] SECOND ATTEMPT: Looking for call record with call_sid = ${outgoingCallSid}`);
      
      const secondLookup = await supabase
        .from('calls')
        .select('*')
        .eq('call_sid', outgoingCallSid)
        .single();
        
      if (secondLookup.error) {
        console.log(`[STATUS_CALLBACK_HANDLER] Second lookup attempt error: ${secondLookup.error.message}`);
      } else if (secondLookup.data) {
        existingCallData = secondLookup.data;
        console.log(`[STATUS_CALLBACK_HANDLER] Found record using direct outgoing SID! DB ID: ${existingCallData.id}`);
      }
    }

    if (!existingCallData) {
      console.warn(`[STATUS_CALLBACK_HANDLER] No existing call record found. Printing ALL recent calls for debugging:`);
      
      // Debug: List recent calls to see what's actually in the database
      const { data: recentCalls, error: listError } = await supabase
        .from('calls')
        .select('id, call_sid, status, direction, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (listError) {
        console.error(`[STATUS_CALLBACK_HANDLER] Error listing recent calls: ${listError.message}`);
      } else {
        console.log(`[STATUS_CALLBACK_HANDLER] Recent calls:`, JSON.stringify(recentCalls, null, 2));
      }
      
      // Conditionally create a new record for important statuses
      if (['initiated', 'ringing', 'in-progress', 'completed', 'answered'].includes(callStatus)) {
        console.log(`[STATUS_CALLBACK_HANDLER] Creating new call record with status ${callStatus}`);
        
        // Determine direction based on context
        const isOutbound = req.body.Direction === 'outbound-api' || 
                          req.body.Direction === 'outbound' || 
                          req.body.From?.startsWith('client:');
        
        const direction = isOutbound ? 'outbound' : 'inbound';
        const call_type = direction; // Keeping call_type and direction consistent
        
        const callToInsert = {
          call_sid: callSidToUpdate,
          direction: direction,
          call_type: call_type,
          from_number: req.body.From || '',
          to_number: req.body.To || '',
          status: callStatus,
          duration: duration,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log(`[STATUS_CALLBACK_HANDLER] Inserting new call record:`, JSON.stringify(callToInsert, null, 2));
        
        const { data: newCallRecord, error: insertError } = await supabase
          .from('calls')
          .insert([callToInsert])
          .select();

        if (insertError) {
          console.error(`[STATUS_CALLBACK_HANDLER] Error creating new call record: ${insertError.message}`);
          console.error(`[STATUS_CALLBACK_HANDLER] Insert error details: ${insertError.details || ''}`);
        } else {
          console.log(`[STATUS_CALLBACK_HANDLER] Successfully created new call record with ID:`, 
                      newCallRecord && newCallRecord.length > 0 ? newCallRecord[0].id : 'unknown');
        }
      } else {
        console.log(`[STATUS_CALLBACK_HANDLER] Status '${callStatus}' not significant enough to create a new record`);
      }
    } else {
      console.log(`[STATUS_CALLBACK_HANDLER] Found existing call record with ID ${existingCallData.id}, updating status to '${callStatus}'`);
      
      // Create update payload
      const updatePayload: {
        status: string;
        duration: number;
        updated_at: string;
        notes?: string; // Add optional notes property to type definition
      } = {
        status: callStatus,
        duration: duration, // Ensure duration is an int
        updated_at: new Date().toISOString() // Use ISO string format for consistency
      };
      
      // Add notes if there was an error
      if (twilioErrorCode) {
        updatePayload.notes = `Twilio Error: ${twilioErrorCode}. ${req.body.ErrorMessage || ''}`.trim();
      }

      console.log(`[STATUS_CALLBACK_HANDLER] Attempting to update call DB ID ${existingCallData.id} with payload:`, JSON.stringify(updatePayload, null, 2));
      
      // Try a more targeted update with better error handling
      try {
        const { data: updateData, error: updateError } = await supabase
          .from('calls')
          .update(updatePayload)
          .eq('id', existingCallData.id) // Update by primary key for reliability
          .select();

        if (updateError) {
          console.error(`[STATUS_CALLBACK_HANDLER] Supabase error updating call: ${updateError.message}`);
          console.error(`[STATUS_CALLBACK_HANDLER] Update error details: ${updateError.details || ''}`);
        } else if (updateData && updateData.length > 0) {
          console.log(`[STATUS_CALLBACK_HANDLER] Successfully updated call DB ID ${existingCallData.id}. Update result:`, JSON.stringify(updateData, null, 2));
        } else {
          console.warn(`[STATUS_CALLBACK_HANDLER] No rows updated. The record might have been deleted or ID changed.`);
        }
      } catch (dbError: any) {
        console.error(`[STATUS_CALLBACK_HANDLER] Unexpected database error during update: ${dbError.message}`);
        console.error(`[STATUS_CALLBACK_HANDLER] Error stack: ${dbError.stack}`);
      }
    }

    console.log(`[STATUS_CALLBACK_HANDLER] STATUS CALLBACK PROCESSING COMPLETE`);

  } catch (error: any) {
    console.error(`[STATUS_CALLBACK_HANDLER] CRITICAL ERROR in status callback handler: ${error.message}`);
    console.error(`[STATUS_CALLBACK_HANDLER] Full error stack: ${error.stack}`);
    // Response already sent earlier
  }
};