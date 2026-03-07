import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Tell Vite to pre-bundle pdfjs-dist so the ?url worker import resolves correctly
    include: ["pdfjs-dist"],
  },
});
