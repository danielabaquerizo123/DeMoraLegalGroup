import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {},
  },
  preview: {
    host: "0.0.0.0",
    allowedHosts: ["demoralegalgroup.up.railway.app"],
  },
});
