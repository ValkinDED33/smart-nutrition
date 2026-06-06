import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const fromRoot = (target: string) => path.resolve(projectRoot, target);

export default defineConfig({
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

  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "server/**/*.test.mjs"],
    exclude: ["dist/**", "node_modules/**"],
  },
});
