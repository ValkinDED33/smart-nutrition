import { describe, expect, it } from "vitest";
import { Readable } from "node:stream";
import {
  ensureRequestId,
  isUnsafeCrossSiteMutation,
  readJsonBody,
  sendError,
  setCorsHeaders,
  setSecurityHeaders,
} from "./http.mjs";

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

  getHeader(name) {
    return this.headers[name];
  }

  end(body = "") {
    this.body = String(body);
  }
}

describe("http response helpers", () => {
  it("sends API errors with a stable compatibility shape", () => {
    const response = new MemoryResponse();

    sendError(response, 400, "INVALID_JSON", "Request body must be valid JSON.");

    expect(response.statusCode).toBe(400);
    expect(response.headers["Content-Type"]).toBe("application/json; charset=utf-8");
    expect(JSON.parse(response.body)).toEqual({
      success: false,
      code: "INVALID_JSON",
      error: "Request body must be valid JSON.",
      message: "Request body must be valid JSON.",
      requestId: expect.stringMatching(/^sn-/),
    });
    expect(response.headers["X-Request-Id"]).toMatch(/^sn-/);
  });

  it("reuses an existing request id when returning API errors", () => {
    const response = new MemoryResponse();
    response.setHeader("X-Request-Id", "sn-test-request");

    sendError(response, 503, "STATE_SYNC_UNAVAILABLE", "Cloud profile sync is unavailable.");

    expect(JSON.parse(response.body)).toMatchObject({
      code: "STATE_SYNC_UNAVAILABLE",
      requestId: "sn-test-request",
    });
    expect(response.headers["X-Request-Id"]).toBe("sn-test-request");
  });

  it("accepts safe inbound request ids for cross-layer production diagnostics", () => {
    const response = new MemoryResponse();
    const request = {
      headers: {
        "x-request-id": "sn-browser-smoke-1",
      },
    };

    expect(ensureRequestId(response, request)).toBe("sn-browser-smoke-1");
    expect(response.headers["X-Request-Id"]).toBe("sn-browser-smoke-1");
  });

  it("applies baseline security headers", () => {
    const response = new MemoryResponse();

    setSecurityHeaders(response);

    expect(response.headers).toMatchObject({
      "Content-Security-Policy": expect.stringContaining("default-src 'self'"),
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      "Cross-Origin-Resource-Policy": "same-site",
      "Permissions-Policy": expect.stringContaining("camera=(self)"),
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });
  });

  it("rejects non-json request bodies before parsing", async () => {
    const request = Readable.from([Buffer.from("hello")]);
    request.headers = { "content-type": "text/plain" };
    request.destroy = () => {};

    await expect(readJsonBody(request, 1024)).rejects.toThrow("UNSUPPORTED_MEDIA_TYPE");
  });

  it("accepts explicit json request bodies", async () => {
    const request = Readable.from([Buffer.from(JSON.stringify({ ok: true }))]);
    request.headers = { "content-type": "application/json; charset=utf-8" };

    await expect(readJsonBody(request, 1024)).resolves.toEqual({ ok: true });
  });

  it("detects disallowed cross-site mutations", () => {
    expect(
      isUnsafeCrossSiteMutation(
        {
          method: "POST",
          headers: { origin: "https://evil.example" },
        },
        ["https://app.example"]
      )
    ).toBe(true);

    expect(
      isUnsafeCrossSiteMutation(
        {
          method: "POST",
          headers: { origin: "https://app.example" },
        },
        ["https://app.example"]
      )
    ).toBe(false);

    expect(
      isUnsafeCrossSiteMutation(
        {
          method: "GET",
          headers: { origin: "https://evil.example" },
        },
        ["https://app.example"]
      )
    ).toBe(false);
  });

  it("rejects browser-reported cross-site mutations when Origin is missing", () => {
    expect(
      isUnsafeCrossSiteMutation(
        {
          method: "POST",
          headers: { "sec-fetch-site": "cross-site" },
        },
        ["https://app.example"]
      )
    ).toBe(true);

    expect(
      isUnsafeCrossSiteMutation(
        {
          method: "POST",
          headers: { "sec-fetch-site": "same-origin" },
        },
        ["https://app.example"]
      )
    ).toBe(false);
  });

  it("uses Referer as a CSRF fallback when Origin is missing", () => {
    expect(
      isUnsafeCrossSiteMutation(
        {
          method: "POST",
          headers: { referer: "https://evil.example/path" },
        },
        ["https://app.example"]
      )
    ).toBe(true);

    expect(
      isUnsafeCrossSiteMutation(
        {
          method: "POST",
          headers: { referer: "https://app.example/profile" },
        },
        ["https://app.example"]
      )
    ).toBe(false);
  });

  it("allows request-id diagnostics through credentialed CORS preflight", () => {
    const headers = {};
    const response = {
      setHeader: (name, value) => {
        headers[name] = value;
      },
    };

    setCorsHeaders(
      {
        headers: {
          origin: "https://smart-nutrition.club",
          "access-control-request-headers":
            "content-type, x-request-id, x-state-version",
        },
      },
      response,
      ["https://smart-nutrition.club"]
    );

    expect(headers["Access-Control-Allow-Origin"]).toBe(
      "https://smart-nutrition.club"
    );
    expect(headers["Access-Control-Allow-Credentials"]).toBe("true");
    expect(headers["Access-Control-Allow-Headers"]).toContain("X-Request-Id");
    expect(headers["Access-Control-Allow-Headers"]).toContain("X-State-Version");
    expect(headers["Access-Control-Expose-Headers"]).toContain("X-Request-Id");
    expect(headers["Access-Control-Expose-Headers"]).toContain("Retry-After");
    expect(headers["Access-Control-Expose-Headers"]).toContain(
      "X-Auth-RateLimit-Remaining"
    );
  });

  it("does not echo arbitrary browser-requested CORS headers", () => {
    const headers = {};
    const response = {
      setHeader: (name, value) => {
        headers[name] = value;
      },
    };

    setCorsHeaders(
      {
        headers: {
          origin: "https://smart-nutrition.club",
          "access-control-request-headers":
            "content-type, x-request-id, x-debug-secret, x-admin-token",
        },
      },
      response,
      ["https://smart-nutrition.club"]
    );

    expect(headers["Access-Control-Allow-Headers"]).toContain("Content-Type");
    expect(headers["Access-Control-Allow-Headers"]).toContain("X-Request-Id");
    expect(headers["Access-Control-Allow-Headers"]).not.toContain("x-debug-secret");
    expect(headers["Access-Control-Allow-Headers"]).not.toContain("x-admin-token");
    expect(headers["Access-Control-Expose-Headers"]).not.toContain("x-debug-secret");
    expect(headers["Access-Control-Expose-Headers"]).not.toContain("x-admin-token");
  });
});
