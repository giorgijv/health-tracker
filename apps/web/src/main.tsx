import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./App";
import { AuthProvider } from "./lib/AuthContext";
import "./index.css";

// HashRouter (not BrowserRouter): GitHub Pages is a static host with no
// server-side rewrites, so a path-based route like /progress 404s on refresh.
// Hash routes (/#/progress) always resolve to index.html, no server config needed.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
);
