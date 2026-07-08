import { describe, expect, it, vi } from "vitest";
import { createHealthController, createHealthRoutes } from "./health.routes.mjs";

class MemoryResponse {
  statusCode = 200;
  body = "";
  headers = {};

  writeHead(statusCode, headers = {}) {
    this.statusCode = statusCode;
    this.headers = { ...this.headers, ...headers };
  }

  end(body = "") {
    this.body = String(body);
  }
}

const createController = (debugStartupEnabled = false) =>
  createHealthController({
    authService: {
      getHealthInfo: () => ({
        ok: true,
        mode: "remote-cloud",
        provider: "smart-nutrition-mongodb-api",
        auth: "httpOnly-cookie-session",
      }),
    },
    getStorageStatus: () => ({ engine: "mongodb", database: "smart-nutrition" }),
    getCacheStatus: () => ({ enabled: false }),
    getStaticStatus: () => ({ enabled: false, available: false }),
    getMetrics: () => ({ totalRequests: 42 }),
    getLimits: () => ({ requestsPerWindow: 180 }),
    getWarnings: () => ["secret-ish operational warning"],
    getEmailStatus: () => ({ configured: false }),
    getBrevoStatus: () => ({ configured: true }),
    getTelegramStatus: () => ({ configured: true, botUsername: "SmartNutritionBot" }),
    getKeepAliveStatus: () => ({ enabled: true, urlConfigured: true }),
    getProductLookupStatus: () => ({ configured: true }),
    getAiStatus: () => ({ configured: true, primaryProviderId: "openrouter" }),
    getReadiness: () => ({
      ok: true,
      ready: true,
      checks: { storage: true, cache: true, static: true, email: true },
      storage: { engine: "mongodb", database: "smart-nutrition" },
      telegram: { configured: true },
      ai: { configured: true },
      metrics: { totalRequests: 42 },
    }),
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

  it("keeps public health response limited to non-sensitive liveness fields", () => {
    const controller = createController(false);
    const response = new MemoryResponse();

    controller.getHealth({ response });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      ok: true,
      mode: "remote-cloud",
      auth: "httpOnly-cookie-session",
      storage: { engine: "mongodb" },
      static: { enabled: false, available: false },
      email: { configured: false },
    });
    expect(response.body).not.toContain("telegram");
    expect(response.body).not.toContain("openrouter");
    expect(response.body).not.toContain("warnings");
    expect(response.body).not.toContain("smart-nutrition");
    expect(response.body).not.toContain("totalRequests");
  });

  it("keeps public readiness response limited to readiness booleans", () => {
    const controller = createController(false);
    const response = new MemoryResponse();

    controller.getReadiness({ response });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      ok: true,
      ready: true,
      checks: { storage: true, cache: true, static: true, email: true },
    });
    expect(response.body).not.toContain("telegram");
    expect(response.body).not.toContain("mongodb");
    expect(response.body).not.toContain("openrouter");
    expect(response.body).not.toContain("totalRequests");
  });
});
