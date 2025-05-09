import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { 
  insertUserSchema, 
  insertContactSchema,  // Renamed from insertClientSchema
  insertDealSchema,     // Renamed from insertPolicySchema  
  insertActivitySchema
} from "../shared/schema.js";
import { supabase, normalizePhone } from "./supabase.js";
import { twilioWebhook, handleVoiceWebhook, handleStatusCallback } from "./twilio.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Debugging log for route registration
  console.log("Starting to register routes...");

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id, 10));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });

  // Client routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Error fetching clients" });
    }
  });

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

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.getClient(parseInt(req.params.id, 10));
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Error fetching client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Error creating client" });
    }
  });

  // Deal routes (formerly Policy routes)
  app.get("/api/policies", async (req, res) => {
    try {
      const policies = await storage.getPolicies();
      res.json(policies);
    } catch (error) {
      res.status(500).json({ message: "Error fetching policies" });
    }
  });

  app.get("/api/policies/:id", async (req, res) => {
    try {
      const policy = await storage.getPolicy(parseInt(req.params.id, 10));
      if (!policy) {
        return res.status(404).json({ message: "Policy not found" });
      }
      res.json(policy);
    } catch (error) {
      res.status(500).json({ message: "Error fetching policy" });
    }
  });

  app.post("/api/policies", async (req, res) => {
    try {
      const validatedData = insertDealSchema.parse(req.body);
      const policy = await storage.createPolicy(validatedData);
      res.status(201).json(policy);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Error creating policy" });
    }
  });

  app.patch("/api/policies/:id/stage", async (req, res) => {
    try {
      const { stage } = req.body;
      if (!stage) {
        return res.status(400).json({ message: "Stage is required" });
      }
      
      const policy = await storage.updatePolicyStage(parseInt(req.params.id, 10), stage);
      if (!policy) {
        return res.status(404).json({ message: "Policy not found" });
      }
      
      res.json(policy);
    } catch (error) {
      res.status(500).json({ message: "Error updating policy stage" });
    }
  });

  // Task routes - now using activity schema for tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Error fetching tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      // Use the activity schema with type='task'
      const taskData = { ...req.body, type: 'task' };
      const validatedData = insertActivitySchema.parse(taskData);
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Error creating task" });
    }
  });

  app.patch("/api/tasks/:id/complete", async (req, res) => {
    try {
      const task = await storage.completeTask(parseInt(req.params.id, 10));
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Error completing task" });
    }
  });

  // Activity routes
  app.get("/api/activities", async (req, res) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Error fetching activities" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const validatedData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(validatedData);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Error creating activity" });
    }
  });

  // Dashboard stats
  app.get("/api/stats/dashboard", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching dashboard stats" });
    }
  });

  // Get pipeline stages
  app.get("/api/pipeline", async (req, res) => {
    try {
      const pipeline = await storage.getPipelineStages();
      res.json(pipeline);
    } catch (error) {
      res.status(500).json({ message: "Error fetching pipeline data" });
    }
  });

  // =========== TWILIO ROUTES ===========
  console.log("Registering Twilio routes...");
  
  // Define the base URL for Twilio webhook validation
  const twilioWebhookBaseUrl = process.env.API_URL ? `${process.env.API_URL}/api/twilio/voice` : '';
  console.log(`Twilio webhook base URL: ${twilioWebhookBaseUrl}`);
  
  // Twilio voice webhook endpoint
  app.post("/api/twilio/voice", twilioWebhook(twilioWebhookBaseUrl), handleVoiceWebhook);
  console.log("Registered POST /api/twilio/voice route");
  
  // Twilio status callback endpoint
  app.post("/api/twilio/status-callback", twilioWebhook(""), handleStatusCallback);
  console.log("Registered POST /api/twilio/status-callback route");

  // Create the HTTP server
  const httpServer = createServer(app);
  console.log("All routes registered successfully");

  return httpServer;
}
