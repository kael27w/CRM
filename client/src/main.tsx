import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Prevent unwanted full reloads during development
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeFullReload', (data) => {
    // Log what triggered the reload attempt for debugging
    console.log('Prevented full reload triggered by:', data);
    // Prevent the full reload
    throw '(skipping full reload)';
  });
}

createRoot(document.getElementById("root")!).render(<App />);
