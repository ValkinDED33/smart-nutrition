import { Readable } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import { createAdminRoutes } from "./admin.routes.mjs";
import {
  createClientErrorController,
  createClientErrorMemoryStore,
  createClientErrorRoutes,
  sanitizeClientErrorReport,
  sanitizeClientErrorRuntimeContext,
} from "./clientError.routes.mjs";

class MemoryResponse {
  statusCode = 200;
  headers = {};
  body = "";

  writeHead(statusCode, headers = {}) {
    this.statusCode = statusCode;
    this.headers = { ...this.headers, ...headers };
  }

  setHeader(name, value) {
    this.headers[name] = value;
  }

  end(body = "") {
    this.body = String(body);
  }
}

const createJsonRequest = (body) => {
  const request = Readable.from([Buffer.from(JSON.stringify(body))]);
  request.headers = { "content-type": "application/json" };
  request.method = "POST";

  return request;
};

describe("client error routes", () => {
  it("registers a public client error route", () => {
    expect(
      createClientErrorRoutes({
        clientErrorController: createClientErrorController(),
      }).map((route) => [route.method, route.pathname])
    ).toEqual([["POST", "/api/client-errors"]]);
  });

  it("keeps client error diagnostics lookup behind admin routes", () => {
    expect(
      createClientErrorRoutes({
        clientErrorController: createClientErrorController(),
      }).some((route) => route.pathname === "/api/admin/client-errors")
    ).toBe(false);
    expect(
      createAdminRoutes({
        adminController: { listClientErrors: vi.fn() },
      }).some(
        (route) =>
          route.method === "GET" && route.pathname === "/api/admin/client-errors"
      )
    ).toBe(true);
  });

  it("sanitizes sensitive client error fields", () => {
    const report = sanitizeClientErrorReport({
      id: "sn-test",
      errorName: "ChunkLoadError",
      message: "Failed /reset-password?token=secret-token&email=user@example.com",
      route: "/verify-email?token=secret-code",
      componentStackLines: ["at ResetPage (/x?key=secret)", "at App"],
      staleBuildLikely: true,
    });

    expect(report.message).toContain("token=[redacted]");
    expect(report.message).toContain("email=[redacted]");
    expect(report.route).toBe("/verify-email?token=[redacted]");
    expect(report.componentStackLines[0]).toContain("key=[redacted]");
    expect(report.staleBuildLikely).toBe(true);
  });

  it("logs sanitized reports and returns accepted", async () => {
    const logger = { warn: vi.fn() };
    const sentryRuntime = { captureException: vi.fn() };
    const clientErrorStore = createClientErrorMemoryStore();
    const controller = createClientErrorController({
      logger,
      sentryRuntime,
      clientErrorStore,
    });
    const response = new MemoryResponse();

    await controller.reportClientError({
      request: createJsonRequest({
        id: "sn-mobile",
        errorName: "TypeError",
        message: "Broken at /reset-password?token=secret",
        route: "/progress",
        componentStackLines: ["at ProgressPage"],
        runtimeContext: {
          viewport: { width: 393, height: 851, devicePixelRatio: 2.75 },
          online: false,
          language: "uk-UA",
          timezone: "Europe/Warsaw",
          visibilityState: "visible",
          colorScheme: "dark",
          reducedMotion: true,
          standalone: true,
          serviceWorkerControlled: true,
          connection: {
            effectiveType: "4g",
            saveData: true,
            downlinkMbps: 1.3,
            rttMs: 350,
          },
          build: { mode: "production", baseUrl: "/", production: true },
        },
      }),
      response,
    });

    expect(response.statusCode).toBe(202);
    expect(JSON.parse(response.body)).toEqual({ ok: true, id: "sn-mobile" });
    expect(logger.warn).toHaveBeenCalledWith(
      "[client-error] ui crash reported",
      expect.objectContaining({
        id: "sn-mobile",
        message: "Broken at /reset-password?token=[redacted]",
        runtimeContext: expect.objectContaining({
          viewport: { width: 393, height: 851, devicePixelRatio: 2.75 },
          online: false,
          language: "uk-UA",
          colorScheme: "dark",
          connection: expect.objectContaining({ effectiveType: "4g" }),
        }),
      })
    );
    expect(sentryRuntime.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        diagnosticId: "sn-mobile",
        runtimeContext: expect.objectContaining({ language: "uk-UA" }),
      })
    );
    expect(clientErrorStore.list({ id: "sn-mobile" })).toEqual([
      expect.objectContaining({
        id: "sn-mobile",
        message: "Broken at /reset-password?token=[redacted]",
        receivedAt: expect.any(String),
      }),
    ]);
  });

  it("keeps only the newest sanitized client error reports", () => {
    const store = createClientErrorMemoryStore({ maxItems: 2 });

    store.add(sanitizeClientErrorReport({ id: "old", message: "Old" }));
    store.add(sanitizeClientErrorReport({ id: "middle", message: "Middle" }));
    store.add(sanitizeClientErrorReport({ id: "new", message: "New" }));

    expect(store.list()).toEqual([
      expect.objectContaining({ id: "new" }),
      expect.objectContaining({ id: "middle" }),
    ]);
    expect(store.list({ id: "old" })).toEqual([]);
  });

  it("sanitizes runtime context with an allowlist", () => {
    expect(
      sanitizeClientErrorRuntimeContext({
        viewport: { width: 999_999, height: 851, devicePixelRatio: 2 },
        screen: { width: 393, height: 851 },
        online: true,
        language: "uk-UA?token=secret",
        colorScheme: "purple",
        reducedMotion: false,
        connection: {
          effectiveType: "4g?key=secret",
          saveData: false,
          downlinkMbps: 2.5,
          rttMs: -20,
        },
        build: {
          mode: "production",
          baseUrl: "/?token=secret",
          production: true,
        },
        secret: "must-not-pass",
      })
    ).toEqual({
      viewport: { width: 10_000, height: 851, devicePixelRatio: 2 },
      screen: { width: 393, height: 851 },
      online: true,
      language: "uk-UA?token=[redacted]",
      reducedMotion: false,
      connection: {
        effectiveType: "4g?key=[redacted]",
        saveData: false,
        downlinkMbps: 2.5,
        rttMs: 0,
      },
      build: {
        mode: "production",
        baseUrl: "/?token=[redacted]",
        production: true,
      },
    });
  });
});
