import { describe, expect, it } from "vitest";
import {
  applySecurityHeaders,
  buildContentSecurityPolicy,
} from "./securityHeaders.mjs";

class MemoryResponse {
  headers = {};

  getHeader(name) {
    return this.headers[name];
  }

  setHeader(name, value) {
    this.headers[name] = value;
  }
}

describe("security headers runtime", () => {
  it("applies baseline security headers", () => {
    const response = new MemoryResponse();

    applySecurityHeaders(response);

    expect(response.headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(response.headers["X-Frame-Options"]).toBe("DENY");
    expect(response.headers["Referrer-Policy"]).toBe(
      "strict-origin-when-cross-origin"
    );
    expect(response.headers["Content-Security-Policy"]).toContain(
      "default-src 'self'"
    );
  });

  it("does not overwrite headers that were already set", () => {
    const response = new MemoryResponse();
    response.setHeader("X-Frame-Options", "SAMEORIGIN");

    applySecurityHeaders(response);

    expect(response.headers["X-Frame-Options"]).toBe("SAMEORIGIN");
  });

  it("adds upgrade-insecure-requests only in production CSP", () => {
    expect(buildContentSecurityPolicy({ isProduction: true })).toContain(
      "upgrade-insecure-requests"
    );
    expect(buildContentSecurityPolicy({ isProduction: false })).not.toContain(
      "upgrade-insecure-requests"
    );
  });
});
