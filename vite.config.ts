import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const fromRoot = (target: string) => path.resolve(projectRoot, target);
const defaultApiTarget = "https://smart-nutrition-sk5r.onrender.com";

const normalizeApiProxyTarget = (value: string | undefined) => {
  if (!value) {
    return defaultApiTarget;
  }

  try {
    const parsedUrl = new URL(value);
    parsedUrl.pathname = parsedUrl.pathname.replace(/\/api\/?$/, "") || "/";
    parsedUrl.search = "";
    parsedUrl.hash = "";

    return parsedUrl.toString().replace(/\/+$/, "");
  } catch {
    return defaultApiTarget;
  }
};

const apiProxyTarget = normalizeApiProxyTarget(
  process.env.VITE_SMART_NUTRITION_DEV_API_TARGET ??
    process.env.VITE_SMART_NUTRITION_API_BASE_URL ??
    process.env.SMART_NUTRITION_API_BASE_URL
);

export default defineConfig({
  base: "/",

  plugins: [react()],

  resolve: {
    alias: {
      "@domain": fromRoot("src/domain"),
      "@data": fromRoot("src/data"),
      "@integration": fromRoot("src/integration"),
      "@state": fromRoot("src/state"),
      "@features": fromRoot("src/features"),
      "@assistant": fromRoot("src/assistant"),
      "@core": fromRoot("src/core"),
      "@widgets": fromRoot("src/widgets"),
      "@shared": fromRoot("src/shared"),
      "@app": fromRoot("src/app"),
      "@pages": fromRoot("src/pages"),
      "@routes": fromRoot("src/routes"),
    },
  },

  server: {
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },

  build: {
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",

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
            normalizedId.includes("/node_modules/@reduxjs/toolkit/")
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

          if (normalizedId.includes("/node_modules/@zxing/browser/")) {
            return "scanner-vendor";
          }

          if (normalizedId.includes("/node_modules/recharts/")) {
            return "charts-vendor";
          }

          if (
            normalizedId.includes("/node_modules/framer-motion/") ||
            normalizedId.includes("/node_modules/motion/") ||
            normalizedId.includes("/node_modules/@react-spring/") ||
            normalizedId.includes("/node_modules/react-countup/") ||
            normalizedId.includes("/node_modules/react-type-animation/")
          ) {
            return "motion-vendor";
          }

          if (
            normalizedId.includes("/node_modules/react-markdown/") ||
            normalizedId.includes("/node_modules/remark-gfm/") ||
            normalizedId.includes("/node_modules/rehype-highlight/") ||
            normalizedId.includes("/node_modules/mdast-util-") ||
            normalizedId.includes("/node_modules/micromark") ||
            normalizedId.includes("/node_modules/unified/") ||
            normalizedId.includes("/node_modules/vfile/")
          ) {
            return "markdown-vendor";
          }

          if (
            normalizedId.includes("/node_modules/browser-image-compression/") ||
            normalizedId.includes("/node_modules/react-easy-crop/") ||
            normalizedId.includes("/node_modules/canvas-confetti/") ||
            normalizedId.includes("/node_modules/howler/") ||
            normalizedId.includes("/node_modules/use-sound/")
          ) {
            return "media-vendor";
          }

          if (
            normalizedId.includes("/node_modules/@dnd-kit/") ||
            normalizedId.includes("/node_modules/fuse.js/") ||
            normalizedId.includes("/node_modules/react-virtuoso/") ||
            normalizedId.includes("/node_modules/react-swipeable/") ||
            normalizedId.includes("/node_modules/screenfull/") ||
            normalizedId.includes("/node_modules/copy-to-clipboard/") ||
            normalizedId.includes("/node_modules/zustand/")
          ) {
            return "interaction-vendor";
          }

          if (
            normalizedId.includes("/node_modules/three/") ||
            normalizedId.includes("/node_modules/@react-three/") ||
            normalizedId.includes("/node_modules/@tsparticles/") ||
            normalizedId.includes("/node_modules/matter-js/")
          ) {
            return "visual-runtime-vendor";
          }

          if (
            normalizedId.includes("/node_modules/@elevenlabs/") ||
            normalizedId.includes("/node_modules/@ricky0123/") ||
            normalizedId.includes("/node_modules/onnxruntime-web/")
          ) {
            return "ai-runtime-vendor";
          }

          if (normalizedId.includes("/node_modules/@capacitor/")) {
            return "capacitor-vendor";
          }

          if (
            normalizedId.includes("/node_modules/firebase/") ||
            normalizedId.includes("/node_modules/@firebase/")
          ) {
            return "firebase-vendor";
          }

          if (normalizedId.includes("/node_modules/posthog-js/")) {
            return "analytics-vendor";
          }

          return undefined;
        },
      },
    },
  },
});
