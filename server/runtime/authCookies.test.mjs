import { describe, expect, it } from "vitest";

import { createAuthSessionHelpers } from "./authCookies.mjs";

class MemoryResponse {
  constructor() {
    this.statusCode = 200;
    this.headers = {};
    this.body = "";
  }

  setHeader(name, value) {
    this.headers[name.toLowerCase()] = value;
  }

  getHeader(name) {
    return this.headers[name.toLowerCase()];
  }

  writeHead(statusCode, headers = {}) {
    this.statusCode = statusCode;
    Object.entries(headers).forEach(([name, value]) => {
      this.setHeader(name, value);
    });
  }

  end(body = "") {
    this.body = String(body);
  }
}

const createHelpers = () =>
  createAuthSessionHelpers({
    authAccessCookieName: "smart-nutrition-access",
    authRefreshCookieName: "smart-nutrition-refresh",
    authCookieSameSite: "None",
    authCookieSecure: true,
    accessTokenTtlMs: 15 * 60 * 1000,
    refreshTokenTtlMs: 7 * 24 * 60 * 60 * 1000,
  });

const readCookies = (response) => {
  const cookies = response.getHeader("Set-Cookie");
  return Array.isArray(cookies) ? cookies : [cookies];
};

describe("auth cookie session helpers", () => {
  it("sets cross-site http-only auth cookies and keeps tokens out of the response body", () => {
    const response = new MemoryResponse();
    const { sendAuthSession } = createHelpers();

    sendAuthSession(response, 200, {
      token: "access-token",
      refreshToken: "refresh-token",
      user: { id: "user-1", email: "user@example.com" },
      snapshot: { version: 12 },
    });

    expect(response.statusCode).toBe(200);
    expect(response.getHeader("content-type")).toBe("application/json; charset=utf-8");

    const cookies = readCookies(response);
    expect(cookies).toHaveLength(2);
    expect(cookies[0]).toContain("smart-nutrition-access=access-token");
    expect(cookies[0]).toContain("Max-Age=900");
    expect(cookies[0]).toContain("Path=/");
    expect(cookies[0]).toContain("HttpOnly");
    expect(cookies[0]).toContain("SameSite=None");
    expect(cookies[0]).toContain("Secure");
    expect(cookies[1]).toContain("smart-nutrition-refresh=refresh-token");
    expect(cookies[1]).toContain("Max-Age=604800");
    expect(cookies[1]).toContain("Path=/");
    expect(cookies[1]).toContain("HttpOnly");
    expect(cookies[1]).toContain("SameSite=None");
    expect(cookies[1]).toContain("Secure");

    expect(JSON.parse(response.body)).toEqual({
      user: { id: "user-1", email: "user@example.com" },
      snapshot: { version: 12 },
    });
    expect(response.body).not.toContain("access-token");
    expect(response.body).not.toContain("refresh-token");
  });

  it("clears both auth cookies with the same cross-site attributes", () => {
    const response = new MemoryResponse();
    const { clearAuthCookies } = createHelpers();

    clearAuthCookies(response);

    const cookies = readCookies(response);
    expect(cookies).toHaveLength(2);
    expect(cookies[0]).toContain("smart-nutrition-access=");
    expect(cookies[1]).toContain("smart-nutrition-refresh=");

    for (const cookie of cookies) {
      expect(cookie).toContain("Max-Age=0");
      expect(cookie).toContain("Path=/");
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("SameSite=None");
      expect(cookie).toContain("Secure");
    }
  });
});
