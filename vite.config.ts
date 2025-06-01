import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  optimizeDeps: {
    exclude: [
      "@twilio/voice-sdk", // Exclude from optimization due to complex module structure
      "bufferutil", // Optional dependency that can cause problems
    ],
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@radix-ui/react-slot",
      "@radix-ui/react-dialog",
      "lucide-react",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    // listen on all interfaces so ngrok can proxy in
    host: true,
    // force Vite to use the specified port
    strictPort: true,
    port: 5173, // Explicitly set the port
    // allow ngrok domains to access the dev server
    allowedHosts: ['*.ngrok-free.app'],
    // disable host header validation
    cors: true,
    // Configure file watching to ignore noisy files
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/mockServiceWorker.js',
        '**/.git/**',
        '**/.DS_Store',
      ],
      usePolling: false, // Set to true only if regular watching doesn't work
    },
    // Fix HMR configuration for local development
    hmr: {
      protocol: 'ws',    // Use standard WebSockets for local dev
      host: 'localhost', // Use localhost for local development
      clientPort: 5173,  // Match the port Vite is serving on
      // Comment out the ngrok-specific host when developing locally
      // host: '0888-2600-1700-be6-7a00-dc41-3456-215f-d003.ngrok-free.app',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
        },
        rewrite: (path) => {
          console.log(`Proxying ${path} to Express server`);
          return path;
        }
      }
    }
  }
});
