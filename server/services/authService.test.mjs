import { describe, expect, it, vi } from "vitest";
import { createSessionToken } from "../lib/domain.mjs";
import { createAuthService } from "./authService.mjs";

const createAuthServiceFixture = () => {
  const authRepository = {
    findUserByEmail: vi.fn(),
    findUserById: vi.fn(),
    insertUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    createSession: vi.fn(),
    findSessionByToken: vi.fn(),
    deleteSessionByToken: vi.fn(),
    deleteSessionsByUserId: vi.fn(),
    getLoginAttempt: vi.fn(),
    upsertLoginAttempt: vi.fn(),
    clearLoginAttempt: vi.fn(),
    cleanupExpiredSessions: vi.fn(),
  };
  const stateRepository = {
    getSnapshotByUserId: vi.fn(() => null),
    upsertSnapshot: vi.fn(),
  };
  const config = {
    accessTokenTtlMs: 900000,
    refreshTokenTtlMs: 604800000,
    jwtSecret: "x".repeat(40),
    maxLoginAttempts: 5,
    loginLockMs: 300000,
    passwordIterations: 180000,
  };

  return {
    authRepository,
    stateRepository,
    config,
    service: createAuthService({
      authRepository,
      stateRepository,
      config,
    }),
  };
};

describe("authService", () => {
  it("rotates refresh sessions on refresh", () => {
    const { authRepository, config, service } = createAuthServiceFixture();
    const user = {
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      avatar: undefined,
      age: 30,
      weight: 80,
      height: 180,
      gender: "male",
      activity: "moderate",
      goal: "maintain",
      measurements: undefined,
      passwordHash: "hash",
      passwordSalt: "salt",
      passwordVersion: "pbkdf2-sha256",
      createdAt: new Date().toISOString(),
    };
    const expiresAt = Date.now() + 60_000;
    const refreshToken = createSessionToken({
      userId: user.id,
      expiresAt,
      secret: config.jwtSecret,
      kind: "refresh",
    });

    authRepository.findSessionByToken.mockReturnValue({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });
    authRepository.findUserById.mockReturnValue(user);

    const result = service.refreshSession({ refreshToken });

    expect(authRepository.deleteSessionByToken).toHaveBeenCalledWith(refreshToken);
    expect(authRepository.createSession).toHaveBeenCalledTimes(1);
    expect(result.refreshToken).toBeTruthy();
    expect(result.refreshToken).not.toBe(refreshToken);
    expect(result.token).toBeTruthy();
    expect(result.user.email).toBe(user.email);
  });

  it("revokes all sessions for the current user", () => {
    const { authRepository, service } = createAuthServiceFixture();

    service.logoutAll({ id: "user-42" });

    expect(authRepository.deleteSessionsByUserId).toHaveBeenCalledWith("user-42");
  });
});
