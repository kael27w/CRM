import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv to load from server/.env file (current directory)
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Debug log to verify JWT secret is loaded
console.log('[BACKEND ENV CHECK] SUPABASE_JWT_SECRET:', process.env.SUPABASE_JWT_SECRET ? 'Loaded' : 'NOT LOADED');

import express, { type Request, Response, NextFunction } from "express";
import cors from 'cors';
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { createServer } from "http";

const app = express();

// ===============================================
// 1. GLOBAL CORS MIDDLEWARE - MUST BE FIRST!
// ===============================================
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // Allow ngrok domains and localhost for development
    if (origin.includes('ngrok-free.app') || origin.startsWith('http://localhost')) {
      return callback(null, true);
    }
    
    // Log and reject other origins
    console.warn(`CORS blocked request from origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
}));

// ===============================================
// 2. ALL OTHER MIDDLEWARE AFTER CORS
// ===============================================

// Enhanced request logging
app.use((req, res, next) => {
  log(`${req.method} ${req.url} - Incoming request`);
  next();
});

// Body parsers - after CORS but before routes
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Response time logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Add simple debug endpoint to test API connection
app.get('/api/debug', (req, res) => {
  res.json({ message: 'API server is running correctly' });
});

// Add at the beginning of the registerRoutes function, right after the function declaration
app.get("/api/debug/supabase", async (req, res) => {
  try {
    const { supabase } = await import("./supabase.js");
    
    // Test the connection by fetching a small amount of data
    const { data, error } = await supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .limit(1);
    
    if (error) {
      console.error("Supabase connection error:", error);
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
  } catch (error) {
    console.error("Error testing Supabase connection:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Internal server error while testing Supabase connection" 
    });
  }
});

(async () => {
  // Register all API routes first
  const server = await registerRoutes(app);

  // Log all registered routes for debugging
  console.log("--- Registered Routes ---");
  app._router.stack.forEach(function(r: any){
    if (r.route && r.route.path && r.route.methods){
      console.log(`ROUTE: ${Object.keys(r.route.methods).join(', ').toUpperCase()} ${r.route.path}`);
    } else if (r.name === 'router' && r.handle.stack) { // For nested routers
      r.handle.stack.forEach(function(nestedR: any){
        if (nestedR.route && nestedR.route.path && nestedR.route.methods){
          console.log(`NESTED ROUTE: ${Object.keys(nestedR.route.methods).join(', ').toUpperCase()} ${nestedR.route.path}`);
        }
      });
    } else if (r.handle && r.path) { // For middleware with paths
       console.log(`MIDDLEWARE: ${r.handle.name || 'anonymous'} on path ${r.path}`);
    }
  });
  console.log("-------------------------");

  // THEN add the catch-all for unknown API routes - after all real routes are registered
  app.use('/api/*', (req, res, next) => {
    // Only process unhandled routes
    const handler = req.route;
    if (!handler) {
      log(`Unhandled API request: ${req.method} ${req.path}`);
      console.log(`EMERGENCY_DEBUG: Catch-all triggered for: ${req.method} ${req.originalUrl}`);
      console.log(`EMERGENCY_DEBUG: req.url:`, req.url);
      console.log(`EMERGENCY_DEBUG: req.originalUrl:`, req.originalUrl);
      console.log(`EMERGENCY_DEBUG: req.baseUrl:`, req.baseUrl);
      console.log(`EMERGENCY_DEBUG: req.path:`, req.path);
      console.log(`EMERGENCY_DEBUG: req.params:`, req.params);
      console.log(`EMERGENCY_DEBUG: req.headers:`, JSON.stringify(req.headers, null, 2));
      
      return res.status(404).json({
        message: `API endpoint not found: ${req.method} ${req.path}`,
        originalUrl: req.originalUrl,
        url: req.url,
        path: req.path,
        success: false
      });
    }
    next();
  });

  // ===============================================
  // 3. GLOBAL ERROR HANDLER - ALSO SETS CORS HEADERS
  // ===============================================
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    // Ensure CORS headers are set even for errors
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    
    console.error('GLOBAL_ERROR_HANDLER_CAUGHT_ERROR: ', err.message, err.stack);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    log(`Error: ${err.stack || err.message || 'Unknown error'}`);
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development") {
    // ... vite dev setup ...
  } else {
    // serveStatic(app); // <--- Temporarily commented out
    log("Static file serving disabled for API-only deployment."); // Optional: Add a log
  }

  // Use port 3002 for the API server
  const httpServer = createServer(app);
  const PORT = process.env.PORT || 3002;
  httpServer.listen(PORT, () => {
    log(`API server running on port ${PORT}`);
  });
})();
