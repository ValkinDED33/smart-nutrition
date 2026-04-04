import { describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "./domain.mjs";

describe("session token helpers", () => {
  it("creates and verifies signed session tokens", () => {
    const secret = "unit-test-secret";
    const expiresAt = Date.now() + 60_000;
    const token = createSessionToken({
      userId: "user-123",
      expiresAt,
      secret,
    });

    const verified = verifySessionToken(token, secret);

    expect(verified).toEqual({
      userId: "user-123",
      expiresAt: Math.floor(expiresAt / 1000) * 1000,
      kind: "access",
    });
  });

  it("rejects tokens signed with a different secret", () => {
    const token = createSessionToken({
      userId: "user-123",
      expiresAt: Date.now() + 60_000,
      secret: "secret-a",
    });

    expect(verifySessionToken(token, "secret-b")).toBeNull();
  });

  it("preserves refresh token kind", () => {
    const secret = "unit-test-secret";
    const expiresAt = Date.now() + 60_000;
    const token = createSessionToken({
      userId: "user-123",
      expiresAt,
      secret,
      kind: "refresh",
    });

    expect(verifySessionToken(token, secret)).toEqual({
      userId: "user-123",
      expiresAt: Math.floor(expiresAt / 1000) * 1000,
      kind: "refresh",
    });
  });
});
