import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // GitHub Pages serves under a project subpath (/momentum-scanner-public/).
  // Override via VITE_BASE env var if hosting elsewhere (e.g. custom domain).
  base: process.env.VITE_BASE || "/momentum-scanner-public/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
});
