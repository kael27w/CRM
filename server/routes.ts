// server/routes.ts
import type { Express, Request, Response } from "express"; // Ensure Request, Response are here
import { createServer, type Server } from "http";
// Removed: import { storage } from "./storage.js"; // No longer using in-memory storage
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import {
  // insertUserSchema, // Removed if no user creation route uses it here
  insertContactSchema, // Keeping if POST /api/contacts uses it (currently doesn't explicitly)
  // insertDealSchema,   // Removed if no deal creation route uses it here
  insertActivitySchema // Keeping if any activity/task POST route uses it
} from "../shared/schema.js"; // Assuming path alias @shared might still be an issue for some setups
import { supabase, normalizePhone } from "./supabase.js";
import { twilioWebhook, handleVoiceWebhook, handleStatusCallback, generateTwilioToken } from "./twilio.js";
import twilio from "twilio";

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('REGISTER_ROUTES_CALLED: Entry point of registerRoutes reached.');

  // === EMERGENCY DEBUG ROUTE FOR ROOT PATH ===
  app.get("/", (req: Request, res: Response) => {
    console.log('EMERGENCY_DEBUG: ROOT PATH "/" HANDLER REACHED!');
    console.log('EMERGENCY_DEBUG: req.url:', req.url);
    console.log('EMERGENCY_DEBUG: req.originalUrl:', req.originalUrl);
    console.log('EMERGENCY_DEBUG: req.baseUrl:', req.baseUrl);
    console.log('EMERGENCY_DEBUG: req.path:', req.path);
    console.log('EMERGENCY_DEBUG: req.headers:', JSON.stringify(req.headers, null, 2));
    res.status(200).json({
      message: "Root path handler was hit on Render",
      originalUrl: req.originalUrl,
      url: req.url,
      path: req.path,
      baseUrl: req.baseUrl
    });
  });

  // === CONTACT ROUTES ===
  app.get("/api/contacts", async (req: Request, res: Response) => {
    try {
      const { phone } = req.query;
      if (!phone || typeof phone !== 'string') {
        return res.status(400).json({ message: "Phone parameter is required" });
      }
      console.log(`GET /api/contacts - Looking up contact with phone: ${phone}`);
      const normalizedPhone = normalizePhone(phone);
      const { data: contactsData, error } = await supabase
        .from('contacts')
        .select('*')
        .or(`phone.ilike.%${normalizedPhone}%,phone.ilike.%${phone}%`);

      if (error) {
        console.error("GET /api/contacts - Supabase error:", error);
        return res.status(500).json({ message: "Database error looking up contact" });
      }
      if (!contactsData || contactsData.length === 0) {
        console.log("GET /api/contacts - No contacts found");
        return res.status(200).json([]);
      }
      const contact = contactsData[0];
      const contactResponse = {
        contact_id: contact.id.toString(),
        first_name: contact.first_name,
        last_name: contact.last_name,
        phone: contact.phone,
        email: contact.email || '',
        company: contact.company || '',
        contact_url: `${req.protocol}://${req.get('host')}/contacts/${contact.id}`
      };
      res.status(200).json(contactResponse);
    } catch (error: any) {
      console.error("GET /api/contacts - Error in contact lookup:", error.message, error.stack);
      res.status(500).json({ message: "Error looking up contact" });
    }
  });

  app.get("/api/contacts/list", async (req: Request, res: Response) => {
    try {
      console.log("GET /api/contacts/list - Request received");
      
      // Simple query to fetch all contacts
      const { data: contactsData, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("GET /api/contacts/list - Supabase query error:", error);
        return res.status(500).json({ message: "Error fetching contacts" });
      }
      
      if (!contactsData) {
        console.log("GET /api/contacts/list - No contacts found in database");
        return res.json([]);
      }
      
      console.log(`GET /api/contacts/list - Found ${contactsData.length} contacts`);
      
      // Return the contacts as a simple array
      res.json(contactsData);
    } catch (error: any) {
      console.error("GET /api/contacts/list - Error:", error.message);
      res.status(500).json({ message: "Server error fetching contacts" });
    }
  });

  // Get a single contact by ID
  app.get("/api/contacts/:id", async (req: Request, res: Response) => {
    try {
      const contactId = req.params.id;
      
      if (!contactId || isNaN(Number(contactId))) {
        console.error(`GET /api/contacts/${contactId} - Invalid contact ID`);
        return res.status(400).json({ message: "Invalid contact ID" });
      }
      
      console.log(`GET /api/contacts/${contactId} - Fetching contact`);
      
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, phone, email, company, created_at, updated_at')
        .eq('id', contactId)
        .single();
      
      if (error) {
        console.error(`GET /api/contacts/${contactId} - Supabase error:`, error);
        
        if (error.code === 'PGRST116') {
          return res.status(404).json({ message: "Contact not found" });
        }
        
        return res.status(500).json({ message: "Error fetching contact" });
      }
      
      if (!data) {
        console.log(`GET /api/contacts/${contactId} - Contact not found`);
        return res.status(404).json({ message: "Contact not found" });
      }
      
      console.log(`GET /api/contacts/${contactId} - Contact found:`, data);
      res.json(data);
    } catch (error) {
      console.error(`GET /api/contacts/:id - Error:`, error instanceof Error ? error.message : error);
      res.status(500).json({ message: "Server error fetching contact" });
    }
  });

  // Add PATCH route for updating individual contacts
  app.patch("/api/contacts/:contactId", async (req: Request, res: Response) => {
    try {
      const { contactId } = req.params;
      const updates = req.body;
      
      console.log(`PATCH /api/contacts/${contactId} - Request received. Body:`, updates);
      
      // Validate contactId
      if (!contactId || isNaN(Number(contactId))) {
        console.error(`PATCH /api/contacts/${contactId} - Invalid contactId`);
        return res.status(400).json({ message: "Invalid contact ID" });
      }
      
      // Validate that there are fields to update
      if (!updates || Object.keys(updates).length === 0) {
        console.error(`PATCH /api/contacts/${contactId} - No update fields provided`);
        return res.status(400).json({ message: "No update fields provided" });
      }
      
      // Add updated_at timestamp
      const updatesWithTimestamp = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      // Update the contact
      const { data, error } = await supabase
        .from('contacts')
        .update(updatesWithTimestamp)
        .eq('id', contactId)
        .select()
        .single();
      
      if (error) {
        console.error(`PATCH /api/contacts/${contactId} - Supabase error:`, error);
        
        // Check for common error types
        if (error.code === 'PGRST204') { // No rows selected
          return res.status(404).json({ message: `Contact with ID ${contactId} not found` });
        }
        
        return res.status(500).json({ message: "Database error updating contact" });
      }
      
      if (!data) {
        console.error(`PATCH /api/contacts/${contactId} - No data returned after update`);
        return res.status(404).json({ message: `Contact with ID ${contactId} not found` });
      }
      
      console.log(`PATCH /api/contacts/${contactId} - Contact updated successfully:`, data);
      res.status(200).json(data);
    } catch (error: any) {
      console.error(`PATCH /api/contacts/${req.params.contactId} - Error updating contact:`, error.message, error.stack);
      res.status(500).json({ message: "Error updating contact" });
    }
  });

  app.post("/api/contacts", async (req: Request, res: Response) => {
    try {
      console.log("POST /api/contacts - Request received:", req.body);
      
      // Extract fields from request body
      const { first_name, last_name, phone, email, company } = req.body;
      
      // Validate required fields
      if (!first_name || !last_name) {
        console.error("POST /api/contacts - Missing required fields: first_name or last_name");
        return res.status(400).json({ message: "First name and last name are required" });
      }
      
      if (!phone) {
        console.error("POST /api/contacts - Missing required field: phone");
        return res.status(400).json({ message: "Phone number is required" });
      }

      const normalizedPhone = normalizePhone(phone);
      
      // Check if contact with this phone number already exists to avoid duplicates
      const { data: existingContacts, error: checkError } = await supabase
        .from('contacts')
        .select('id')
        .or(`phone.ilike.%${normalizedPhone}%,phone.ilike.%${phone}%`)
        .limit(1);
      
      if (checkError) {
        console.error("POST /api/contacts - Error checking for existing contact:", checkError);
        return res.status(500).json({ message: "Database error checking for existing contact" });
      }
      
      if (existingContacts && existingContacts.length > 0) {
        console.log("POST /api/contacts - Contact with this phone number already exists:", existingContacts[0]);
        
        // Link any unassigned calls with this phone number
        const existingContactId = existingContacts[0].id;
        console.log(`POST /api/contacts - Linking calls to existing contact ID: ${existingContactId}`);
        
        try {
          const { data: updatedCalls, error: updateError } = await supabase
            .from('calls')
            .update({ 
              contact_id: existingContactId,
              updated_at: new Date().toISOString()
            })
            .eq('from_number', normalizedPhone)
            .is('contact_id', null);
          
          if (updateError) {
            console.error(`POST /api/contacts - Error linking calls:`, updateError);
          } else {
            const rowsAffected = updatedCalls ? (updatedCalls as any[]).length : 0;
            console.log(`POST /api/contacts - Linked ${rowsAffected} calls to existing contact`);
          }
        } catch (linkError) {
          console.error(`POST /api/contacts - Error linking calls:`, linkError);
        }
        
        return res.status(200).json(existingContacts[0]); // Return existing contact
      }
      
      // Prepare contact data with timestamps
      const contactData = {
        first_name,
        last_name,
        phone: normalizedPhone,
        email: email || null,
        company: company || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Insert into contacts table
      const { data, error } = await supabase
        .from('contacts')
        .insert([contactData])
        .select()
        .single();
      
      if (error) {
        console.error("POST /api/contacts - Supabase insert error:", error);
        
        if (error.code === '23505') { // unique constraint violation
          console.log("POST /api/contacts - Duplicate contact");
          return res.status(409).json({ message: "Contact with this information already exists" });
        }
        
        return res.status(500).json({ message: "Database error creating contact" });
      }
      
      if (!data) {
        console.error("POST /api/contacts - No data returned after insert");
        return res.status(500).json({ message: "Failed to create contact (no data returned)" });
      }
      
      // Link historical calls
      const newContactId = data.id;
      console.log(`POST /api/contacts - Linking calls to new contact ID: ${newContactId}`);
      
      try {
        const { data: updatedCalls, error: updateError } = await supabase
          .from('calls')
          .update({ 
            contact_id: newContactId,
            updated_at: new Date().toISOString()
          })
          .eq('from_number', normalizedPhone)
          .is('contact_id', null);
        
        if (updateError) {
          console.error(`POST /api/contacts - Error linking calls:`, updateError);
        } else {
          const rowsAffected = updatedCalls ? (updatedCalls as any[]).length : 0;
          console.log(`POST /api/contacts - Linked ${rowsAffected} calls to new contact`);
        }
      } catch (linkError) {
        console.error(`POST /api/contacts - Error linking calls:`, linkError);
      }
      
      console.log("POST /api/contacts - Contact created successfully:", data);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("POST /api/contacts - Error:", error.message);
      res.status(500).json({ message: "Error creating contact" });
    }
  });

  // === CONTACT ACTIVITIES ROUTE ===
  app.get("/api/contacts/:contactId/all-activities", async (req: Request, res: Response) => {
    try {
      const { contactId } = req.params;
      // Using the "EMERGENCY_DEBUG" prefix for these logs for now to easily find them
      console.log(`EMERGENCY_DEBUG: GET /api/contacts/${contactId}/all-activities - Full Handler Reached`);
      console.log(`EMERGENCY_DEBUG: req.url: ${req.url}, req.originalUrl: ${req.originalUrl}, req.path: ${req.path}, req.params: ${JSON.stringify(req.params)}`);

      if (!contactId || isNaN(Number(contactId))) {
        console.error(`EMERGENCY_DEBUG: GET /api/contacts/${contactId}/all-activities - Invalid contactId`);
        return res.status(400).json({ message: "Invalid contact ID" });
      }
      const contactIdNum = Number(contactId);

      console.log(`EMERGENCY_DEBUG: GET /api/contacts/${contactIdNum}/all-activities - Fetching calls and activities for contact.`);
      const [callsResult, activitiesResult] = await Promise.all([
        supabase
          .from('calls')
          .select('id, created_at, direction, from_number, to_number, status, duration, call_sid')
          .eq('contact_id', contactIdNum)
          .order('created_at', { ascending: false }),
        supabase
          .from('activities')
          .select('id, created_at, title, description, completed, status, due_date, type')
          .eq('contact_id', contactIdNum)
          .in('type', ['task', 'note']) // Fetch both tasks and notes
          .order('created_at', { ascending: false })
      ]);

      if (callsResult.error) console.error(`EMERGENCY_DEBUG: Error fetching calls:`, callsResult.error);
      if (activitiesResult.error) console.error(`EMERGENCY_DEBUG: Error fetching activities:`, activitiesResult.error);

      if (callsResult.error && activitiesResult.error) {
        return res.status(500).json({ message: "Failed to fetch contact activities due to database errors."});
      }

      // Format calls
      const formattedCalls = (callsResult.data || []).map(call => ({
        id: `call-${call.id}`, 
        type: 'call', 
        timestamp: call.created_at,
        summary: `Call ${call.direction === 'inbound' ? 'from' : 'to'} ${call.direction === 'inbound' ? call.from_number : call.to_number}`,
        details: call
      }));
      
      // Process activities (tasks and notes)
      const activities = activitiesResult.data || [];
      const formattedActivities = activities.map(activity => {
        if (activity.type === 'task') {
          return {
            id: `task-${activity.id}`,
            type: 'task',
            timestamp: activity.created_at,
            summary: activity.title,
            details: activity
          };
        } else if (activity.type === 'note') {
          return {
            id: `note-${activity.id}`,
            type: 'note',
            timestamp: activity.created_at,
            summary: activity.title || (activity.description 
              ? activity.description.substring(0, 50) + (activity.description.length > 50 ? '...' : '') 
              : 'Note'),
            details: activity
          };
        }
        // Fallback for any other activity types
        return {
          id: `activity-${activity.id}`,
          type: activity.type || 'unknown',
          timestamp: activity.created_at,
          summary: activity.title || 'Activity',
          details: activity
        };
      });

      // Combine all activities and sort by timestamp
      const allActivities = [...formattedCalls, ...formattedActivities].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Count types for logging
      const taskCount = activities.filter(a => a.type === 'task').length;
      const noteCount = activities.filter(a => a.type === 'note').length;
      console.log(`EMERGENCY_DEBUG: GET /api/contacts/${contactIdNum}/all-activities - Found ${allActivities.length} total activities (${formattedCalls.length} calls, ${taskCount} tasks, ${noteCount} notes).`);
      
      res.status(200).json(allActivities);
    } catch (error: any) {
      console.error(`EMERGENCY_DEBUG: GET /api/contacts/:contactId/all-activities - UNEXPECTED ERROR:`, error.message, error.stack);
      res.status(500).json({ message: "Server error fetching contact activities" });
    }
  });

  // === CALL ROUTES ===
  app.post("/api/calls", async (req: Request, res: Response) => { // For manually logging calls (if needed)
    try {
      console.log("POST /api/calls - Request received. Body:", req.body);
      const { contact_id, call_type, duration, notes, agent, phone } = req.body;
      const { data: newCall, error } = await supabase
        .from('calls')
        .insert([{
          contact_id: contact_id ? parseInt(contact_id, 10) : null,
          call_type: call_type || 'unknown',
          duration: duration || 0,
          notes: notes || '',
          agent: agent || '',
          phone: phone || ''
        }])
        .select()
        .single();

      if (error) {
        console.error("POST /api/calls - Supabase error:", error);
        return res.status(500).json({ message: "Database error logging call" });
      }
      if (!newCall) {
        return res.status(500).json({ message: "Failed to log call (no data returned)" });
      }
      console.log("POST /api/calls - Call logged successfully:", newCall);
      res.status(201).json({
        status: "success",
        message: "Call logged successfully.",
        log_id: newCall.id.toString()
      });
    } catch (error: any) {
      console.error("POST /api/calls - Error logging call:", error.message, error.stack);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Error logging call" });
    }
  });

  app.get("/api/calls", async (req: Request, res: Response) => { // For fetching call logs
    try {
      console.log("GET /api/calls - Request received");
      const { data: callsData, error } = await supabase
        .from('calls')
        .select(`
          *,
          contacts (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("GET /api/calls - Supabase error fetching calls:", error);
        return res.status(500).json({ message: "Database error fetching calls" });
      }
      if (!callsData || callsData.length === 0) {
        console.log("GET /api/calls - No call records found");
        return res.status(200).json([]);
      }
      const callsWithContactInfo = callsData.map(call => ({
        id: call.id,
        call_sid: call.call_sid,
        direction: call.direction,
        from_number: call.from_number,
        to_number: call.to_number,
        status: call.status,
        duration: call.duration,
        created_at: call.created_at,
        updated_at: call.updated_at,
        contact_id: call.contact_id,
        contact_first_name: call.contacts ? call.contacts.first_name : null,
        contact_last_name: call.contacts ? call.contacts.last_name : null
      }));
      res.status(200).json(callsWithContactInfo);
    } catch (error: any) {
      console.error("GET /api/calls - Error fetching call records:", error.message, error.stack);
      res.status(500).json({ message: "Error fetching call records" });
    }
  });

  // === TASK ROUTES (from activities table) ===
  app.get("/api/tasks", async (req: Request, res: Response) => {
    console.log("GET /api/tasks - Handler reached. Fetching tasks from Supabase.");
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('activities')
        .select('*')
        .eq('type', 'task')
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error("GET /api/tasks - Supabase error fetching tasks:", tasksError.message, tasksError.details);
        return res.status(500).json({ message: "Database error fetching tasks", error: tasksError.message });
      }

      if (!tasksData) {
        console.log("GET /api/tasks - No tasks found, returning empty array.");
        return res.status(200).json([]);
      }

      console.log(`GET /api/tasks - Successfully fetched ${tasksData.length} tasks.`);
      res.status(200).json(tasksData);
    } catch (error: any) {
      console.error("GET /api/tasks - Unexpected error in handler:", error.message, error.stack);
      res.status(500).json({ message: "Internal server error fetching tasks", details: error.message });
    }
  });

  // PATCH /api/activities/:id - Update an existing activity (e.g., mark task as complete)
  app.patch("/api/activities/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    console.log(`PATCH /api/activities/${id} - Request received. Body:`, updates);

    if (!id) {
      console.warn("PATCH /api/activities/:id - Missing ID parameter.");
      return res.status(400).json({ message: "Activity ID parameter is required" });
    }

    if (Object.keys(updates).length === 0) {
      console.warn(`PATCH /api/activities/${id} - Empty request body.`);
      return res.status(400).json({ message: "Request body cannot be empty for update" });
    }

    try {
      // Ensure updated_at is set
      const updatesWithTimestamp = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      console.log(`PATCH /api/activities/${id} - Attempting to update activity in Supabase with:`, updatesWithTimestamp);
      const { data: updatedActivity, error } = await supabase
        .from('activities')
        .update(updatesWithTimestamp)
        .eq('id', id)
        .select()
        .single(); // .single() is important to get the updated record or null if not found/matches multiple (though id should be unique)

      if (error) {
        console.error(`PATCH /api/activities/${id} - Supabase error updating activity:`, error.message, error.details);
        // Check for specific error types, e.g., PostgREST error P0002 (row not found)
        if (error.code === 'PGRST204') { // PGRST204: No Rows Selected (often means record not found for update/delete)
            console.warn(`PATCH /api/activities/${id} - Activity not found for update.`);
            return res.status(404).json({ message: `Activity with ID ${id} not found` });
        }
        return res.status(500).json({ message: "Database error updating activity", error: error.message });
      }

      if (!updatedActivity) {
        // This case might also be covered by error.code PGRST204, but as a fallback:
        console.warn(`PATCH /api/activities/${id} - Activity not found or no changes made (no data returned).`);
        return res.status(404).json({ message: `Activity with ID ${id} not found or no update was performed` });
      }

      console.log(`PATCH /api/activities/${id} - Activity updated successfully:`, updatedActivity);
      res.status(200).json(updatedActivity);
    } catch (error: any) {
      console.error(`PATCH /api/activities/${id} - Unexpected error in handler:`, error.message, error.stack);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Internal server error updating activity", details: error.message });
    }
  });

  // You might need POST /api/activities (or /api/tasks if preferred) to create tasks
  // Example for POST /api/activities (can be adapted for tasks)
  app.post("/api/activities", async (req: Request, res: Response) => {
    try {
      console.log("POST /api/activities - Request received. Body:", req.body);
      
      // Validate with Zod (assuming insertActivitySchema is appropriate or a new one is made)
      // For now, we'll manually construct and ensure 'type' and defaults for tasks.
      // const validatedData = insertActivitySchema.parse(req.body);

      let activityPayload = { ...req.body };

      // If the client intends to create a task, ensure critical fields are set.
      // The client should ideally always send type: 'task'.
      if (activityPayload.type === 'task') {
        activityPayload = {
          status: 'pending', // Default status for new tasks
          completed: false,  // Default completion state for new tasks
          ...activityPayload, // Client-provided values will override defaults if present
          type: 'task',      // Ensure type is explicitly 'task'
        };
      } else if (!activityPayload.type) {
        // If type is not specified at all by the client, and this endpoint is generic,
        // this could be an issue. For creating a TASK specifically, client MUST send type: 'task'.
        // If this endpoint is ONLY for tasks, then uncomment below:
        // activityPayload.type = 'task';
        // activityPayload.status = activityPayload.status || 'pending';
        // activityPayload.completed = activityPayload.completed === undefined ? false : activityPayload.completed;
        // However, for now, we'll assume client sends type: 'task' for tasks.
      }
      
      // Ensure due_date is either a valid ISO string or null.
      // Supabase might handle invalid date strings by erroring or setting to null depending on column type.
      // It's good practice to validate/sanitize dates.
      if (activityPayload.due_date && isNaN(new Date(activityPayload.due_date).getTime())) {
        console.warn("POST /api/activities - Invalid due_date received:", activityPayload.due_date);
        activityPayload.due_date = null; // Or handle as an error
      }


      const { data: newActivity, error } = await supabase
          .from('activities')
          .insert([activityPayload]) // insert expects an array
          .select()
          .single();

      if (error) {
          console.error("POST /api/activities - Supabase error creating activity:", error);
          // More specific error handling based on Supabase error codes can be added
          // e.g., if (error.code === '23505') { /* unique constraint violation */ }
          return res.status(500).json({ message: "Database error creating activity", details: error.message });
      }
      if (!newActivity) {
          // This case should ideally be caught by the Supabase error above
          return res.status(500).json({ message: "Failed to create activity (no data returned)" });
      }
      console.log("POST /api/activities - Activity created successfully:", newActivity);
      res.status(201).json(newActivity);
    } catch (error: any) {
        console.error("POST /api/activities - Unexpected error in handler:", error.message, error.stack);
        if (error instanceof ZodError) {
            // Make sure you have `insertActivitySchema` defined and imported for this to work
            // return res.status(400).json({ message: fromZodError(error).message });
            return res.status(400).json({ message: "Invalid data format for activity.", details: fromZodError(error).toString() });
        }
        res.status(500).json({ message: "Internal server error creating activity", details: error.message });
    }
  });


  // === STATS ROUTES ===
  app.get("/api/stats/overview", async (req: Request, res: Response) => {
    console.log("GET /api/stats/overview - Handler reached. Fetching overview statistics from Supabase.");
    try {
      // Define the date for "recent" calls (e.g., last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      console.log("GET /api/stats/overview - Initiating parallel Supabase queries.");
      console.log('GET /api/stats/overview - "deals" table query intentionally skipped as table does not exist.');

      const [
        { data: contactsData, error: contactsError, count: activeContactsCount },
        { data: tasksData, error: tasksError, count: pendingTasksCount },
        { data: callsData, error: callsError, count: recentCallsCount }
      ] = await Promise.all([
        supabase.from('contacts').select('*', { count: 'exact', head: true }), // Count active contacts
        supabase.from('activities').select('*', { count: 'exact', head: true }).eq('type', 'task').neq('status', 'completed'), // Count pending tasks
        supabase.from('calls').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()) // Count calls in the last 7 days
      ]);

      console.log("GET /api/stats/overview - Supabase queries completed.");

      if (contactsError) {
        console.error("GET /api/stats/overview - Supabase error fetching contacts count:", contactsError.message, contactsError.details);
        // Decide if you want to fail the whole request or return partial data
      }
      if (tasksError) {
        console.error("GET /api/stats/overview - Supabase error fetching pending tasks count:", tasksError.message, tasksError.details);
      }
      if (callsError) {
        console.error("GET /api/stats/overview - Supabase error fetching recent calls count:", callsError.message, callsError.details);
      }
      
      // Consolidate potential errors for a single error response if any query failed critically
      const errors = [contactsError, tasksError, callsError].filter(Boolean);
      if (errors.length > 0) {
          console.error(`GET /api/stats/overview - Encountered ${errors.length} errors during Supabase queries. First error:`, errors[0]?.message);
          // It might be better to throw a single error here or construct a more specific error response
          // For now, returning a generic error if any part fails.
          return res.status(500).json({ message: "Database error fetching overview statistics", details: errors.map(e => e?.message).join(', ') });
      }

      // Hardcode deals-related values
      const activeDeals = 0;
      const totalRevenue = 0;
      console.log('GET /api/stats/overview - Using hardcoded values: activeDeals=0, totalRevenue=0');

      const stats = {
        activeContacts: activeContactsCount || 0,
        activeDeals: activeDeals,
        pendingTasks: pendingTasksCount || 0,
        recentCalls: recentCallsCount || 0,
        totalRevenue: totalRevenue
      };

      console.log("GET /api/stats/overview - Successfully compiled stats:", stats);
      res.status(200).json(stats);

    } catch (error: any) {
      console.error("GET /api/stats/overview - Unexpected error in handler:", error.message, error.stack);
      res.status(500).json({ message: "Internal server error fetching overview statistics", details: error.message });
    }
  });

  // === DEBUG ROUTES ===
  app.get("/api/debug", (req: Request, res: Response) => {
    console.log("GET /api/debug - Request received");
    res.json({ message: "API server is running correctly" });
  });

  app.get("/api/debug/supabase", async (req: Request, res: Response) => {
    try {
      console.log("GET /api/debug/supabase - Request received");
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .limit(1);
      if (error) {
        console.error("GET /api/debug/supabase - Supabase connection error:", error);
        return res.status(500).json({
          status: "error",
          message: "Failed to connect to Supabase",
          error: error.message
        });
      }
      res.json({
        status: "success",
        message: "Supabase connection is working",
        data
      });
    } catch (error: any) {
      console.error("GET /api/debug/supabase - Error testing Supabase connection:", error.message, error.stack);
      res.status(500).json({
        status: "error",
        message: "Internal server error while testing Supabase connection"
      });
    }
  });

  // =========== TWILIO ROUTES ===========
  console.log("Registering Twilio routes...");
  const voiceWebhookUrl = process.env.TWILIO_WEBHOOK_BASE_URL || (process.env.API_URL ? `${process.env.API_URL}/api/twilio/voice` : '');
  console.log(`Twilio VOICE webhook URL for validation: ${voiceWebhookUrl}`);
  app.post("/api/twilio/voice", twilioWebhook(voiceWebhookUrl), handleVoiceWebhook);
  console.log("Registered POST /api/twilio/voice route");

  // Get the status callback URL 
  const statusCallbackUrl = process.env.TWILIO_STATUS_CALLBACK_URL || `${process.env.API_URL || ''}/api/twilio/status-callback`;
  console.log(`Twilio STATUS CALLBACK URL for validation: ${statusCallbackUrl}`);

  // Old route with validation
  // app.post("/api/twilio/status-callback", twilioWebhook(statusCallbackUrl), handleStatusCallback);

  // New route with pre-middleware logging 
  app.post("/api/twilio/status-callback", (req: Request, res: Response, next: any) => {
    console.log("[STATUS_CALLBACK_ROUTE] Request received at path /api/twilio/status-callback before middleware.");
    console.log("[STATUS_CALLBACK_ROUTE] Request IP:", req.ip || 'unknown');
    console.log("[STATUS_CALLBACK_ROUTE] Request headers:", JSON.stringify(req.headers, null, 2));
    console.log("[STATUS_CALLBACK_ROUTE] Request body (raw):", JSON.stringify(req.body, null, 2));
    next();
  }, async (req: Request, res: Response) => {
    console.log("[STATUS_CALLBACK_ROUTE] STATUS CALLBACK ROUTE HIT - DIRECT HANDLER");
    try {
      await handleStatusCallback(req, res);
    } catch (error: any) {
      console.error("[STATUS_CALLBACK_ROUTE] CRITICAL: Unhandled error in status-callback route:", error.message, error.stack);
      if (!res.headersSent) {
        res.status(500).send("Server error");
      }
    }
  });
  console.log("Registered POST /api/twilio/status-callback route with pre-middleware logging");
  
  // Add a simple echo route to test if Twilio can reach the server
  app.post("/api/twilio/echo-test", (req: Request, res: Response) => {
    console.log("[ECHO_TEST] Echo test route hit. Headers:", JSON.stringify(req.headers, null, 2));
    console.log("[ECHO_TEST] Echo test body:", JSON.stringify(req.body, null, 2));
    res.status(200).json({
      message: "Echo test successful",
      receivedAt: new Date().toISOString(),
      headers: req.headers,
      body: req.body
    });
  });
  console.log("Registered POST /api/twilio/echo-test route for connectivity testing");
  
  // Add a test endpoint to manually update call duration
  app.post("/api/test/update-call", async (req: Request, res: Response) => {
    try {
      const { callId, duration, status } = req.body;
      
      if (!callId) {
        return res.status(400).json({ message: "callId is required" });
      }
      
      console.log(`[TEST_UPDATE] Attempting to update call ID ${callId} with duration=${duration}, status=${status}`);
      
      // Create minimal update payload
      const updatePayload: any = {
        updated_at: new Date().toISOString()
      };
      
      // Only add fields that were provided
      if (duration !== undefined) {
        updatePayload.duration = parseInt(duration, 10);
      }
      
      if (status) {
        updatePayload.status = status;
      }
      
      console.log(`[TEST_UPDATE] Update payload:`, JSON.stringify(updatePayload, null, 2));
      
      // Attempt the update
      const { data, error } = await supabase
        .from('calls')
        .update(updatePayload)
        .eq('id', callId)
        .select();
      
      if (error) {
        console.error(`[TEST_UPDATE] Error updating call:`, error);
        return res.status(500).json({ message: "Error updating call", error: error.message });
      }
      
      console.log(`[TEST_UPDATE] Update successful. Response:`, JSON.stringify(data, null, 2));
      res.status(200).json({ message: "Call updated successfully", data });
    } catch (error: any) {
      console.error(`[TEST_UPDATE] Unexpected error:`, error);
      res.status(500).json({ message: "Unexpected error", error: error.message });
    }
  });
  console.log("Registered POST /api/test/update-call route for testing call updates");
  
  // Add a test endpoint to manually update a call record by CallSid
  app.post("/api/test/update-call-by-sid", async (req: Request, res: Response) => {
    try {
      const { callSid, duration, status, parentCallSid } = req.body;
      
      if (!callSid && !parentCallSid) {
        return res.status(400).json({ message: "Either callSid or parentCallSid is required" });
      }
      
      // Create minimal update payload
      const updatePayload: any = {
        updated_at: new Date().toISOString()
      };
      
      // Only add fields that were provided
      if (duration !== undefined) {
        updatePayload.duration = parseInt(duration, 10);
      }
      
      if (status) {
        updatePayload.status = status;
      }
      
      console.log(`[TEST_UPDATE_SID] Update payload:`, JSON.stringify(updatePayload, null, 2));
      
      let data, error;
      
      // First, try to find and update using the provided SID
      if (callSid) {
        console.log(`[TEST_UPDATE_SID] Attempting to update call with SID ${callSid}`);
        
        const result = await supabase
          .from('calls')
          .update(updatePayload)
          .eq('call_sid', callSid)
          .select();
        
        data = result.data;
        error = result.error;
        
        if (error) {
          console.error(`[TEST_UPDATE_SID] Error updating call by SID:`, error);
        } else if (data && data.length > 0) {
          console.log(`[TEST_UPDATE_SID] Successfully updated call with SID ${callSid}`);
        } else {
          console.log(`[TEST_UPDATE_SID] No calls found with SID ${callSid}`);
        }
      }
      
      // If parentCallSid was provided, try to update using that too
      if (parentCallSid && (!data || data.length === 0)) {
        console.log(`[TEST_UPDATE_SID] Attempting to update call with parent SID ${parentCallSid}`);
        
        const parentResult = await supabase
          .from('calls')
          .update(updatePayload)
          .eq('call_sid', parentCallSid)
          .select();
        
        if (parentResult.error) {
          console.error(`[TEST_UPDATE_SID] Error updating call by parent SID:`, parentResult.error);
          // Only update error if we haven't already had an error
          if (!error) error = parentResult.error;
        } else if (parentResult.data && parentResult.data.length > 0) {
          console.log(`[TEST_UPDATE_SID] Successfully updated call with parent SID ${parentCallSid}`);
          data = parentResult.data;
        } else {
          console.log(`[TEST_UPDATE_SID] No calls found with parent SID ${parentCallSid}`);
        }
      }
      
      // List all calls to help with debugging
      console.log(`[TEST_UPDATE_SID] Listing all recent calls for reference:`);
      const { data: allCalls } = await supabase
        .from('calls')
        .select('id, call_sid, status, duration, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      console.log(`[TEST_UPDATE_SID] Recent calls:`, JSON.stringify(allCalls, null, 2));
      
      if (error) {
        return res.status(500).json({ message: "Error updating call", error: error.message, allCalls });
      }
      
      if (!data || data.length === 0) {
        return res.status(404).json({ message: "No matching call found", searchedSids: { callSid, parentCallSid }, allCalls });
      }
      
      res.status(200).json({ message: "Call updated successfully", data, allCalls });
    } catch (error: any) {
      console.error(`[TEST_UPDATE_SID] Unexpected error:`, error);
      res.status(500).json({ message: "Unexpected error", error: error.message });
    }
  });
  console.log("Registered POST /api/test/update-call-by-sid route for testing call SID updates");
  
  // New route for generating Twilio client tokens
  app.get("/api/twilio/token", generateTwilioToken);
  console.log("Registered GET /api/twilio/token route");

  // New route for handling outbound calls from the browser client
  app.post("/api/twilio/outbound-voice-twiml", async (req: Request, res: Response) => {
    const outboundCallSid = req.body.CallSid || 'UNKNOWN_SID';
    
    console.log(`[${outboundCallSid}] POST /api/twilio/outbound-voice-twiml - START - Request received`);
    console.log(`[${outboundCallSid}] IMPORTANT: This is the PARENT LEG (client->Twilio) of a two-leg call`);
    console.log(`[${outboundCallSid}] Complete request body:`, JSON.stringify(req.body, null, 2));

    try {
      // 1. Extract parameters from Twilio's POST
      const destinationNumber = req.body.To;
      const clientIdentity = req.body.From; // e.g., "client:agent1"
      const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
      
      console.log(`[${outboundCallSid}] Extracted parameters:`);
      console.log(`[${outboundCallSid}] - To (destination): "${destinationNumber}"`);
      console.log(`[${outboundCallSid}] - From (client): "${clientIdentity}"`);
      console.log(`[${outboundCallSid}] - CallSid (PARENT leg): "${outboundCallSid}"`);
      console.log(`[${outboundCallSid}] - Using caller ID from env: "${twilioPhoneNumber}"`);

      if (!twilioPhoneNumber) {
        console.error(`[${outboundCallSid}] CRITICAL WARNING: Missing TWILIO_PHONE_NUMBER in environment variables`);
        // Continue anyway, but log the error
      }

      if (!destinationNumber) {
        console.error(`[${outboundCallSid}] ERROR: Missing 'To' parameter in request body`);
        return res.status(400).send("<Response><Say>Missing destination phone number</Say></Response>");
      }

      if (!outboundCallSid || outboundCallSid === 'UNKNOWN_SID') {
        console.error(`[${outboundCallSid}] ERROR: Missing 'CallSid' parameter in request body`);
        // We'll still proceed but this is unusual and might cause issues with call tracking
      }

      // 2. Contact Lookup (Optional but recommended)
      console.log(`[${outboundCallSid}] Performing contact lookup for number: ${destinationNumber}`);
      let foundContactId: number | null = null;
      try {
        const normalizedPhone = normalizePhone(destinationNumber);
        console.log(`[${outboundCallSid}] Normalized phone for lookup: ${normalizedPhone}`);
        
        const { data: contacts, error: contactError } = await supabase
          .from('contacts')
          .select('id, first_name, last_name')
          .or(`phone.ilike.%${normalizedPhone}%,phone.ilike.%${destinationNumber}%`)
          .limit(1);

        if (contactError) {
          console.error(`[${outboundCallSid}] Supabase contact SELECT error:`, contactError.message);
          console.error(`[${outboundCallSid}] Contact lookup error details:`, contactError.details || '');
        } else if (contacts && contacts.length > 0) {
          foundContactId = contacts[0].id;
          console.log(`[${outboundCallSid}] Contact found: ID=${foundContactId}, Name=${contacts[0].first_name} ${contacts[0].last_name}`);
        } else {
          console.log(`[${outboundCallSid}] No contact found for outbound call to ${destinationNumber}`);
        }
      } catch (lookupError: any) {
        console.error(`[${outboundCallSid}] Error during contact lookup:`, lookupError.message, lookupError.stack);
        // We'll continue despite lookup errors to ensure the call goes through
      }

      // 3. Insert a new record into the Supabase `calls` table
      console.log(`[${outboundCallSid}] Preparing to INSERT call record into Supabase...`);
      
      let dbRecordId: number | null = null;
      let insertSuccess = false;
      
      try {
        // Create the call record object with all required fields
        const callData = {
          call_sid: outboundCallSid,
          direction: 'outbound',
          from_number: twilioPhoneNumber || 'unknown', // Fallback if env var is missing
          to_number: destinationNumber,
          contact_id: foundContactId, // This will be null if no contact was found
          status: 'initiated',
          duration: 0,
          call_type: 'outbound',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log(`[${outboundCallSid}] Call data payload for Supabase insert:`, JSON.stringify(callData, null, 2));
        
        // Perform the insert with retry logic
        let retryCount = 0;
        const maxRetries = 2;
        
        while (!insertSuccess && retryCount <= maxRetries) {
          try {
            if (retryCount > 0) {
              console.log(`[${outboundCallSid}] Retrying Supabase insert (attempt ${retryCount})`);
            }
            
            const insertResult = await supabase
              .from('calls')
              .insert([callData])
              .select();
            
            const { data: newCallRecords, error: insertError } = insertResult;
            
            if (insertError) {
              console.error(`[${outboundCallSid}] Supabase call log INSERT error:`, insertError.message);
              console.error(`[${outboundCallSid}] INSERT error details:`, insertError.details || '');
              
              // Check for specific error types that might indicate a transient issue
              if (insertError.code === '23505') { // Unique constraint violation
                console.log(`[${outboundCallSid}] Duplicate record detected, call may already be logged. Continuing...`);
                
                // Try to get the existing record ID for logging purposes
                try {
                  const { data: existingData } = await supabase
                    .from('calls')
                    .select('id')
                    .eq('call_sid', outboundCallSid)
                    .single();
                    
                  if (existingData) {
                    dbRecordId = existingData.id;
                    console.log(`[${outboundCallSid}] Found existing record with ID: ${dbRecordId}`);
                  }
                } catch (lookupErr) {
                  console.error(`[${outboundCallSid}] Error looking up existing record:`, lookupErr);
                }
                
                insertSuccess = true; // Consider it a success if it's already in the database
                break;
              }
              
              retryCount++;
              // Add a small delay before retrying
              await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
            } else {
              if (newCallRecords && newCallRecords.length > 0) {
                dbRecordId = newCallRecords[0].id;
                console.log(`[${outboundCallSid}] Successfully INSERTED outbound call to Supabase. DB Record ID: ${dbRecordId}`);
              } else {
                console.warn(`[${outboundCallSid}] INSERT succeeded but no records returned`);
              }
              insertSuccess = true;
              break;
            }
          } catch (retryError: any) {
            console.error(`[${outboundCallSid}] Error during Supabase insert retry:`, retryError.message);
            console.error(`[${outboundCallSid}] Retry error stack:`, retryError.stack);
            retryCount++;
            // Add a small delay before retrying
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
          }
        }
        
        if (!insertSuccess) {
          console.error(`[${outboundCallSid}] CRITICAL: Failed to insert call record after ${maxRetries} retries`);
        }
      } catch (insertError: any) {
        console.error(`[${outboundCallSid}] CRITICAL ERROR inserting outbound call log:`, insertError.message);
        console.error(`[${outboundCallSid}] Full error stack:`, insertError.stack);
        // Continue to provide TwiML even if logging fails
      }

      // 4. Generate TwiML to instruct Twilio to dial the number
      console.log(`[${outboundCallSid}] Generating TwiML response...`);
      const twiml = new twilio.twiml.VoiceResponse();
      
      // Get the status callback URL 
      const statusCallbackUrl = process.env.TWILIO_STATUS_CALLBACK_URL || `${process.env.API_URL || ''}/api/twilio/status-callback`;
      console.log(`[${outboundCallSid}] Using status callback URL: ${statusCallbackUrl}`);
      
      // Create the simplest possible <Dial> to establish a baseline of compatibility
      // No status callbacks - we'll add those later once we confirm basic dialing works
      const dialOptions = {
        callerId: twilioPhoneNumber || '', // Empty string if env var is missing
        // Restoring status callback attributes with proper formatting
        statusCallback: statusCallbackUrl,
        statusCallbackEvent: 'initiated ringing answered completed' // Space-separated string format
      };
      
      console.log(`[${outboundCallSid}] Adding back status callbacks to TwiML`);
      console.log(`[${outboundCallSid}] Dial options:`, JSON.stringify(dialOptions, null, 2));
      
      // Simple dial without status callbacks
      twiml.dial(dialOptions, destinationNumber);
      
      console.log(`[${outboundCallSid}] Generated TwiML:`, twiml.toString());
      
      // 5. Set content type and send the TwiML response
      res.type('text/xml');
      res.send(twiml.toString());
      console.log(`[${outboundCallSid}] TwiML response sent successfully`);
      console.log(`[${outboundCallSid}] POST /api/twilio/outbound-voice-twiml - END - Handler completed ` + 
                 (insertSuccess ? `(call logged, DB ID: ${dbRecordId})` : `(WARNING: call logging failed)`));

    } catch (error: any) {
      console.error(`[${outboundCallSid}] CRITICAL ERROR in outbound-voice-twiml handler:`, error.message);
      console.error(`[${outboundCallSid}] Full error stack:`, error.stack);

      try {
        // Provide a fallback TwiML response in case of error
        const errorTwiml = new twilio.twiml.VoiceResponse();
        errorTwiml.say("An error occurred while processing your call request. Please try again later.");
        
        console.error(`[${outboundCallSid}] Sending error TwiML response`);
        res.type('text/xml');
        res.status(500).send(errorTwiml.toString());
        console.error(`[${outboundCallSid}] Error TwiML response sent`);
      } catch (twimlError: any) {
        console.error(`[${outboundCallSid}] FAILED to create or send error TwiML:`, twimlError.message);
        if (!res.headersSent) {
          res.status(500).send("Internal server error");
        }
      }
      
      console.log(`[${outboundCallSid}] POST /api/twilio/outbound-voice-twiml - END - Handler failed with errors`);
    }
  });
  console.log("Registered POST /api/twilio/outbound-voice-twiml route");

  // Test routes (consider removing for production or securing them)
  // app.post("/api/test/twilio/voice", handleVoiceWebhook);
  // app.post("/api/test/twilio/status-callback", handleStatusCallback);

  // === LINK CALL TO CONTACT ROUTE ===
  app.patch("/api/calls/:callId/link-contact", async (req: Request, res: Response) => {
    try {
      const { callId } = req.params;
      const { contact_id } = req.body;
      
      console.log(`PATCH /api/calls/${callId}/link-contact - Request received. Body:`, req.body);
      
      // Validate callId
      if (!callId || isNaN(Number(callId))) {
        console.error(`PATCH /api/calls/${callId}/link-contact - Invalid callId`);
        return res.status(400).json({ message: "Invalid call ID" });
      }
      
      // Validate contact_id 
      if (!contact_id || isNaN(Number(contact_id))) {
        console.error(`PATCH /api/calls/${callId}/link-contact - Invalid or missing contact_id`);
        return res.status(400).json({ message: "contact_id is required and must be a valid number" });
      }
      
      const callIdNum = Number(callId);
      const contactIdNum = Number(contact_id);
      
      // First check if call exists
      const { data: existingCall, error: checkError } = await supabase
        .from('calls')
        .select('id, from_number') // Also get from_number for later use
        .eq('id', callIdNum)
        .single();
      
      if (checkError || !existingCall) {
        console.error(`PATCH /api/calls/${callId}/link-contact - Call not found:`, checkError);
        return res.status(404).json({ message: `Call with ID ${callId} not found` });
      }
      
      // Store the from_number for historical linking
      const fromNumberToLink = existingCall.from_number;
      
      // Check if contact exists
      const { data: existingContact, error: contactCheckError } = await supabase
        .from('contacts')
        .select('id')
        .eq('id', contactIdNum)
        .single();
      
      if (contactCheckError || !existingContact) {
        console.error(`PATCH /api/calls/${callId}/link-contact - Contact not found:`, contactCheckError);
        return res.status(404).json({ message: `Contact with ID ${contact_id} not found` });
      }
      
      // Update the call with the contact_id
      const { data, error } = await supabase
        .from('calls')
        .update({ 
          contact_id: contactIdNum,
          updated_at: new Date().toISOString()
        })
        .eq('id', callIdNum)
        .select('*, contacts(first_name, last_name)')
        .single();
      
      if (error) {
        console.error(`PATCH /api/calls/${callId}/link-contact - Update error:`, error);
        return res.status(500).json({ message: "Error updating call with contact ID" });
      }
      
      console.log(`PATCH /api/calls/${callId}/link-contact - Call updated successfully:`, data);
      
      // Now update other historical calls with the same phone number
      if (fromNumberToLink) {
        console.log(`PATCH /api/calls/${callId}/link-contact - Attempting to link other historical calls with phone: ${fromNumberToLink} to contact ID: ${contactIdNum}`);
        
        try {
          const { data: updatedCalls, error: bulkUpdateError } = await supabase
            .from('calls')
            .update({
              contact_id: contactIdNum,
              updated_at: new Date().toISOString()
            })
            .eq('from_number', fromNumberToLink)
            .is('contact_id', null)
            .neq('id', callIdNum); // Exclude the call we just updated
          
          if (bulkUpdateError) {
            console.error(`PATCH /api/calls/${callId}/link-contact - Error linking other historical calls:`, bulkUpdateError);
          } else {
            const rowsAffected = updatedCalls ? (updatedCalls as any[]).length : 0;
            console.log(`PATCH /api/calls/${callId}/link-contact - Successfully linked other historical calls. Rows affected: ${rowsAffected}`);
          }
        } catch (linkError) {
          console.error(`PATCH /api/calls/${callId}/link-contact - Unexpected error linking other historical calls:`, linkError);
          // We'll still return success for the primary call update even if bulk linking fails
        }
      } else {
        console.log(`PATCH /api/calls/${callId}/link-contact - No from_number available for historical linking`);
      }
      
      // Transform the data to match the expected format
      const responseData = {
        ...data,
        contact_first_name: data.contacts ? data.contacts.first_name : null,
        contact_last_name: data.contacts ? data.contacts.last_name : null
      };
      
      res.status(200).json(responseData);
    } catch (error: any) {
      console.error(`PATCH /api/calls/:callId/link-contact - Unexpected error:`, error.message, error.stack);
      res.status(500).json({ message: "Server error processing link contact request" });
    }
  });

  const httpServer = createServer(app);
  console.log("All routes registered successfully");
  return httpServer;
}