import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// Importação condicional dos plugins do Replit
let runtimeErrorOverlay;
let cartographer;

const isReplit = process.env.REPL_ID !== undefined;

if (isReplit) {
  try {
    runtimeErrorOverlay = require("@replit/vite-plugin-runtime-error-modal");
  } catch {}
  if (process.env.NODE_ENV !== "production") {
    try {
      cartographer = require("@replit/vite-plugin-cartographer");
    } catch {}
  }
}

export default defineConfig({
  plugins: [
    react(),
    ...(isReplit && runtimeErrorOverlay ? [runtimeErrorOverlay()] : []),
    ...(isReplit && cartographer ? [cartographer.cartographer()] : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    ...(process.env.VITE_USE_PROXY === 'true' ? {
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    } : {}),
  },
});
