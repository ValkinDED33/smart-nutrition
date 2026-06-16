import { describe, expect, it, vi } from "vitest";
import { createHealthController, createHealthRoutes } from "./health.routes.mjs";

const createController = (debugStartupEnabled = false) =>
  createHealthController({
    authService: {
      getHealthInfo: () => ({ ok: true }),
    },
    getStorageStatus: () => ({ engine: "memory" }),
    getCacheStatus: () => ({ enabled: false }),
    getStaticStatus: () => ({ enabled: false, available: false }),
    getMetrics: () => ({}),
    getLimits: () => ({}),
    getWarnings: () => [],
    getEmailStatus: () => ({ configured: false }),
    getBrevoStatus: () => null,
    getProductLookupStatus: () => null,
    getAiStatus: () => ({ configured: false }),
    getReadiness: () => ({ ok: true, ready: true }),
    getDebugStartup: vi.fn(() => ({ ok: true })),
    debugStartupEnabled,
  });

describe("health routes", () => {
  it("does not register startup diagnostics unless explicitly enabled", () => {
    const routes = createHealthRoutes({ healthController: createController(false) });

    expect(routes.map((route) => route.pathname)).toEqual([
      "/api/health",
      "/api/ready",
    ]);
  });

  it("registers startup diagnostics when enabled", () => {
    const routes = createHealthRoutes({ healthController: createController(true) });

    expect(routes.map((route) => route.pathname)).toContain("/api/debug/startup");
  });
});
