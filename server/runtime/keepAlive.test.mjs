import { describe, expect, it, vi } from "vitest";
import { createKeepAliveRuntime } from "./keepAlive.mjs";

describe("createKeepAliveRuntime", () => {
  it("does nothing when disabled or missing a URL", async () => {
    const fetchImpl = vi.fn();
    const disabledRuntime = createKeepAliveRuntime({
      enabled: false,
      url: "https://smart-nutrition.test/api/health",
      fetchImpl,
    });
    const missingUrlRuntime = createKeepAliveRuntime({
      enabled: true,
      url: null,
      fetchImpl,
    });

    disabledRuntime.start();
    missingUrlRuntime.start();
    await disabledRuntime.ping();
    await missingUrlRuntime.ping();

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(disabledRuntime.getStatus()).toMatchObject({
      enabled: false,
      configured: false,
      running: false,
    });
    expect(missingUrlRuntime.getStatus()).toMatchObject({
      enabled: true,
      configured: false,
      running: false,
      urlConfigured: false,
    });
  });

  it("records successful keepalive pings", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    const runtime = createKeepAliveRuntime({
      enabled: true,
      url: "https://smart-nutrition-sk5r.onrender.com/api/health",
      fetchImpl,
      logger: { info: vi.fn(), warn: vi.fn() },
    });

    await runtime.ping();

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://smart-nutrition-sk5r.onrender.com/api/health",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "User-Agent": "SmartNutritionKeepAlive/1.0",
        }),
      })
    );
    expect(runtime.getStatus()).toMatchObject({
      enabled: true,
      configured: true,
      lastStatusCode: 200,
      totalPings: 1,
      failedPings: 0,
      lastError: null,
    });
    expect(runtime.getStatus().lastSuccessAt).toEqual(expect.any(String));
  });

  it("records failed pings without throwing", async () => {
    const logger = { info: vi.fn(), warn: vi.fn() };
    const runtime = createKeepAliveRuntime({
      enabled: true,
      url: "https://smart-nutrition-sk5r.onrender.com/api/health",
      fetchImpl: vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      }),
      logger,
    });

    await expect(runtime.ping()).resolves.toMatchObject({
      totalPings: 1,
      failedPings: 1,
      lastStatusCode: 503,
      lastError: {
        code: "KEEPALIVE_FAILED",
        message: "Keepalive endpoint returned 503.",
      },
    });
    expect(logger.warn).toHaveBeenCalledWith(
      "[keepalive] ping failed",
      expect.objectContaining({ code: "KEEPALIVE_FAILED" })
    );
  });
});
