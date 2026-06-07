import { describe, expect, it } from "vitest";
import { Readable } from "node:stream";
import {
  isUnsafeCrossSiteMutation,
  readJsonBody,
  sendError,
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
    });
  });

  it("applies baseline security headers", () => {
    const response = new MemoryResponse();

    setSecurityHeaders(response);

    expect(response.headers).toMatchObject({
      "Content-Security-Policy": expect.stringContaining("default-src 'self'"),
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      "Cross-Origin-Resource-Policy": "same-site",
      "Permissions-Policy": expect.stringContaining("camera=()"),
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
});
