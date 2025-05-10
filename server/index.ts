import express, { type Request, Response, NextFunction } from "express";
import cors from 'cors';
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { createServer } from "http";

const app = express();

// Enhanced request logging
app.use((req, res, next) => {
  log(`${req.method} ${req.url} - Incoming request`);
  next();
});

// --- CORS Configuration ---
const allowedOrigins = [
  'http://localhost:5173', // For local client development
  // TODO: Add your production client domain here later if it's different
  // e.g., 'https://your-deployed-client.onrender.com'
];

app.use(cors({
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `CORS policy: The origin '${origin}' is not allowed access.`;
      console.warn(msg); // Log the blocked origin
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true, // Allow cookies and authorization headers to be sent and received
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Specify allowed HTTP methods
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'] // Specify allowed headers
}));

// Body parsers - make sure these are after CORS and before any route handlers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

  // THEN add the catch-all for unknown API routes - after all real routes are registered
  app.use('/api/*', (req, res, next) => {
    // Only process unhandled routes
    const handler = req.route;
    if (!handler) {
      log(`Unhandled API request: ${req.method} ${req.path}`);
      return res.status(404).json({
        message: `API endpoint not found: ${req.method} ${req.path}`,
        success: false
      });
    }
    next();
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
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
