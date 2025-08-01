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
import { protectRoute, type AuthenticatedRequest } from "./middleware/authMiddleware.js";
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
        id: contact.id,
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
  
  // Dedicated endpoint for looking up contacts by phone
  app.get("/api/contacts/lookup-by-phone", async (req: Request, res: Response) => {
    try {
      const { phone } = req.query;
      if (!phone || typeof phone !== 'string') {
        return res.status(400).json({ message: "Phone parameter is required" });
      }
      
      console.log(`GET /api/contacts/lookup-by-phone - Looking up contact with phone: ${phone}`);
      const normalizedPhone = normalizePhone(phone);
      
      // Search with normalized and original phone for flexibility
      const { data: contactsData, error } = await supabase
        .from('contacts')
        .select('*')
        .or(`phone.ilike.%${normalizedPhone}%,phone.ilike.%${phone}%`);

      if (error) {
        console.error("GET /api/contacts/lookup-by-phone - Supabase error:", error);
        return res.status(500).json({ message: "Database error looking up contact" });
      }
      
      if (!contactsData || contactsData.length === 0) {
        console.log("GET /api/contacts/lookup-by-phone - No contacts found");
        return res.status(404).json({ message: "No contact found with this phone number" });
      }
      
      const contact = contactsData[0];
      console.log("GET /api/contacts/lookup-by-phone - Contact found:", contact);
      
      res.status(200).json(contact);
    } catch (error: any) {
      console.error("GET /api/contacts/lookup-by-phone - Error in contact lookup:", error.message, error.stack);
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
      // First, get the existing activity to check its type
      const { data: existingActivity, error: fetchError } = await supabase
        .from('activities')
        .select('type')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error(`PATCH /api/activities/${id} - Error fetching existing activity:`, fetchError);
        if (fetchError.code === 'PGRST116') {
          return res.status(404).json({ message: `Activity with ID ${id} not found` });
        }
        return res.status(500).json({ message: "Database error fetching activity", error: fetchError.message });
      }

      // Validate event-specific updates if this is an event
      if (existingActivity.type === 'event' || updates.type === 'event') {
        // Validate start_datetime if being updated
        if (updates.start_datetime && isNaN(new Date(updates.start_datetime).getTime())) {
          return res.status(400).json({ message: "Invalid start_datetime format" });
        }
        
        // Validate end_datetime if being updated
        if (updates.end_datetime && isNaN(new Date(updates.end_datetime).getTime())) {
          return res.status(400).json({ message: "Invalid end_datetime format" });
        }
        
        // Ensure end_datetime is after start_datetime if both are provided
        if (updates.start_datetime && updates.end_datetime) {
          const startDate = new Date(updates.start_datetime);
          const endDate = new Date(updates.end_datetime);
          if (endDate <= startDate) {
            return res.status(400).json({ message: "end_datetime must be after start_datetime" });
          }
        }
      }

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
        .select(`
          *,
          contacts:contact_id(id, first_name, last_name, phone, email),
          companies:company_id(id, company_name, industry)
        `)
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

  // DELETE /api/activities/:id - Delete an activity
  app.delete("/api/activities/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log(`DELETE /api/activities/${id} - Request received.`);

    if (!id) {
      console.warn("DELETE /api/activities/:id - Missing ID parameter.");
      return res.status(400).json({ message: "Activity ID parameter is required" });
    }

    try {
      // First, check if the activity exists
      const { data: existingActivity, error: checkError } = await supabase
        .from('activities')
        .select('id, type')
        .eq('id', id)
        .single();
      
      if (checkError) {
        console.error(`DELETE /api/activities/${id} - Supabase error checking activity existence:`, checkError.message);
        if (checkError.code === 'PGRST116') { // Not found
          return res.status(404).json({ message: `Activity with ID ${id} not found` });
        }
        return res.status(500).json({ message: "Database error checking activity existence", error: checkError.message });
      }
      
      if (!existingActivity) {
        console.warn(`DELETE /api/activities/${id} - Activity not found.`);
        return res.status(404).json({ message: `Activity with ID ${id} not found` });
      }
      
      console.log(`DELETE /api/activities/${id} - Found activity of type: ${existingActivity.type}. Proceeding with deletion.`);
      
      // Delete the activity
      const { error: deleteError } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error(`DELETE /api/activities/${id} - Supabase error deleting activity:`, deleteError.message, deleteError.details);
        return res.status(500).json({ message: "Database error deleting activity", error: deleteError.message });
      }

      console.log(`DELETE /api/activities/${id} - Activity deleted successfully.`);
      res.status(200).json({ message: `Activity with ID ${id} deleted successfully` });
    } catch (error: any) {
      console.error(`DELETE /api/activities/${id} - Unexpected error in handler:`, error.message, error.stack);
      res.status(500).json({ message: "Internal server error deleting activity", details: error.message });
    }
  });

  // You might need POST /api/activities (or /api/tasks if preferred) to create tasks
  // Example for POST /api/activities (can be adapted for tasks)
  app.post("/api/activities", async (req: Request, res: Response) => {
    try {
      console.log("[POST_ACTIVITIES] Request received. Full body:", JSON.stringify(req.body, null, 2));
      console.log("[POST_ACTIVITIES] Request body type field:", typeof req.body.type, "value:", req.body.type);
      
      // Validate with Zod (assuming insertActivitySchema is appropriate or a new one is made)
      // For now, we'll manually construct and ensure 'type' and defaults for tasks.
      // const validatedData = insertActivitySchema.parse(req.body);

      let activityPayload = { ...req.body };
      console.log("[POST_ACTIVITIES] Initial activityPayload:", JSON.stringify(activityPayload, null, 2));

      // If the client intends to create a task, ensure critical fields are set.
      // The client should ideally always send type: 'task'.
      if (activityPayload.type === 'task') {
        console.log("[POST_ACTIVITIES] Processing task creation");
        
        // For tasks, ensure start_datetime is not included or is null
        // since it's now nullable but not relevant for tasks
        if (activityPayload.start_datetime !== undefined) {
          console.log("[POST_ACTIVITIES] Removing start_datetime for task (not applicable)");
          delete activityPayload.start_datetime;
        }
        
        // For tasks, ensure end_datetime is not included
        if (activityPayload.end_datetime !== undefined) {
          console.log("[POST_ACTIVITIES] Removing end_datetime for task (not applicable)");
          delete activityPayload.end_datetime;
        }
        
        activityPayload = {
          status: 'pending', // Default status for new tasks
          completed: false,  // Default completion state for new tasks
          ...activityPayload, // Client-provided values will override defaults if present
          type: 'task',      // Ensure type is explicitly 'task'
        };
        
        console.log("[POST_ACTIVITIES] Final task payload after processing:", JSON.stringify(activityPayload, null, 2));
      } else if (activityPayload.type === 'event') {
        // For events, validate required fields and set defaults
        console.log("[POST_ACTIVITIES] Processing event creation:", activityPayload);
        
        // Validate required fields for events
        if (!activityPayload.title) {
          console.error("[POST_ACTIVITIES] Missing title for event");
          return res.status(400).json({ message: "Title is required for events" });
        }
        
        if (!activityPayload.start_datetime) {
          console.error("[POST_ACTIVITIES] Missing start_datetime for event");
          return res.status(400).json({ message: "start_datetime is required for events" });
        }
        
        // Validate start_datetime format
        if (isNaN(new Date(activityPayload.start_datetime).getTime())) {
          console.error("[POST_ACTIVITIES] Invalid start_datetime format:", activityPayload.start_datetime);
          return res.status(400).json({ message: "Invalid start_datetime format" });
        }
        
        // Validate end_datetime if provided
        if (activityPayload.end_datetime && isNaN(new Date(activityPayload.end_datetime).getTime())) {
          console.error("[POST_ACTIVITIES] Invalid end_datetime format:", activityPayload.end_datetime);
          return res.status(400).json({ message: "Invalid end_datetime format" });
        }
        
        // Ensure end_datetime is after start_datetime if both are provided
        if (activityPayload.end_datetime) {
          const startDate = new Date(activityPayload.start_datetime);
          const endDate = new Date(activityPayload.end_datetime);
          if (endDate <= startDate) {
            console.error("[POST_ACTIVITIES] end_datetime is not after start_datetime");
            return res.status(400).json({ message: "end_datetime must be after start_datetime" });
          }
        }
        
        // For events, ensure task-specific fields are not included
        if (activityPayload.due_date !== undefined) {
          console.log("[POST_ACTIVITIES] Removing due_date for event (not applicable)");
          delete activityPayload.due_date;
        }
        
        if (activityPayload.completed !== undefined) {
          console.log("[POST_ACTIVITIES] Removing completed for event (not applicable)");
          delete activityPayload.completed;
        }
        
        if (activityPayload.priority !== undefined) {
          console.log("[POST_ACTIVITIES] Removing priority for event (not applicable)");
          delete activityPayload.priority;
        }
        
        activityPayload = {
          status: 'pending', // Default status for new events
          ...activityPayload, // Client-provided values will override defaults if present
          type: 'event',     // Ensure type is explicitly 'event' (lowercase)
        };
        console.log("[POST_ACTIVITIES] Final event payload after processing:", JSON.stringify(activityPayload, null, 2));
      } else if (activityPayload.type === 'note') {
        // For notes, just log that we're creating a note
        console.log("[POST_ACTIVITIES] Creating note activity for contact:", activityPayload.contact_id);
        // Remove call_sid if present since database doesn't support it
        if (activityPayload.call_sid) {
          console.log("[POST_ACTIVITIES] Note: call_sid provided but not stored in database:", activityPayload.call_sid);
          delete activityPayload.call_sid;
        }
      } else if (!activityPayload.type) {
        // If type is not specified at all by the client, and this endpoint is generic,
        // this could be an issue. For creating a TASK specifically, client MUST send type: 'task'.
        // If this endpoint is ONLY for tasks, then uncomment below:
        // activityPayload.type = 'task';
        // activityPayload.status = activityPayload.status || 'pending';
        // activityPayload.completed = activityPayload.completed === undefined ? false : activityPayload.completed;
        // However, for now, we'll assume client sends type: 'task' for tasks.
        console.error("[POST_ACTIVITIES] Missing activity type");
        return res.status(400).json({ message: "Activity type is required" });
      }
      
      // Ensure due_date is either a valid ISO string or null.
      // Supabase might handle invalid date strings by erroring or setting to null depending on column type.
      // It's good practice to validate/sanitize dates.
      if (activityPayload.due_date && isNaN(new Date(activityPayload.due_date).getTime())) {
        console.warn("[POST_ACTIVITIES] Invalid due_date received:", activityPayload.due_date);
        activityPayload.due_date = null; // Or handle as an error
      }

      // Add created_at and updated_at timestamps
      const now = new Date().toISOString();
      activityPayload.created_at = now;
      activityPayload.updated_at = now;

      console.log("[POST_ACTIVITIES] Final payload before Supabase insert:", JSON.stringify(activityPayload, null, 2));
      console.log("[POST_ACTIVITIES] Payload type field:", typeof activityPayload.type, "value:", activityPayload.type);

      const { data: newActivity, error } = await supabase
          .from('activities')
          .insert([activityPayload]) // insert expects an array
          .select(`
            *,
            contacts:contact_id(id, first_name, last_name, phone, email),
            companies:company_id(id, company_name, industry)
          `)
          .single();

      if (error) {
          console.error("[POST_ACTIVITIES] Supabase error creating activity:", error);
          console.error("[POST_ACTIVITIES] Supabase error code:", error.code);
          console.error("[POST_ACTIVITIES] Supabase error message:", error.message);
          console.error("[POST_ACTIVITIES] Supabase error details:", error.details);
          // More specific error handling based on Supabase error codes can be added
          // e.g., if (error.code === '23505') { /* unique constraint violation */ }
          return res.status(500).json({ message: "Database error creating activity", details: error.message });
      }
      if (!newActivity) {
          // This case should ideally be caught by the Supabase error above
          console.error("[POST_ACTIVITIES] No data returned from Supabase insert");
          return res.status(500).json({ message: "Failed to create activity (no data returned)" });
      }
      console.log("[POST_ACTIVITIES] Activity created successfully:", newActivity);
      res.status(201).json(newActivity);
    } catch (error: any) {
        console.error("[POST_ACTIVITIES] Unexpected error in handler:", error.message, error.stack);
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

  // === PRODUCTS ROUTES ===
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      console.log("GET /api/products - Request received");
      
      // Fetch all products from the database
      const { data: productsData, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("GET /api/products - Supabase query error:", error);
        return res.status(500).json({ message: "Error fetching products" });
      }
      
      if (!productsData) {
        console.log("GET /api/products - No products found in database");
        return res.json([]);
      }
      
      console.log(`GET /api/products - Found ${productsData.length} products`);
      
      // Return the products as a simple array
      res.json(productsData);
    } catch (error: any) {
      console.error("GET /api/products - Error:", error.message);
      res.status(500).json({ message: "Server error fetching products" });
    }
  });

  app.post("/api/products", async (req: Request, res: Response) => {
    try {
      console.log("POST /api/products - Request received. Body:", req.body);
      
      // Extract fields from request body
      const { product_name, sku_code, category, price, status, description } = req.body;
      
      // Validate required fields
      if (!product_name || !category || price === undefined || price === null || !status) {
        console.error("POST /api/products - Missing required fields");
        return res.status(400).json({ 
          message: "Missing required fields: product_name, category, price, and status are required" 
        });
      }
      
      // Validate price is a number
      const numericPrice = parseFloat(price);
      if (isNaN(numericPrice)) {
        console.error("POST /api/products - Invalid price format");
        return res.status(400).json({ message: "Price must be a valid number" });
      }
      
      // Validate status is one of the expected values
      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(status)) {
        console.error("POST /api/products - Invalid status value");
        return res.status(400).json({ 
          message: `Status must be one of: ${validStatuses.join(', ')}` 
        });
      }
      
      // Check if SKU code already exists (if provided)
      if (sku_code) {
        const { data: existingProduct, error: checkError } = await supabase
          .from('products')
          .select('id')
          .eq('sku_code', sku_code)
          .limit(1);
        
        if (checkError) {
          console.error("POST /api/products - Error checking for existing SKU:", checkError);
          return res.status(500).json({ message: "Database error checking for existing SKU" });
        }
        
        if (existingProduct && existingProduct.length > 0) {
          console.log("POST /api/products - SKU code already exists:", sku_code);
          return res.status(409).json({ message: "A product with this SKU code already exists" });
        }
      }
      
      // Prepare product data with timestamps
      const productData = {
        product_name,
        sku_code: sku_code || null,
        category,
        price: numericPrice,
        status,
        description: description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Insert into products table
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();
      
      if (error) {
        console.error("POST /api/products - Supabase insert error:", error);
        
        if (error.code === '23505') { // unique constraint violation
          console.log("POST /api/products - Duplicate product");
          return res.status(409).json({ message: "Product with this information already exists" });
        }
        
        return res.status(500).json({ message: "Database error creating product" });
      }
      
      if (!data) {
        console.error("POST /api/products - No data returned after insert");
        return res.status(500).json({ message: "Failed to create product (no data returned)" });
      }
      
      console.log("POST /api/products - Product created successfully:", data);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("POST /api/products - Error:", error.message);
      res.status(500).json({ message: "Error creating product" });
    }
  });

  // Update a product by ID
  app.patch("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { product_name, sku_code, category, price, status, description } = req.body;
      
      console.log(`PATCH /api/products/${id} - Request received. Body:`, req.body);
      
      // Validate product ID
      if (!id || isNaN(Number(id))) {
        console.error(`PATCH /api/products/${id} - Invalid product ID`);
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      // Validate that there are fields to update
      if (!req.body || Object.keys(req.body).length === 0) {
        console.error(`PATCH /api/products/${id} - No update fields provided`);
        return res.status(400).json({ message: "No update fields provided" });
      }
      
      // Build update object with only provided fields
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (product_name !== undefined) {
        if (!product_name.trim()) {
          return res.status(400).json({ message: "Product name cannot be empty" });
        }
        updateData.product_name = product_name.trim();
      }
      
      if (sku_code !== undefined) {
        updateData.sku_code = sku_code ? sku_code.trim() : null;
        
        // Check if SKU code already exists for a different product
        if (updateData.sku_code) {
          const { data: existingProduct, error: checkError } = await supabase
            .from('products')
            .select('id')
            .eq('sku_code', updateData.sku_code)
            .neq('id', id)
            .limit(1);
          
          if (checkError) {
            console.error(`PATCH /api/products/${id} - Error checking for existing SKU:`, checkError);
            return res.status(500).json({ message: "Database error checking for existing SKU" });
          }
          
          if (existingProduct && existingProduct.length > 0) {
            console.log(`PATCH /api/products/${id} - SKU code already exists:`, updateData.sku_code);
            return res.status(409).json({ message: "A product with this SKU code already exists" });
          }
        }
      }
      
      if (category !== undefined) {
        if (!category.trim()) {
          return res.status(400).json({ message: "Category cannot be empty" });
        }
        updateData.category = category.trim();
      }
      
      if (price !== undefined) {
        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice) || numericPrice <= 0) {
          return res.status(400).json({ message: "Price must be a valid number greater than 0" });
        }
        updateData.price = numericPrice;
      }
      
      if (status !== undefined) {
        const validStatuses = ['active', 'inactive'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ 
            message: `Status must be one of: ${validStatuses.join(', ')}` 
          });
        }
        updateData.status = status;
      }
      
      if (description !== undefined) {
        updateData.description = description ? description.trim() : null;
      }
      
      // Update the product
      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`PATCH /api/products/${id} - Supabase error:`, error);
        
        if (error.code === 'PGRST204') { // No rows selected
          return res.status(404).json({ message: `Product with ID ${id} not found` });
        }
        
        return res.status(500).json({ message: "Database error updating product" });
      }
      
      if (!data) {
        console.error(`PATCH /api/products/${id} - No data returned after update`);
        return res.status(404).json({ message: `Product with ID ${id} not found` });
      }
      
      console.log(`PATCH /api/products/${id} - Product updated successfully:`, data);
      res.status(200).json(data);
    } catch (error: any) {
      console.error(`PATCH /api/products/${req.params.id} - Error updating product:`, error.message, error.stack);
      res.status(500).json({ message: "Error updating product" });
    }
  });

  // Delete a product by ID
  app.delete("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      console.log(`DELETE /api/products/${id} - Request received`);
      
      // Validate product ID
      if (!id || isNaN(Number(id))) {
        console.error(`DELETE /api/products/${id} - Invalid product ID`);
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      // First, check if the product exists
      const { data: existingProduct, error: checkError } = await supabase
        .from('products')
        .select('id, product_name')
        .eq('id', id)
        .single();
      
      if (checkError) {
        console.error(`DELETE /api/products/${id} - Supabase error checking product existence:`, checkError);
        if (checkError.code === 'PGRST116') { // Not found
          return res.status(404).json({ message: `Product with ID ${id} not found` });
        }
        return res.status(500).json({ message: "Database error checking product existence" });
      }
      
      if (!existingProduct) {
        console.warn(`DELETE /api/products/${id} - Product not found`);
        return res.status(404).json({ message: `Product with ID ${id} not found` });
      }
      
      console.log(`DELETE /api/products/${id} - Found product: ${existingProduct.product_name}. Proceeding with deletion.`);
      
      // Delete the product
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        console.error(`DELETE /api/products/${id} - Supabase error deleting product:`, deleteError);
        return res.status(500).json({ message: "Database error deleting product" });
      }
      
      console.log(`DELETE /api/products/${id} - Product deleted successfully`);
      res.status(200).json({ message: `Product "${existingProduct.product_name}" deleted successfully` });
    } catch (error: any) {
      console.error(`DELETE /api/products/${req.params.id} - Error deleting product:`, error.message, error.stack);
      res.status(500).json({ message: "Error deleting product" });
    }
  });

  // === COMPANIES ROUTES ===
  app.get("/api/companies", async (req: Request, res: Response) => {
    try {
      console.log("GET /api/companies - Request received");
      
      // Fetch all companies from the database
      const { data: companiesData, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("GET /api/companies - Supabase query error:", error);
        return res.status(500).json({ message: "Error fetching companies" });
      }
      
      if (!companiesData) {
        console.log("GET /api/companies - No companies found in database");
        return res.json([]);
      }
      
      console.log(`GET /api/companies - Found ${companiesData.length} companies`);
      
      // Return the companies as a simple array
      res.json(companiesData);
    } catch (error: any) {
      console.error("GET /api/companies - Error:", error.message);
      res.status(500).json({ message: "Server error fetching companies" });
    }
  });

  app.post("/api/companies", async (req: Request, res: Response) => {
    try {
      console.log("POST /api/companies - Request received. Body:", req.body);
      
      // Extract fields from request body
      const { company_name, industry, phone, website, status, company_owner, tags } = req.body;
      
      // Validate required fields
      if (!company_name || !status) {
        console.error("POST /api/companies - Missing required fields");
        return res.status(400).json({ 
          message: "Missing required fields: company_name and status are required" 
        });
      }
      
      // Validate status is one of the expected values
      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(status)) {
        console.error("POST /api/companies - Invalid status value");
        return res.status(400).json({ 
          message: `Status must be one of: ${validStatuses.join(', ')}` 
        });
      }
      
      // Normalize phone number if provided
      const normalizedPhone = phone ? normalizePhone(phone) : null;
      
      // Prepare company data with timestamps
      const companyData = {
        company_name: company_name.trim(),
        industry: industry ? industry.trim() : null,
        phone: normalizedPhone,
        website: website ? website.trim() : null,
        status,
        company_owner: company_owner ? company_owner.trim() : null,
        tags: tags || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Insert into companies table
      const { data, error } = await supabase
        .from('companies')
        .insert([companyData])
        .select()
        .single();
      
      if (error) {
        console.error("POST /api/companies - Supabase insert error:", error);
        
        if (error.code === '23505') { // unique constraint violation
          console.log("POST /api/companies - Duplicate company");
          return res.status(409).json({ message: "Company with this information already exists" });
        }
        
        return res.status(500).json({ message: "Database error creating company" });
      }
      
      if (!data) {
        console.error("POST /api/companies - No data returned after insert");
        return res.status(500).json({ message: "Failed to create company (no data returned)" });
      }
      
      console.log("POST /api/companies - Company created successfully:", data);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("POST /api/companies - Error:", error.message);
      res.status(500).json({ message: "Error creating company" });
    }
  });

  // Get a single company by ID
  app.get("/api/companies/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      console.log(`GET /api/companies/${id} - Request received`);
      
      // Validate company ID
      if (!id || isNaN(Number(id))) {
        console.error(`GET /api/companies/${id} - Invalid company ID`);
        return res.status(400).json({ message: "Invalid company ID" });
      }
      
      // Fetch the company from the database
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(`GET /api/companies/${id} - Supabase error:`, error);
        
        if (error.code === 'PGRST116') { // Not found
          return res.status(404).json({ message: `Company with ID ${id} not found` });
        }
        
        return res.status(500).json({ message: "Database error fetching company" });
      }
      
      if (!data) {
        console.warn(`GET /api/companies/${id} - Company not found`);
        return res.status(404).json({ message: `Company with ID ${id} not found` });
      }
      
      console.log(`GET /api/companies/${id} - Company found:`, data);
      res.status(200).json(data);
    } catch (error: any) {
      console.error(`GET /api/companies/${req.params.id} - Error:`, error.message);
      res.status(500).json({ message: "Error fetching company" });
    }
  });

  // Update a company by ID
  app.patch("/api/companies/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { company_name, industry, phone, website, status, company_owner, tags } = req.body;
      
      console.log(`PATCH /api/companies/${id} - Request received. Body:`, req.body);
      
      // Validate company ID
      if (!id || isNaN(Number(id))) {
        console.error(`PATCH /api/companies/${id} - Invalid company ID`);
        return res.status(400).json({ message: "Invalid company ID" });
      }
      
      // Validate that there are fields to update
      if (!req.body || Object.keys(req.body).length === 0) {
        console.error(`PATCH /api/companies/${id} - No update fields provided`);
        return res.status(400).json({ message: "No update fields provided" });
      }
      
      // Build update object with only provided fields
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (company_name !== undefined) {
        if (!company_name.trim()) {
          return res.status(400).json({ message: "Company name cannot be empty" });
        }
        updateData.company_name = company_name.trim();
      }
      
      if (industry !== undefined) {
        updateData.industry = industry ? industry.trim() : null;
      }
      
      if (phone !== undefined) {
        updateData.phone = phone ? normalizePhone(phone) : null;
      }
      
      if (website !== undefined) {
        updateData.website = website ? website.trim() : null;
      }
      
      if (status !== undefined) {
        const validStatuses = ['active', 'inactive'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ 
            message: `Status must be one of: ${validStatuses.join(', ')}` 
          });
        }
        updateData.status = status;
      }
      
      if (company_owner !== undefined) {
        updateData.company_owner = company_owner ? company_owner.trim() : null;
      }
      
      if (tags !== undefined) {
        updateData.tags = tags || null;
      }
      
      console.log(`PATCH /api/companies/${id} - Update data:`, updateData);
      
      // Update the company in the database
      const { data, error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`PATCH /api/companies/${id} - Supabase error updating company:`, error);
        
        if (error.code === 'PGRST116') { // Not found
          return res.status(404).json({ message: `Company with ID ${id} not found` });
        }
        
        return res.status(500).json({ message: "Database error updating company" });
      }
      
      if (!data) {
        console.error(`PATCH /api/companies/${id} - No data returned after update`);
        return res.status(404).json({ message: `Company with ID ${id} not found` });
      }
      
      console.log(`PATCH /api/companies/${id} - Company updated successfully:`, data);
      res.status(200).json(data);
    } catch (error: any) {
      console.error(`PATCH /api/companies/${req.params.id} - Error updating company:`, error.message, error.stack);
      res.status(500).json({ message: "Error updating company" });
    }
  });

  // Delete a company by ID
  app.delete("/api/companies/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      console.log(`DELETE /api/companies/${id} - Request received`);
      
      // Validate company ID
      if (!id || isNaN(Number(id))) {
        console.error(`DELETE /api/companies/${id} - Invalid company ID`);
        return res.status(400).json({ message: "Invalid company ID" });
      }
      
      // First, check if the company exists
      const { data: existingCompany, error: checkError } = await supabase
        .from('companies')
        .select('id, company_name')
        .eq('id', id)
        .single();
      
      if (checkError) {
        console.error(`DELETE /api/companies/${id} - Supabase error checking company existence:`, checkError);
        if (checkError.code === 'PGRST116') { // Not found
          return res.status(404).json({ message: `Company with ID ${id} not found` });
        }
        return res.status(500).json({ message: "Database error checking company existence" });
      }
      
      if (!existingCompany) {
        console.warn(`DELETE /api/companies/${id} - Company not found`);
        return res.status(404).json({ message: `Company with ID ${id} not found` });
      }
      
      console.log(`DELETE /api/companies/${id} - Found company: ${existingCompany.company_name}. Proceeding with deletion.`);
      
      // Delete the company
      const { error: deleteError } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        console.error(`DELETE /api/companies/${id} - Supabase error deleting company:`, deleteError);
        return res.status(500).json({ message: "Database error deleting company" });
      }
      
      console.log(`DELETE /api/companies/${id} - Company deleted successfully`);
      res.status(200).json({ message: `Company "${existingCompany.company_name}" deleted successfully` });
    } catch (error: any) {
      console.error(`DELETE /api/companies/${req.params.id} - Error deleting company:`, error.message, error.stack);
      res.status(500).json({ message: "Error deleting company" });
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

  // === PIPELINE ROUTES ===
  
  // DEBUG: Test pipeline database structure
  app.get("/api/debug/pipelines", async (req: Request, res: Response) => {
    try {
      console.log("DEBUG: Testing pipeline database structure");
      
      // Test pipelines table
      const { data: pipelinesTest, error: pipelinesError } = await supabase
        .from('pipelines')
        .select('*')
        .limit(5);
      
      // Test pipeline_stages table
      const { data: stagesTest, error: stagesError } = await supabase
        .from('pipeline_stages')
        .select('*')
        .limit(5);
      
      // Test deals table
      const { data: dealsTest, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .limit(5);
      
      const debugInfo = {
        pipelines: {
          error: pipelinesError,
          count: pipelinesTest?.length || 0,
          sample: pipelinesTest
        },
        stages: {
          error: stagesError,
          count: stagesTest?.length || 0,
          sample: stagesTest
        },
        deals: {
          error: dealsError,
          count: dealsTest?.length || 0,
          sample: dealsTest
        }
      };
      
      console.log("DEBUG: Pipeline database test results:", JSON.stringify(debugInfo, null, 2));
      res.json(debugInfo);
    } catch (error: any) {
      console.error("DEBUG: Error testing pipeline database:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // GET /api/pipelines - Fetch all pipelines (for sidebar)
  app.get("/api/pipelines", async (req: Request, res: Response) => {
    try {
      console.log("GET /api/pipelines - Fetching all pipelines");
      
      const { data: pipelinesData, error } = await supabase
        .from('pipelines')
        .select('id, name, created_at, updated_at')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error("GET /api/pipelines - Supabase error:", error);
        return res.status(500).json({ message: "Error fetching pipelines" });
      }
      
      console.log(`GET /api/pipelines - Found ${pipelinesData?.length || 0} pipelines`);
      res.json(pipelinesData || []);
    } catch (error: any) {
      console.error("GET /api/pipelines - Error:", error.message);
      res.status(500).json({ message: "Server error fetching pipelines" });
    }
  });

  // GET /api/pipelines/:pipelineId - Fetch a single pipeline with stages and deals
  app.get("/api/pipelines/:pipelineId", async (req: Request, res: Response) => {
    try {
      const { pipelineId } = req.params;
      console.log(`GET /api/pipelines/${pipelineId} - Fetching pipeline with stages and deals`);
      
      // First, get the pipeline
      console.log(`GET /api/pipelines/${pipelineId} - Querying pipelines table for ID: ${pipelineId}`);
      const { data: pipelineData, error: pipelineError } = await supabase
        .from('pipelines')
        .select('id, name, created_at, updated_at')
        .eq('id', pipelineId)
        .single();
      
      if (pipelineError) {
        console.error(`GET /api/pipelines/${pipelineId} - Pipeline error:`, pipelineError);
        console.error(`GET /api/pipelines/${pipelineId} - Pipeline error code:`, pipelineError.code);
        console.error(`GET /api/pipelines/${pipelineId} - Pipeline error details:`, pipelineError.details);
        console.error(`GET /api/pipelines/${pipelineId} - Pipeline error message:`, pipelineError.message);
        if (pipelineError.code === 'PGRST116') {
          return res.status(404).json({ message: "Pipeline not found" });
        }
        return res.status(500).json({ message: "Error fetching pipeline", error: pipelineError.message });
      }
      
      // Get the stages for this pipeline
      console.log(`GET /api/pipelines/${pipelineId} - Querying pipeline_stages table for pipeline_id: ${pipelineId}`);
      const { data: stagesData, error: stagesError } = await supabase
        .from('pipeline_stages')
        .select('id, name, stage_order, created_at, updated_at')
        .eq('pipeline_id', pipelineId)
        .order('stage_order', { ascending: true });
      
      if (stagesError) {
        console.error(`GET /api/pipelines/${pipelineId} - Stages error:`, stagesError);
        console.error(`GET /api/pipelines/${pipelineId} - Stages error code:`, stagesError.code);
        console.error(`GET /api/pipelines/${pipelineId} - Stages error details:`, stagesError.details);
        console.error(`GET /api/pipelines/${pipelineId} - Stages error message:`, stagesError.message);
        return res.status(500).json({ message: "Error fetching pipeline stages", error: stagesError.message });
      }
      
      // Get all deals for this pipeline
      console.log(`GET /api/pipelines/${pipelineId} - Querying deals table for pipeline_id: ${pipelineId}`);
      
      // Query with joins to get company and contact names
      let dealsData, dealsError;
      try {
        const result = await supabase
          .from('deals')
          .select(`
            id, name, amount, company_id, contact_id, closing_date, 
            stage_id, pipeline_id, probability, status, created_at, updated_at,
            companies(id, company_name),
            contacts(id, first_name, last_name)
          `)
          .eq('pipeline_id', pipelineId);
        
        dealsData = result.data;
        dealsError = result.error;
      } catch (joinError) {
        console.log(`GET /api/pipelines/${pipelineId} - Join query failed, trying without joins:`, joinError);
        
        // Fallback: query without joins
        const fallbackResult = await supabase
          .from('deals')
          .select(`
            id, name, amount, company_id, contact_id, closing_date, 
            stage_id, pipeline_id, probability, status, created_at, updated_at
          `)
          .eq('pipeline_id', pipelineId);
        
        dealsData = fallbackResult.data;
        dealsError = fallbackResult.error;
      }
      
      if (dealsError) {
        console.error(`GET /api/pipelines/${pipelineId} - Deals error:`, dealsError);
        console.error(`GET /api/pipelines/${pipelineId} - Deals error code:`, dealsError.code);
        console.error(`GET /api/pipelines/${pipelineId} - Deals error details:`, dealsError.details);
        console.error(`GET /api/pipelines/${pipelineId} - Deals error message:`, dealsError.message);
        return res.status(500).json({ message: "Error fetching deals", error: dealsError.message });
      }
      
      // Organize deals by stage
      const stages = (stagesData || []).map(stage => ({
        id: stage.id,
        name: stage.name,
        order: stage.stage_order,
        deals: (dealsData || [])
          .filter(deal => deal.stage_id === stage.id)
          .map(deal => ({
            id: deal.id,
            name: deal.name,
            amount: deal.amount || 0,
            company: (deal as any).companies?.company_name || '',
            contact: (deal as any).contacts ? `${(deal as any).contacts.first_name} ${(deal as any).contacts.last_name}` : '',
            company_id: deal.company_id,
            contact_id: deal.contact_id,
            closingDate: deal.closing_date || '',
            stageId: deal.stage_id,
            probability: deal.probability || 0,
            status: deal.status || 'open'
          }))
      }));
      
      const response = {
        id: pipelineData.id,
        name: pipelineData.name,
        stages
      };
      
      console.log(`GET /api/pipelines/${pipelineId} - Returning pipeline with ${stages.length} stages and ${dealsData?.length || 0} total deals`);
      res.json(response);
    } catch (error: any) {
      console.error(`GET /api/pipelines/:pipelineId - Error:`, error.message);
      res.status(500).json({ message: "Server error fetching pipeline data" });
    }
  });

  // POST /api/deals - Create a new deal
  app.post("/api/deals", async (req: Request, res: Response) => {
    try {
      const dealData = req.body;
      console.log("POST /api/deals - Creating new deal:", dealData);
      
      // Validate required fields
      if (!dealData.name || !dealData.stage_id || !dealData.pipeline_id) {
        return res.status(400).json({ 
          message: "Missing required fields: name, stage_id, and pipeline_id are required" 
        });
      }
      
      // Prepare deal data for insertion - ONLY IDs, no text fields
      const newDeal = {
        name: dealData.name,
        amount: dealData.amount || 0,
        company_id: dealData.company_id || null,
        contact_id: dealData.contact_id || null,
        closing_date: dealData.closing_date || null,
        stage_id: dealData.stage_id,
        pipeline_id: dealData.pipeline_id,
        probability: dealData.probability || 0,
        status: dealData.status || 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: insertedDeal, error } = await supabase
        .from('deals')
        .insert([newDeal])
        .select(`
          id, name, amount, company_id, contact_id, closing_date, 
          stage_id, pipeline_id, probability, status, created_at, updated_at,
          companies(id, company_name),
          contacts(id, first_name, last_name)
        `)
        .single();
      
      if (error) {
        console.error("POST /api/deals - Supabase error:", error);
        return res.status(500).json({ message: "Error creating deal" });
      }
      
      // Format the response to match frontend expectations
      const formattedDeal = {
        id: insertedDeal.id,
        name: insertedDeal.name,
        amount: insertedDeal.amount || 0,
        company: (insertedDeal.companies as any)?.company_name || '',
        contact: (insertedDeal.contacts as any) ? `${(insertedDeal.contacts as any).first_name} ${(insertedDeal.contacts as any).last_name}` : '',
        closingDate: insertedDeal.closing_date || '',
        stageId: insertedDeal.stage_id,
        probability: insertedDeal.probability || 0,
        status: insertedDeal.status || 'open'
      };
      
      console.log("POST /api/deals - Deal created successfully:", formattedDeal);
      res.status(201).json(formattedDeal);
    } catch (error: any) {
      console.error("POST /api/deals - Error:", error.message);
      res.status(500).json({ message: "Server error creating deal" });
    }
  });

  // PATCH /api/deals/:dealId - Update an existing deal
  app.patch("/api/deals/:dealId", async (req: Request, res: Response) => {
    try {
      const { dealId } = req.params;
      const updates = req.body;
      console.log(`PATCH /api/deals/${dealId} - Updating deal:`, updates);
      
      // Validate dealId
      if (!dealId || isNaN(Number(dealId))) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }
      
      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      // Only include fields that are provided - ONLY IDs, no text fields
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.company_id !== undefined) updateData.company_id = updates.company_id;
      if (updates.contact_id !== undefined) updateData.contact_id = updates.contact_id;
      if (updates.closing_date !== undefined) updateData.closing_date = updates.closing_date;
      if (updates.stage_id !== undefined) updateData.stage_id = updates.stage_id;
      if (updates.probability !== undefined) updateData.probability = updates.probability;
      if (updates.status !== undefined) updateData.status = updates.status;
      
      const { data: updatedDeal, error } = await supabase
        .from('deals')
        .update(updateData)
        .eq('id', dealId)
        .select(`
          id, name, amount, company_id, contact_id, closing_date, 
          stage_id, pipeline_id, probability, status, created_at, updated_at,
          companies(id, company_name),
          contacts(id, first_name, last_name)
        `)
        .single();
      
      if (error) {
        console.error(`PATCH /api/deals/${dealId} - Supabase error:`, error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ message: "Deal not found" });
        }
        return res.status(500).json({ message: "Error updating deal" });
      }
      
      // Format the response to match frontend expectations
      const formattedDeal = {
        id: updatedDeal.id,
        name: updatedDeal.name,
        amount: updatedDeal.amount || 0,
        company: (updatedDeal.companies as any)?.company_name || '',
        contact: (updatedDeal.contacts as any) ? `${(updatedDeal.contacts as any).first_name} ${(updatedDeal.contacts as any).last_name}` : '',
        closingDate: updatedDeal.closing_date || '',
        stageId: updatedDeal.stage_id,
        probability: updatedDeal.probability || 0,
        status: updatedDeal.status || 'open'
      };
      
      console.log(`PATCH /api/deals/${dealId} - Deal updated successfully:`, formattedDeal);
      res.json(formattedDeal);
    } catch (error: any) {
      console.error(`PATCH /api/deals/:dealId - Error:`, error.message);
      res.status(500).json({ message: "Server error updating deal" });
    }
  });

  // DELETE /api/deals/:dealId - Delete a deal
  app.delete("/api/deals/:dealId", async (req: Request, res: Response) => {
    try {
      const { dealId } = req.params;
      console.log(`DELETE /api/deals/${dealId} - Deleting deal`);
      
      // Validate dealId
      if (!dealId || isNaN(Number(dealId))) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }
      
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', dealId);
      
      if (error) {
        console.error(`DELETE /api/deals/${dealId} - Supabase error:`, error);
        return res.status(500).json({ message: "Error deleting deal" });
      }
      
      console.log(`DELETE /api/deals/${dealId} - Deal deleted successfully`);
      res.status(204).send();
    } catch (error: any) {
      console.error(`DELETE /api/deals/:dealId - Error:`, error.message);
      res.status(500).json({ message: "Server error deleting deal" });
    }
  });

  // Test routes (consider removing for production or securing them)
  // app.post("/api/test/twilio/voice", handleVoiceWebhook);
  // app.post("/api/test/twilio/status-callback", handleStatusCallback);

  // === PROFILE ROUTES ===
  
  // GET /api/profile - Fetches profile for the authenticated user
  app.get("/api/profile", protectRoute, async (req: AuthenticatedRequest, res: Response) => {
    console.log('👤 [GET_PROFILE] Route handler started');
    console.log('👤 [GET_PROFILE] req.user object:', req.user);
    
    if (!req.user || !req.user.id) {
      console.error('👤 [GET_PROFILE] ❌ User not authenticated - req.user:', req.user);
      return res.status(401).json({ message: 'User not authenticated.' });
    }
    const userId = req.user.id;

    console.log(`👤 [GET_PROFILE] ✅ Authenticated user ID extracted: ${userId}`);
    console.log(`👤 [GET_PROFILE] User ID type: ${typeof userId}, length: ${userId.length}`);

    try {
      console.log(`👤 [GET_PROFILE] 🔍 Executing Supabase query for user: ${userId}`);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, job_title, bio, avatar_url, phone_number, updated_at')
        .eq('id', userId)
        .single();

      console.log(`👤 [GET_PROFILE] 📊 Supabase query completed for user: ${userId}`);
      if (error) {
        console.error(`👤 [GET_PROFILE] ❌ Supabase error for user ${userId}:`, error);
        if (error.code === 'PGRST116') { // PostgREST error for "No rows found" with .single()
          console.log(`👤 [GET_PROFILE] ❌ Profile not found for user: ${userId}`);
          return res.status(404).json({ message: 'Profile not found for this user.' });
        }
        console.error('👤 [GET_PROFILE] ❌ Error fetching profile:', error);
        return res.status(500).json({ message: 'Error fetching profile', error: error.message });
      }
      
      if (data) {
        console.log(`👤 [GET_PROFILE] ✅ Profile found for user: ${userId}`);
        console.log(`👤 [GET_PROFILE] ✅ Profile data ID: ${data.id}, Name: ${data.first_name} ${data.last_name}`);
        // Map database fields to frontend expected fields
        const mappedData = {
          ...data,
          phone: data.phone_number, // Map phone_number to phone for frontend
          email: null // Profiles table doesn't have email, get from auth.users
        };
        return res.json(mappedData);
      } else {
        // This case should ideally be caught by error.code === 'PGRST116'
        console.error(`👤 [GET_PROFILE] ❌ No data returned for user: ${userId}`);
        return res.status(404).json({ message: 'Profile not found.' });
      }
    } catch (err) {
      console.error(`👤 [GET_PROFILE] ❌ Unexpected error fetching profile for user ${userId}:`, err);
      return res.status(500).json({ message: 'Unexpected server error.' });
    }
  });

  // PATCH /api/profile - Updates profile for the authenticated user
  app.patch("/api/profile", protectRoute, async (req: AuthenticatedRequest, res: Response) => {
    console.log('👤 [PATCH_PROFILE] Route handler started');
    console.log('👤 [PATCH_PROFILE] req.user object:', req.user);
    
    if (!req.user || !req.user.id) {
      console.error('👤 [PATCH_PROFILE] ❌ User not authenticated - req.user:', req.user);
      return res.status(401).json({ message: 'User not authenticated.' });
    }
    const userId = req.user.id;
    const { first_name, last_name, job_title, bio, phone } = req.body;

    console.log(`👤 [PATCH_PROFILE] ✅ Authenticated user ID extracted: ${userId}`);
    console.log(`👤 [PATCH_PROFILE] User ID type: ${typeof userId}, length: ${userId.length}`);
    console.log(`👤 [PATCH_PROFILE] 📝 Update data received:`, req.body);

    // Basic validation (can be more sophisticated)
    if (first_name === undefined || last_name === undefined) {
      // first_name and last_name are NOT NULL in the DB.
      // If they are sent as empty strings, that's allowed by this check
      // but you might want stricter validation depending on requirements.
      console.error(`👤 [PATCH_PROFILE] ❌ Missing required fields for user ${userId}`);
      return res.status(400).json({ message: 'First name and last name are required.' });
    }
    
    const profileDataToUpdate: { 
      first_name?: string, 
      last_name?: string, 
      job_title?: string, 
      bio?: string, 
      phone_number?: string
    } = {};

    if (first_name !== undefined) profileDataToUpdate.first_name = first_name;
    if (last_name !== undefined) profileDataToUpdate.last_name = last_name;
    if (job_title !== undefined) profileDataToUpdate.job_title = job_title;
    if (bio !== undefined) profileDataToUpdate.bio = bio;
    if (phone !== undefined) profileDataToUpdate.phone_number = phone; // Map phone to phone_number for database

    console.log(`👤 [PATCH_PROFILE] 📝 Prepared update data for user ${userId}:`, profileDataToUpdate);

    try {
      console.log(`👤 [PATCH_PROFILE] 🔍 Executing Supabase update for user: ${userId}`);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(profileDataToUpdate)
        .eq('id', userId)
        .select('id, first_name, last_name, job_title, bio, avatar_url, phone_number, updated_at') // Select the updated data to return
        .single(); // Use .single() if you expect exactly one row to be updated and want it back

      console.log(`👤 [PATCH_PROFILE] 📊 Supabase update completed for user: ${userId}`);
      if (error) {
        console.error(`👤 [PATCH_PROFILE] ❌ Supabase error for user ${userId}:`, error);
        return res.status(500).json({ message: 'Error updating profile', error: error.message });
      }
      
      if (data) {
        console.log(`👤 [PATCH_PROFILE] ✅ Profile updated successfully for user: ${userId}`);
        console.log(`👤 [PATCH_PROFILE] ✅ Updated profile data ID: ${data.id}, Name: ${data.first_name} ${data.last_name}`);
        // Map database fields to frontend expected fields
        const mappedData = {
          ...data,
          phone: data.phone_number, // Map phone_number to phone for frontend
          email: null // Profiles table doesn't have email
        };
        return res.json(mappedData);
      } else {
        console.error(`👤 [PATCH_PROFILE] ❌ No data returned after update for user: ${userId}`);
        return res.status(404).json({ message: 'Profile not found or no changes made.' });
      }
    } catch (err) {
      console.error(`👤 [PATCH_PROFILE] ❌ Unexpected error updating profile for user ${userId}:`, err);
      return res.status(500).json({ message: 'Unexpected server error.' });
    }
  });

  // GET /api/activities - Fetch activities with optional filtering
  app.get("/api/activities", async (req: Request, res: Response) => {
    try {
      console.log("GET /api/activities - Request received. Query params:", req.query);
      
      const { type, start_date, end_date, contact_id, company_id, user_id } = req.query;
      
      let query = supabase
        .from('activities')
        .select(`
          *,
          contacts:contact_id(id, first_name, last_name, phone, email),
          companies:company_id(id, company_name, industry)
        `)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (type && typeof type === 'string') {
        query = query.eq('type', type);
      }
      
      if (contact_id && typeof contact_id === 'string') {
        query = query.eq('contact_id', contact_id);
      }
      
      if (company_id && typeof company_id === 'string') {
        query = query.eq('company_id', company_id);
      }
      
      if (user_id && typeof user_id === 'string') {
        query = query.eq('user_id', user_id);
      }
      
      // Date range filtering for events based on start_datetime
      if (start_date && typeof start_date === 'string') {
        query = query.gte('start_datetime', start_date);
      }
      
      if (end_date && typeof end_date === 'string') {
        query = query.lte('start_datetime', end_date);
      }
      
      const { data: activities, error } = await query;
      
      if (error) {
        console.error("GET /api/activities - Supabase error:", error);
        return res.status(500).json({ message: "Database error fetching activities", error: error.message });
      }
      
      console.log(`GET /api/activities - Found ${activities?.length || 0} activities`);
      res.status(200).json(activities || []);
    } catch (error: any) {
      console.error("GET /api/activities - Unexpected error:", error.message, error.stack);
      res.status(500).json({ message: "Internal server error fetching activities", details: error.message });
    }
  });

  const httpServer = createServer(app);
  console.log("All routes registered successfully");
  return httpServer;
}