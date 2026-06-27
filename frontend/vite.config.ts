import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // always needed, cache separately
          react: ["react", "react-dom"],
          // heavy, only needed for the hero
          three: ["three"],
          // lazy-loaded on demand in ResultsPanel
          jspdf: ["jspdf"],
        },
      },
    },
    // jsPDF loads on demand, so actual first-load size is well under this
    chunkSizeWarningLimit: 700,
  },
});
