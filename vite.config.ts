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
    // allow ngrok domains to access the dev server
    allowedHosts: ['*.ngrok-free.app'],
    // disable host header validation
    cors: true,
    // ensure HMR callbacks work over the tunnel
    hmr: {
      protocol: 'wss',    // Use secure WebSockets
      clientPort: 443,    // Port for client connections through ngrok
      host: '0888-2600-1700-be6-7a00-dc41-3456-215f-d003.ngrok-free.app', // Your specific ngrok hostname
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
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
