import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const typesEntry = fileURLToPath(
  new URL("../../packages/types/src/index.ts", import.meta.url),
);

export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    alias: {
      "@friends/types": typesEntry,
    },
  },
  envPrefix: ["VITE_"],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    host: "127.0.0.1",
    port: 3003,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
