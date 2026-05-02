import { describe, expect, it, vi } from "vitest";
import { createSessionToken } from "../lib/domain.mjs";
import { createAuthService } from "./authService.mjs";

const createAuthServiceFixture = ({ configOverrides = {} } = {}) => {
  const authRepository = {
    findUserByEmail: vi.fn(),
    findUserById: vi.fn(),
    insertUser: vi.fn(),
    updateUser: vi.fn(),
    updateUserPassword: vi.fn(),
    deleteUser: vi.fn(),
    listUserBackups: vi.fn(() => []),
    readUserBackup: vi.fn(() => null),
    createSession: vi.fn(),
    findSessionByToken: vi.fn(),
    deleteSessionByToken: vi.fn(),
    deleteSessionsByUserId: vi.fn(),
    createPasswordResetToken: vi.fn(),
    findPasswordResetTokenByHash: vi.fn(),
    markPasswordResetTokenConsumed: vi.fn(),
    deletePasswordResetTokensByUserId: vi.fn(),
    incrementUserTokenVersion: vi.fn(),
    getLoginAttempt: vi.fn(),
    upsertLoginAttempt: vi.fn(),
    clearLoginAttempt: vi.fn(),
    cleanupExpiredSessions: vi.fn(),
    cleanupExpiredPasswordResetTokens: vi.fn(),
  };
  const stateRepository = {
    getSnapshotByUserId: vi.fn(() => null),
    upsertSnapshot: vi.fn(),
  };
  const emailService = {
    sendPasswordResetEmail: vi.fn(async () => ({ ok: false, code: "EMAIL_NOT_CONFIGURED" })),
  };
  const config = {
    accessTokenTtlMs: 900000,
    refreshTokenTtlMs: 604800000,
    jwtSecret: "x".repeat(40),
    maxLoginAttempts: 5,
    loginLockMs: 300000,
    passwordIterations: 180000,
    passwordResetTokenTtlMs: 3600000,
    isProduction: false,
    appBaseUrl: "http://localhost:5173",
    ...configOverrides,
  };

  return {
    authRepository,
    stateRepository,
    emailService,
    config,
    service: createAuthService({
      authRepository,
      stateRepository,
      emailService,
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

    const result = service.refreshSession({ headers: {} }, { refreshToken });

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

  it("creates a password reset preview token for an existing user", async () => {
    const { authRepository, emailService, service } = createAuthServiceFixture();
    const user = {
      id: "user-12",
      email: "reset@example.com",
      name: "Reset User",
      role: "USER",
    };

    authRepository.findUserByEmail.mockReturnValue(user);

    const result = await service.requestPasswordReset({ email: user.email });

    expect(authRepository.deletePasswordResetTokensByUserId).toHaveBeenCalledWith(user.id);
    expect(authRepository.createPasswordResetToken).toHaveBeenCalledTimes(1);
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(true);
    expect(result.delivery).toBe("preview");
    expect(result.previewToken).toBeTruthy();
  });

  it("returns email delivery mode when the mailer succeeds", async () => {
    const { authRepository, emailService, service } = createAuthServiceFixture();
    const user = {
      id: "user-13",
      email: "mail@example.com",
      name: "Mail User",
      role: "USER",
    };

    authRepository.findUserByEmail.mockReturnValue(user);
    emailService.sendPasswordResetEmail.mockResolvedValue({
      ok: true,
      messageId: "msg-1",
    });

    const result = await service.requestPasswordReset({ email: user.email });

    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(result.delivery).toBe("email");
    expect(result.previewToken).toBeUndefined();
  });

  it("does not expose password reset delivery failures in production", async () => {
    const { authRepository, emailService, service } = createAuthServiceFixture({
      configOverrides: { isProduction: true },
    });
    const user = {
      id: "user-prod-reset",
      email: "prod-reset@example.com",
      name: "Prod Reset User",
      role: "USER",
    };

    authRepository.findUserByEmail.mockReturnValue(user);
    emailService.sendPasswordResetEmail.mockResolvedValue({
      ok: false,
      code: "EMAIL_NOT_CONFIGURED",
    });

    const result = await service.requestPasswordReset({ email: user.email });

    expect(result).toMatchObject({
      ok: true,
      delivery: "email",
    });
    expect(result.previewToken).toBeUndefined();
  });

  it("rejects invalid registration profile fields server-side", () => {
    const { service } = createAuthServiceFixture();

    expect(() =>
      service.register({
        name: "A",
        email: "invalid-profile@example.com",
        password: "StrongPass123!",
        age: 8,
        weight: 20,
        height: 80,
        gender: "robot",
        activity: "hovering",
        goal: "teleport",
      })
    ).toThrow(/valid email|Name|Age|Weight|Height|Gender|Activity|Goal/);
  });

  it("rejects invalid profile updates server-side", () => {
    const { service } = createAuthServiceFixture();
    const currentUser = {
      id: "user-profile",
      email: "profile@example.com",
      name: "Profile User",
      age: 31,
      weight: 76,
      height: 176,
      gender: "male",
      activity: "moderate",
      goal: "maintain",
      role: "USER",
    };

    expect(() =>
      service.updateUserProfile(
        {
          weight: 500,
        },
        currentUser
      )
    ).toThrow(/Weight/);
  });

  it("resets the password, revokes sessions, and bumps token version", () => {
    const { authRepository, config, service } = createAuthServiceFixture();
    const user = {
      id: "user-18",
      email: "renew@example.com",
      name: "Renew User",
      role: "USER",
      passwordHash: "old",
      passwordSalt: "salt",
      passwordVersion: "pbkdf2-sha256",
      tokenVersion: 0,
    };
    const rawToken = "preview-token";
    const resetToken = {
      id: "pw-reset-1",
      userId: user.id,
      tokenHash: "hash",
      expiresAt: Date.now() + 10_000,
      consumedAt: null,
      createdAt: new Date().toISOString(),
    };

    authRepository.findPasswordResetTokenByHash.mockReturnValue(resetToken);
    authRepository.findUserById.mockReturnValue(user);
    authRepository.markPasswordResetTokenConsumed.mockReturnValue({
      ...resetToken,
      consumedAt: new Date().toISOString(),
    });

    const result = service.resetPassword({
      token: rawToken,
      password: "StrongPass123!",
    });

    expect(result.ok).toBe(true);
    expect(authRepository.updateUserPassword).toHaveBeenCalledTimes(1);
    expect(authRepository.incrementUserTokenVersion).toHaveBeenCalledWith(user.id);
    expect(authRepository.deleteSessionsByUserId).toHaveBeenCalledWith(user.id);
    expect(authRepository.deletePasswordResetTokensByUserId).toHaveBeenCalledWith(user.id);
    expect(authRepository.clearLoginAttempt).toHaveBeenCalledWith(user.email);
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
