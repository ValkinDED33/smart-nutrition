import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const fromRoot = (target: string) => path.resolve(projectRoot, target);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@domain": fromRoot("src/domain"),
      "@data": fromRoot("src/data"),
      "@integration": fromRoot("src/integration"),
      "@state": fromRoot("src/state"),
      "@features": fromRoot("src/features"),
      "@shared": fromRoot("src/shared"),
      "@app": fromRoot("src/app"),
      "@pages": fromRoot("src/pages"),
      "@routes": fromRoot("src/routes"),
    },
  },
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
