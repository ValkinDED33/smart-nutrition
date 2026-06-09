/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: "domain-no-react-ui-runtime",
      severity: "error",
      from: {
        path: "^src/domain",
      },
      to: {
        path: "^(react|react-dom|@mui|framer-motion)$",
      },
    },
    {
      name: "domain-no-app-ui-layers",
      severity: "error",
      from: {
        path: "^src/domain",
      },
      to: {
        path: "^src/(pages|widgets|features|app)",
      },
    },
    {
      name: "shared-no-pages-or-widgets",
      severity: "error",
      from: {
        path: "^src/shared",
      },
      to: {
        path: "^src/(pages|widgets)",
      },
    },
    {
      name: "companion-domain-no-assistant",
      severity: "error",
      from: {
        path: "^src/companion",
      },
      to: {
        path: "^src/(assistant|features/assistant|core/assistant)",
      },
    },
    {
      name: "companion-domain-no-store",
      severity: "error",
      from: {
        path: "^src/companion",
      },
      to: {
        path: "^src/app/store",
      },
    },
    {
      name: "assistant-no-companion-ui-store",
      severity: "error",
      from: {
        path: "^src/(assistant|features/assistant|core/assistant)",
      },
      to: {
        path: "^src/features/companion",
      },
    },
    {
      name: "server-no-frontend-src",
      severity: "error",
      from: {
        path: "^server",
      },
      to: {
        path: "^src",
      },
    },
    {
      name: "widgets-no-pages",
      severity: "error",
      from: {
        path: "^src/widgets",
      },
      to: {
        path: "^src/pages",
      },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    exclude: {
      path: "^(dist|coverage|android|ios|public)/",
    },
    tsConfig: {
      fileName: "tsconfig.app.json",
    },
    enhancedResolveOptions: {
      extensions: [".js", ".jsx", ".mjs", ".ts", ".tsx", ".json"],
      conditionNames: ["import", "require", "node", "default"],
    },
  },
};
