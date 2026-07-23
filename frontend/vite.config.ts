import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  define: {
    global: "window",
  },

  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:1026",
        changeOrigin: true,
      },
      "/ws": {
        target: "http://localhost:1026",
        ws: true,
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:1026",
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router-dom")
            ) {
              return "react-vendor";
            }

            if (
              id.includes("lucide-react") ||
              id.includes("framer-motion") ||
              id.includes("@radix-ui")
            ) {
              return "ui-vendor";
            }

            if (
              id.includes("@tanstack") ||
              id.includes("zustand") ||
              id.includes("axios") ||
              id.includes("date-fns") ||
              id.includes("@stomp") ||
              id.includes("sockjs")
            ) {
              return "data-vendor";
            }

            return "vendor";
          }
        },
      },
    },
  },
});
