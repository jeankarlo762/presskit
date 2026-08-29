import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  preview: {
    // Railway's proxy forwards its generated *.up.railway.app hostname as
    // the Host header — Vite's preview server otherwise rejects any Host it
    // doesn't recognize (DNS-rebinding protection), which 403s every request.
    allowedHosts: true,
  },
});
