import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Health Tracker",
        short_name: "HealthTracker",
        description: "Assess, track, and improve your health and fitness.",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        // App icons are added when branding lands — omitted for now to avoid
        // 404s from referencing files that don't exist yet.
        icons: [],
      },
    }),
  ],
  server: { port: 5173 },
});
