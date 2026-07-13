import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// GH_PAGES=true is set only by the GitHub Pages deploy workflow. Local dev and
// the Render static-site build both serve from the domain root ("/").
const base = process.env.GH_PAGES === "true" ? "/health-tracker/" : "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Health Tracker",
        short_name: "HealthTracker",
        description: "Assess, track, and improve your health and fitness.",
        theme_color: "#2a78d6",
        background_color: "#eef1f5",
        display: "standalone",
        // App icons are added when branding lands — omitted for now to avoid
        // 404s from referencing files that don't exist yet.
        icons: [],
      },
    }),
  ],
  server: { port: 5173 },
});
