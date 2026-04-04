import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");

          if (!normalizedId.includes("node_modules")) {
            return undefined;
          }

          if (
            normalizedId.includes("/node_modules/react/") ||
            normalizedId.includes("/node_modules/react-dom/") ||
            normalizedId.includes("/node_modules/react-router-dom/") ||
            normalizedId.includes("/node_modules/react-redux/") ||
            normalizedId.includes("/node_modules/@reduxjs/toolkit/") ||
            normalizedId.includes("/node_modules/redux-persist/")
          ) {
            return "react-vendor";
          }

          if (
            normalizedId.includes("/node_modules/@mui/") ||
            normalizedId.includes("/node_modules/@emotion/")
          ) {
            return "ui-vendor";
          }

          if (
            normalizedId.includes("/node_modules/react-hook-form/") ||
            normalizedId.includes("/node_modules/zod/") ||
            normalizedId.includes("/node_modules/@hookform/resolvers/")
          ) {
            return "forms-vendor";
          }

          if (
            normalizedId.includes("/node_modules/@zxing/browser/") ||
            normalizedId.includes("/node_modules/axios/")
          ) {
            return "scanner-vendor";
          }

          return undefined;
        },
      },
    },
  },
});
