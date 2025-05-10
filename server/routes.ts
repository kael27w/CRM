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
import { twilioWebhook, handleVoiceWebhook, handleStatusCallback } from "./twilio.js";

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("Starting to register routes...");

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

  app.post("/api/contacts", async (req: Request, res: Response) => {
    try {
      console.log("POST /api/contacts - Request received. Body:", req.body);
      const { first_name, last_name, phone } = req.body;
      if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      // const validatedData = insertContactSchema.parse(req.body); // If you want to use Zod validation
      const { data: newContact, error } = await supabase
        .from('contacts')
        .insert([{
          first_name: first_name || 'Unknown',
          last_name: last_name || 'Caller',
          phone,
          status: 'Lead'
        }])
        .select()
        .single();

      if (error) {
        console.error("POST /api/contacts - Supabase error:", error);
        return res.status(500).json({ message: "Database error creating contact" });
      }
      if (!newContact) {
        return res.status(500).json({ message: "Failed to create contact (no data returned)" });
      }
      console.log("POST /api/contacts - Contact created successfully:", newContact);
      const contactResponse = {
        contact_id: newContact.id.toString(),
        first_name: newContact.first_name,
        last_name: newContact.last_name,
        phone: newContact.phone,
        email: newContact.email || '',
        company: newContact.company || '',
        contact_url: `${req.protocol}://${req.get('host')}/contacts/${newContact.id}`
      };
      res.status(201).json(contactResponse);
    } catch (error: any) {
      console.error("POST /api/contacts - Error creating contact:", error.message, error.stack);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Error creating contact" });
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
    try {
      console.log('GET /api/tasks - Request received');
      console.log('GET /api/tasks - Fetching tasks data from Supabase...');
      const tasksResult = await supabase
        .from('activities')
        .select('*')
        .eq('type', 'task')
        .order('created_at', { ascending: false });

      console.log('GET /api/tasks - Supabase tasksResult:', {
        data: tasksResult.data,
        error: tasksResult.error,
        count: tasksResult.count // Supabase JS v2 count is on the main object, not data
      });

      if (tasksResult.error) {
        console.error('GET /api/tasks - Supabase error fetching tasks:', {
          message: tasksResult.error.message,
          details: tasksResult.error.details,
          hint: tasksResult.error.hint
        });
        return res.status(500).json({ error: tasksResult.error.message });
      }
      const tasksData = tasksResult.data;
      console.log('GET /api/tasks - Tasks data retrieved:', tasksData);
      res.json(tasksData || []);
    } catch (error: any) {
      console.error('GET /api/tasks - Error in handler:', error.message);
      console.error(error.stack);
      return res.status(500).json({ error: 'Internal server error fetching tasks' });
    }
  });

  // You might need POST /api/activities (or /api/tasks if preferred) to create tasks
  // Example for POST /api/activities (can be adapted for tasks)
  app.post("/api/activities", async (req: Request, res: Response) => {
    try {
      console.log("POST /api/activities - Request received. Body:", req.body);
      // const validatedData = insertActivitySchema.parse(req.body); // Add Zod validation
      // For tasks, ensure 'type' is 'task'
      const activityData = { ...req.body };
      if (req.path.includes('/tasks') && !activityData.type) { // If specifically creating a task via /api/tasks
          activityData.type = 'task';
      }

      const { data: newActivity, error } = await supabase
          .from('activities')
          .insert([activityData])
          .select()
          .single();

      if (error) {
          console.error("POST /api/activities - Supabase error:", error);
          return res.status(500).json({ message: "Database error creating activity" });
      }
      if (!newActivity) {
          return res.status(500).json({ message: "Failed to create activity" });
      }
      console.log("POST /api/activities - Activity created:", newActivity);
      res.status(201).json(newActivity);
    } catch (error: any) {
        console.error("POST /api/activities - Error:", error.message, error.stack);
        if (error instanceof ZodError) {
            return res.status(400).json({ message: fromZodError(error).message });
        }
        res.status(500).json({ message: "Error creating activity" });
    }
  });


  // === STATS ROUTES ===
  app.get("/api/stats/overview", async (req: Request, res: Response) => {
    try {
      console.log('GET /api/stats/overview - Request received');

      const contactsPromise = supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true });
      console.log('GET /api/stats/overview - Fetching deals data from Supabase...');
      const dealsResultPromise = supabase.from('deals').select('amount', { count: 'exact' });

      const activitiesPromise = supabase
        .from('activities')
        .select('id', { count: 'exact', head: true })
        .eq('type', 'task')
        .eq('completed', false);

      const callsPromise = supabase
        .from('calls')
        .select('id', { count: 'exact', head: true });

      const [contactsResult, dealsResult, activitiesResult, callsResult] =
        await Promise.all([contactsPromise, dealsResultPromise, activitiesPromise, callsPromise]);

      console.log('GET /api/stats/overview - Supabase contactsResult:', { error: contactsResult.error, count: contactsResult.count });
      console.log('GET /api/stats/overview - Supabase dealsResult:', { data: dealsResult.data, error: dealsResult.error, count: dealsResult.count });
      console.log('GET /api/stats/overview - Supabase activitiesResult:', { error: activitiesResult.error, count: activitiesResult.count });
      console.log('GET /api/stats/overview - Supabase callsResult:', { error: callsResult.error, count: callsResult.count });

      if (contactsResult.error) throw new Error(`Contacts count error: ${contactsResult.error.message}`);
      if (dealsResult.error) throw new Error(`Deals data error: ${dealsResult.error.message}`);
      if (activitiesResult.error) throw new Error(`Activities count error: ${activitiesResult.error.message}`);
      if (callsResult.error) throw new Error(`Calls count error: ${callsResult.error.message}`);

      const dealsData = dealsResult.data;
      let totalDealAmount = 0;
      if (Array.isArray(dealsData)) {
        totalDealAmount = dealsData.reduce((sum, deal) => {
          const amount = deal.amount;
          if (typeof amount !== 'number' && amount !== null) { // Allow null, treat as 0
            console.warn('GET /api/stats/overview - Non-numeric or non-null deal.amount encountered:', amount);
          }
          return sum + (Number(amount) || 0);
        }, 0);
      } else {
        console.warn('GET /api/stats/overview - dealsResult.data is not an array or is undefined');
      }
      console.log('GET /api/stats/overview - Total deal amount calculated:', totalDealAmount);

      const stats = {
        activeContacts: contactsResult.count || 0,
        activeDeals: dealsResult.count || 0,
        pendingTasks: activitiesResult.count || 0,
        recentCalls: callsResult.count || 0,
        totalRevenue: totalDealAmount
      };
      console.log("GET /api/stats/overview - Overview stats:", stats);
      res.json(stats);
    } catch (error: any) {
      console.error('GET /api/stats/overview - Error in handler:', error.message);
      console.error(error.stack);
      return res.status(500).json({ error: 'Internal server error fetching overview stats', details: error.message });
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

  const statusCallbackUrl = process.env.TWILIO_STATUS_CALLBACK_URL || (process.env.API_URL ? `${process.env.API_URL}/api/twilio/status-callback` : '');
  console.log(`Twilio STATUS CALLBACK webhook URL for validation: ${statusCallbackUrl}`);
  app.post("/api/twilio/status-callback", twilioWebhook(statusCallbackUrl), handleStatusCallback);
  console.log("Registered POST /api/twilio/status-callback route");

  // Test routes (consider removing for production or securing them)
  // app.post("/api/test/twilio/voice", handleVoiceWebhook);
  // app.post("/api/test/twilio/status-callback", handleStatusCallback);

  const httpServer = createServer(app);
  console.log("All routes registered successfully");
  return httpServer;
}