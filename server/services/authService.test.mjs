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
    listUserBackups: vi.fn(() => []),
    readUserBackup: vi.fn(() => null),
    createSession: vi.fn(),
    findSessionByToken: vi.fn(),
    deleteSessionByToken: vi.fn(),
    deleteSessionsByUserId: vi.fn(),
    incrementUserTokenVersion: vi.fn(),
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
      tokenVersion: 0,
      createdAt: new Date().toISOString(),
    };
    const expiresAt = Date.now() + 60_000;
    const refreshToken = createSessionToken({
      userId: user.id,
      expiresAt,
      secret: config.jwtSecret,
      kind: "refresh",
      tokenVersion: user.tokenVersion,
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

    service.logoutAll({ id: "user-42", role: "USER", tokenVersion: 0 });

    expect(authRepository.incrementUserTokenVersion).toHaveBeenCalledWith("user-42");
    expect(authRepository.deleteSessionsByUserId).toHaveBeenCalledWith("user-42");
  });

  it("rejects access tokens when the stored token version changes", () => {
    const { authRepository, config, service } = createAuthServiceFixture();
    const user = {
      id: "user-9",
      email: "stale@example.com",
      name: "Stale Session",
      avatar: undefined,
      age: 29,
      weight: 75,
      height: 178,
      gender: "male",
      activity: "moderate",
      goal: "maintain",
      measurements: undefined,
      passwordHash: "hash",
      passwordSalt: "salt",
      passwordVersion: "pbkdf2-sha256",
      tokenVersion: 2,
      createdAt: new Date().toISOString(),
    };
    const accessToken = createSessionToken({
      userId: user.id,
      expiresAt: Date.now() + 60_000,
      secret: config.jwtSecret,
      tokenVersion: 1,
    });

    authRepository.findUserById.mockReturnValue(user);

    expect(service.authenticateToken(accessToken)).toBeNull();
  });

  it("exports account data with snapshot and backup summaries", () => {
    const { authRepository, stateRepository, service } = createAuthServiceFixture();
    const currentUser = {
      id: "user-7",
      email: "user@example.com",
      name: "Example User",
      avatar: undefined,
      age: 28,
      weight: 68,
      height: 172,
      gender: "female",
      activity: "light",
      goal: "cut",
      measurements: undefined,
      createdAt: new Date().toISOString(),
      role: "USER",
    };
    const snapshot = {
      profile: { dailyCalories: 1800 },
      meal: { items: [] },
      updatedAt: new Date().toISOString(),
    };
    const backups = [{ id: "backup-1.json", reason: "snapshot", updatedAt: new Date().toISOString() }];

    stateRepository.getSnapshotByUserId.mockReturnValue(snapshot);
    authRepository.listUserBackups.mockReturnValue(backups);

    const result = service.exportAccountData(currentUser);

    expect(result.user.email).toBe(currentUser.email);
    expect(result.snapshot).toEqual(snapshot);
    expect(result.backups).toEqual(backups);
  });
});
