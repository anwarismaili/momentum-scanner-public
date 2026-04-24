import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // Relative base so the build works under any path prefix (e.g. Perplexity's
  // /sites/proxy/.../dist/ deploy URL). Use absolute ("/") only if hosting at
  // a domain root.
  base: "./",
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
