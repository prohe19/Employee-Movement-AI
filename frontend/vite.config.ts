import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API calls to the backend during development so cookies are same-origin.
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      // Uploaded forms and generated PDFs are stored with same-origin /uploads URLs.
      "/uploads": { target: "http://localhost:4000", changeOrigin: true },
      // Static assets (the ITM letterhead used by the letter preview).
      "/assets": { target: "http://localhost:4000", changeOrigin: true },
    },
  },
});
