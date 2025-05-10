import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { 
  insertContactSchema,
  insertActivitySchema
} from "../shared/schema.js";
import { supabase, normalizePhone } from "./supabase.js";
import { twilioWebhook, handleVoiceWebhook, handleStatusCallback } from "./twilio.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Debugging log for route registration
  console.log("Starting to register routes...");

  // NEW ENDPOINT: Contact lookup by phone
  app.get("/api/contacts", async (req, res) => {
    try {
      const { phone } = req.query;
      
      if (!phone || typeof phone !== 'string') {
        return res.status(400).json({ message: "Phone parameter is required" });
      }
      
      console.log(`Looking up contact with phone: ${phone}`);
      
      // Normalize the phone number for comparison
      const normalizedPhone = normalizePhone(phone);
      
      // Query Supabase for contacts with matching phone number
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .or(`phone.ilike.%${normalizedPhone}%,phone.ilike.%${phone}%`);
      
      if (error) {
        console.error("Supabase error:", error);
        return res.status(500).json({ message: "Database error looking up contact" });
      }
      
      if (!contacts || contacts.length === 0) {
        console.log("No contacts found");
        return res.status(200).json([]);  // Return empty array if no contact found
      }
      
      console.log(`Found ${contacts.length} matching contacts`);
      
      // Return the first matching contact
      const contact = contacts[0];
      
      // Construct the response with the required fields
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
    } catch (error) {
      console.error("Error in contact lookup:", error);
      res.status(500).json({ message: "Error looking up contact" });
    }
  });

  // NEW ENDPOINT: Create contact from phone call
  app.post("/api/contacts", async (req, res) => {
    try {
      console.log("POST /api/contacts requested with body:", req.body);
      
      const { first_name, last_name, phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      
      console.log(`Creating new contact: ${first_name} ${last_name}, ${phone}`);
      
      // Insert the new contact into Supabase
      const { data: newContact, error } = await supabase
        .from('contacts')
        .insert([
          { 
            first_name: first_name || 'Unknown', 
            last_name: last_name || 'Caller',
            phone,
            status: 'Lead'
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error("Supabase error:", error);
        return res.status(500).json({ message: "Database error creating contact" });
      }
      
      if (!newContact) {
        return res.status(500).json({ message: "Failed to create contact" });
      }
      
      console.log("Contact created successfully:", newContact);
      
      // Return the response with the required format
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
    } catch (error) {
      console.error("Error creating contact:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Error creating contact" });
    }
  });

  // NEW ENDPOINT: Log call information
  app.post("/api/calls", async (req, res) => {
    try {
      console.log("POST /api/calls requested with body:", req.body);
      
      const { 
        contact_id, 
        call_type, 
        duration, 
        notes, 
        agent, 
        phone 
      } = req.body;
      
      console.log(`Logging call for contact ID: ${contact_id}, type: ${call_type}`);
      
      // Insert the call record into Supabase
      const { data: newCall, error } = await supabase
        .from('calls')
        .insert([
          {
            contact_id: contact_id ? parseInt(contact_id, 10) : null,
            call_type: call_type || 'unknown',
            duration: duration || 0,
            notes: notes || '',
            agent: agent || '',
            phone: phone || ''
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error("Supabase error:", error);
        return res.status(500).json({ message: "Database error logging call" });
      }
      
      if (!newCall) {
        return res.status(500).json({ message: "Failed to log call" });
      }
      
      console.log("Call logged successfully:", newCall);
      
      res.status(201).json({
        status: "success",
        message: "Call logged successfully.",
        log_id: newCall.id.toString()
      });
    } catch (error) {
      console.error("Error logging call:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Error logging call" });
    }
  });

  // NEW ENDPOINT: Get all call records with contact information
  app.get("/api/calls", async (req: Request, res: Response) => {
    try {
      console.log("GET /api/calls requested");
      
      // Query Supabase for all calls with joined contact information, ordered by created_at desc
      const { data: calls, error } = await supabase
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
        console.error("Supabase error fetching calls:", error);
        return res.status(500).json({ message: "Database error fetching calls" });
      }
      
      // If no calls found, return empty array
      if (!calls || calls.length === 0) {
        console.log("No call records found");
        return res.status(200).json([]);
      }
      
      console.log(`Found ${calls.length} call records`);
      
      // Map the calls with joined contact data to the desired response format
      const callsWithContactInfo = calls.map(call => ({
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
    } catch (error) {
      console.error("Error fetching call records:", error);
      res.status(500).json({ message: "Error fetching call records" });
    }
  });

  // Task routes - now using activity schema for tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      console.log("GET /api/tasks requested");
      
      // Query Supabase for activities with type='task'
      const { data: tasks, error } = await supabase
        .from('activities')
        .select('*')
        .eq('type', 'task')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Supabase error fetching tasks:", error);
        return res.status(500).json({ message: "Database error fetching tasks" });
      }
      
      console.log(`Found ${tasks?.length || 0} tasks`);
      res.json(tasks || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Error fetching tasks" });
    }
  });

  // NEW ENDPOINT: Overview stats for dashboard
  app.get("/api/stats/overview", async (req, res) => {
    try {
      console.log("GET /api/stats/overview requested");
      
      // Get counts from various tables
      const contactsPromise = supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true });
        
      const dealsPromise = supabase
        .from('deals')
        .select('id, amount', { count: 'exact' });
        
      const activitiesPromise = supabase
        .from('activities')
        .select('id', { count: 'exact', head: true })
        .eq('type', 'task')
        .eq('completed', false);
        
      const callsPromise = supabase
        .from('calls')
        .select('id', { count: 'exact', head: true });
      
      // Wait for all promises to resolve
      const [contactsResult, dealsResult, activitiesResult, callsResult] = 
        await Promise.all([contactsPromise, dealsPromise, activitiesPromise, callsPromise]);
      
      // Handle any errors
      if (contactsResult.error) {
        console.error("Error fetching contacts count:", contactsResult.error);
        return res.status(500).json({ message: "Error fetching stats" });
      }
      
      if (dealsResult.error) {
        console.error("Error fetching deals:", dealsResult.error);
        return res.status(500).json({ message: "Error fetching stats" });
      }
      
      if (activitiesResult.error) {
        console.error("Error fetching activities:", activitiesResult.error);
        return res.status(500).json({ message: "Error fetching stats" });
      }
      
      if (callsResult.error) {
        console.error("Error fetching calls:", callsResult.error);
        return res.status(500).json({ message: "Error fetching stats" });
      }
      
      // Calculate total revenue from deals
      const totalRevenue = dealsResult.data?.reduce((sum, deal) => 
        sum + (deal.amount || 0), 0) || 0;
      
      // Construct the stats object
      const stats = {
        activeContacts: contactsResult.count || 0,
        activeDeals: dealsResult.count || 0,
        pendingTasks: activitiesResult.count || 0,
        recentCalls: callsResult.count || 0,
        totalRevenue
      };
      
      console.log("Overview stats:", stats);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching overview stats:", error);
      res.status(500).json({ message: "Error fetching overview stats" });
    }
  });

  // =========== TWILIO ROUTES ===========
  console.log("Registering Twilio routes...");

  // Define the base URL for Twilio VOICE webhook validation
  const voiceWebhookUrl = process.env.TWILIO_WEBHOOK_BASE_URL || (process.env.API_URL ? `${process.env.API_URL}/api/twilio/voice` : '');
  console.log(`Twilio VOICE webhook URL for validation: ${voiceWebhookUrl}`);

  // Twilio voice webhook endpoint
  app.post("/api/twilio/voice", twilioWebhook(voiceWebhookUrl), handleVoiceWebhook);
  console.log("Registered POST /api/twilio/voice route");

  // Define the base URL for Twilio STATUS CALLBACK webhook validation
  const statusCallbackUrl = process.env.TWILIO_STATUS_CALLBACK_URL || (process.env.API_URL ? `${process.env.API_URL}/api/twilio/status-callback` : '');
  console.log(`Twilio STATUS CALLBACK webhook URL for validation: ${statusCallbackUrl}`);

  // Twilio status callback endpoint
  app.post("/api/twilio/status-callback", twilioWebhook(statusCallbackUrl), handleStatusCallback); // Pass the correct URL
  console.log("Registered POST /api/twilio/status-callback route");

  const httpServer = createServer(app);
  console.log("All routes registered successfully");

  return httpServer;
}