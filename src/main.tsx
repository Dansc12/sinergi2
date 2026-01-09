import { createRoot } from "react-dom/client";
// Load only critical font weights immediately
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/600.css";
import App from "./App.tsx";
import "./index.css";

// Lazy load additional font weights after initial render
if (typeof window !== 'undefined') {
  requestIdleCallback(() => {
    import("@fontsource/outfit/300.css");
    import("@fontsource/outfit/500.css");
    import("@fontsource/outfit/700.css");
    import("@fontsource/outfit/800.css");
  }, { timeout: 2000 });
}

createRoot(document.getElementById("root")!).render(<App />);
