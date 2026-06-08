import { describe, expect, it, vi } from "vitest";
import {
  createPasswordRecord,
  createSessionToken,
  hashOneTimeToken,
} from "../lib/domain.mjs";
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
    createRegistrationVerificationToken: vi.fn(),
    findRegistrationVerificationTokenByHash: vi.fn(),
    markRegistrationVerificationTokenConsumed: vi.fn(),
    deleteRegistrationVerificationTokensByUserId: vi.fn(),
    markUserRegistrationVerified: vi.fn(),
    cleanupExpiredRegistrationVerificationTokens: vi.fn(),
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
    isConfigured: vi.fn(() => false),
    sendPasswordResetEmail: vi.fn(async () => ({ ok: false, code: "EMAIL_NOT_CONFIGURED" })),
    sendRegistrationVerificationEmail: vi.fn(async () => ({
      ok: false,
      code: "EMAIL_NOT_CONFIGURED",
    })),
  };
  const brevoService = {
    isConfigured: vi.fn(() => false),
    getStatus: vi.fn(() => ({
      configured: false,
      provider: "brevo",
      listIdConfigured: false,
    })),
    upsertContact: vi.fn(async () => ({
      ok: true,
      skipped: true,
      code: "BREVO_NOT_CONFIGURED",
    })),
  };
  const logger = {
    warn: vi.fn(),
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
    appBaseUrl: "https://app.smartnutrition.test",
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
      brevoService,
      config,
      logger,
    }),
    brevoService,
    logger,
  };
};

describe("authService", () => {
  it("rotates refresh sessions on refresh", async () => {
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
    const refreshTokenHash = hashOneTimeToken(refreshToken, config.jwtSecret);

    authRepository.findSessionByToken.mockReturnValue({
      token: refreshTokenHash,
      userId: user.id,
      expiresAt,
    });
    authRepository.findUserById.mockReturnValue(user);

    const result = await service.refreshSession({ headers: {} }, { refreshToken });

    expect(authRepository.findSessionByToken).toHaveBeenCalledWith(refreshTokenHash);
    expect(authRepository.deleteSessionByToken).toHaveBeenCalledWith(refreshTokenHash);
    expect(authRepository.createSession).toHaveBeenCalledTimes(1);
    expect(authRepository.createSession.mock.calls[0][0].token).not.toContain(".");
    expect(result.refreshToken).toBeTruthy();
    expect(result.refreshToken).not.toBe(refreshToken);
    expect(result.token).toBeTruthy();
    expect(result.user.email).toBe(user.email);
  });

  it("rejects refresh token replay after rotation", async () => {
    const { authRepository, config, service } = createAuthServiceFixture();
    const user = {
      id: "user-refresh-replay",
      email: "refresh-replay@example.com",
      name: "Refresh Replay",
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
    const refreshTokenHash = hashOneTimeToken(refreshToken, config.jwtSecret);
    const sessions = new Map([
      [
        refreshTokenHash,
        {
          token: refreshTokenHash,
          userId: user.id,
          expiresAt,
        },
      ],
    ]);

    authRepository.findSessionByToken.mockImplementation((token) => sessions.get(token) ?? null);
    authRepository.deleteSessionByToken.mockImplementation((token) => {
      sessions.delete(token);
    });
    authRepository.createSession.mockImplementation((session) => {
      sessions.set(session.token, session);
    });
    authRepository.findUserById.mockReturnValue(user);

    await service.refreshSession({ headers: {} }, { refreshToken });

    await expect(
      service.refreshSession({ headers: {} }, { refreshToken })
    ).rejects.toMatchObject({
      code: "INVALID_REFRESH_TOKEN",
    });
    expect(authRepository.createSession).toHaveBeenCalledTimes(1);
  });

  it("revokes all sessions for the current user", async () => {
    const { authRepository, service } = createAuthServiceFixture();

    await service.logoutAll({ id: "user-42", role: "USER", tokenVersion: 0 });

    expect(authRepository.incrementUserTokenVersion).toHaveBeenCalledWith("user-42");
    expect(authRepository.deleteSessionsByUserId).toHaveBeenCalledWith("user-42");
  });

  it("rejects access tokens when the stored token version changes", async () => {
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

    expect(await service.authenticateToken(accessToken)).toBeNull();
  });

  it("creates a password reset token without exposing it when email is unavailable", async () => {
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
    expect(result.delivery).toBe("email");
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
  });

  it("returns the same password reset response for unknown emails", async () => {
    const { authRepository, emailService, service } = createAuthServiceFixture();
    const user = {
      id: "user-known-reset",
      email: "known-reset@example.com",
      name: "Known Reset",
      role: "USER",
    };

    authRepository.findUserByEmail.mockImplementation((email) =>
      email === user.email ? user : null
    );

    const knownResult = await service.requestPasswordReset({ email: user.email });
    const unknownResult = await service.requestPasswordReset({
      email: "unknown-reset@example.com",
    });

    expect(unknownResult).toEqual(knownResult);
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
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
  });

  it("does not expose registration verification tokens when production email delivery fails", async () => {
    const { authRepository, emailService, service } = createAuthServiceFixture({
      configOverrides: { isProduction: true },
    });

    await expect(
      service.register({
        name: "Email User",
        email: "prod-email@example.com",
        password: "StrongPass123!",
        age: 31,
        weight: 72,
        height: 178,
        gender: "male",
        activity: "moderate",
        goal: "maintain",
        verificationChannel: "email",
      })
    ).rejects.toMatchObject({
      code: "VERIFICATION_DELIVERY_UNAVAILABLE",
    });

    expect(emailService.sendRegistrationVerificationEmail).toHaveBeenCalledTimes(1);
    expect(authRepository.insertUser).toHaveBeenCalledTimes(1);
    expect(authRepository.deleteUser).toHaveBeenCalledWith(
      authRepository.insertUser.mock.calls[0][0].id
    );
  });

  it("sends production email verification links without previewing tokens", async () => {
    const { emailService, service } = createAuthServiceFixture({
      configOverrides: { isProduction: true },
    });
    emailService.isConfigured.mockReturnValue(true);
    emailService.sendRegistrationVerificationEmail.mockResolvedValue({
      ok: true,
      messageId: "email-1",
    });

    const result = await service.register({
      name: "Email User",
      email: "prod-email-ok@example.com",
      password: "StrongPass123!",
      age: 31,
      weight: 72,
      height: 178,
      gender: "male",
      activity: "moderate",
      goal: "maintain",
    });

    expect(result.delivery).toBe("email");
    expect(emailService.sendRegistrationVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "prod-email-ok@example.com",
        verificationUrl: expect.stringMatching(
          /^https:\/\/app\.smartnutrition\.test\/verify-email\?token=/
        ),
      })
    );
  });

  it("rejects registration for an already verified email", async () => {
    const { authRepository, emailService, service } = createAuthServiceFixture({
      configOverrides: {
        registrationVerificationTokenTtlMs: 900000,
      },
    });
    const existingUser = {
      id: "user-existing-register",
      email: "existing-register@example.com",
      name: "Existing Register",
      role: "USER",
      emailVerified: true,
    };
    const validRegistrationBody = {
      name: "Email User",
      password: "StrongPass123!",
      age: 31,
      weight: 72,
      height: 178,
      gender: "male",
      activity: "moderate",
      goal: "maintain",
    };

    emailService.sendRegistrationVerificationEmail.mockResolvedValue({
      ok: true,
      messageId: "email-1",
    });
    authRepository.findUserByEmail.mockImplementation((email) =>
      email === existingUser.email ? existingUser : null
    );

    await expect(service.register({
      ...validRegistrationBody,
      email: existingUser.email,
    })).rejects.toMatchObject({
      code: "EMAIL_IN_USE",
    });

    expect(authRepository.insertUser).not.toHaveBeenCalled();
    expect(emailService.sendRegistrationVerificationEmail).not.toHaveBeenCalled();
  });

  it("resends verification when registering an unverified email again", async () => {
    const { authRepository, emailService, service } = createAuthServiceFixture({
      configOverrides: {
        registrationVerificationTokenTtlMs: 900000,
      },
    });
    const existingUser = {
      id: "user-existing-unverified-register",
      email: "existing-unverified-register@example.com",
      name: "Existing Unverified",
      role: "USER",
      emailVerified: false,
    };
    const validRegistrationBody = {
      name: "Email User",
      password: "StrongPass123!",
      age: 31,
      weight: 72,
      height: 178,
      gender: "male",
      activity: "moderate",
      goal: "maintain",
    };

    emailService.sendRegistrationVerificationEmail.mockResolvedValue({
      ok: true,
      messageId: "email-1",
    });
    authRepository.findUserByEmail.mockImplementation((email) =>
      email === existingUser.email ? existingUser : null
    );

    const existingResult = await service.register({
      ...validRegistrationBody,
      email: existingUser.email,
    });
    const newResult = await service.register({
      ...validRegistrationBody,
      email: "new-register@example.com",
    });

    expect(existingResult).toMatchObject({
      ok: true,
      requiresVerification: true,
      delivery: "email",
      message: newResult.message,
    });
    expect(Object.keys(existingResult).sort()).toEqual(Object.keys(newResult).sort());
    expect(authRepository.insertUser).toHaveBeenCalledTimes(1);
    expect(authRepository.deleteRegistrationVerificationTokensByUserId).toHaveBeenCalledWith(
      existingUser.id
    );
    expect(authRepository.createRegistrationVerificationToken).toHaveBeenCalledTimes(2);
    expect(emailService.sendRegistrationVerificationEmail).toHaveBeenCalledTimes(2);
  });

  it("verifies email links and treats repeat opens for verified users as safe success", async () => {
    const { authRepository, config, service } = createAuthServiceFixture();
    const rawToken = "verify-token";
    const tokenHash = hashOneTimeToken(rawToken, config.jwtSecret);
    const user = {
      id: "user-verify",
      email: "verify@example.com",
      name: "Verify User",
      avatar: undefined,
      age: 31,
      weight: 72,
      height: 178,
      gender: "male",
      activity: "moderate",
      goal: "maintain",
      role: "USER",
      emailVerified: false,
      tokenVersion: 0,
      createdAt: new Date().toISOString(),
    };
    const verificationToken = {
      id: "registration-token-1",
      userId: user.id,
      channel: "email",
      target: user.email,
      codeHash: tokenHash,
      expiresAt: Date.now() + 10_000,
      consumedAt: null,
      createdAt: new Date().toISOString(),
    };

    authRepository.findRegistrationVerificationTokenByHash
      .mockReturnValueOnce(verificationToken)
      .mockReturnValueOnce({
        ...verificationToken,
        consumedAt: new Date().toISOString(),
      });
    authRepository.findUserById
      .mockReturnValueOnce(user)
      .mockReturnValueOnce({
        ...user,
        emailVerified: true,
      });
    authRepository.markUserRegistrationVerified.mockResolvedValue({
      ...user,
      emailVerified: true,
    });

    const result = await service.verifyRegistration({ token: rawToken });

    expect(result.user.emailVerified).toBe(true);
    expect(authRepository.markRegistrationVerificationTokenConsumed).toHaveBeenCalledWith(
      tokenHash,
      expect.any(String)
    );
    expect(authRepository.deleteRegistrationVerificationTokensByUserId).not.toHaveBeenCalled();
    expect(authRepository.createSession).toHaveBeenCalledTimes(1);

    const repeatResult = await service.verifyRegistration({ token: rawToken });

    expect(repeatResult.user.emailVerified).toBe(true);
    expect(authRepository.markRegistrationVerificationTokenConsumed).toHaveBeenCalledTimes(1);
    expect(authRepository.markUserRegistrationVerified).toHaveBeenCalledTimes(1);
    expect(authRepository.createSession).toHaveBeenCalledTimes(2);
  });

  it("does not break registration verification when Brevo contact sync fails", async () => {
    const { authRepository, brevoService, config, service } = createAuthServiceFixture();
    const rawToken = "verify-brevo-token";
    const tokenHash = hashOneTimeToken(rawToken, config.jwtSecret);
    const user = {
      id: "user-verify-brevo",
      email: "verify-brevo@example.com",
      name: "Verify Brevo",
      avatar: undefined,
      age: 31,
      weight: 72,
      height: 178,
      gender: "male",
      activity: "moderate",
      goal: "maintain",
      role: "USER",
      emailVerified: false,
      tokenVersion: 0,
      createdAt: new Date().toISOString(),
    };

    authRepository.findRegistrationVerificationTokenByHash.mockReturnValue({
      id: "registration-token-brevo",
      userId: user.id,
      channel: "email",
      target: user.email,
      codeHash: tokenHash,
      expiresAt: Date.now() + 10_000,
      consumedAt: null,
      createdAt: new Date().toISOString(),
    });
    authRepository.findUserById.mockReturnValue(user);
    authRepository.markUserRegistrationVerified.mockResolvedValue({
      ...user,
      emailVerified: true,
    });
    brevoService.upsertContact.mockResolvedValue({
      ok: false,
      code: "BREVO_CONTACT_SYNC_FAILED",
    });

    const result = await service.verifyRegistration({ token: rawToken });

    expect(result.user.emailVerified).toBe(true);
    expect(result.token).toBeTruthy();
    expect(brevoService.upsertContact).toHaveBeenCalledWith({
      email: user.email,
      name: user.name,
    });
    expect(authRepository.createSession).toHaveBeenCalledTimes(1);
  });

  it("blocks login for users who have not verified email", async () => {
    const { authRepository, config, service } = createAuthServiceFixture();
    const password = "StrongPass123!";
    const passwordRecord = createPasswordRecord(password, config.passwordIterations);

    authRepository.getLoginAttempt.mockReturnValue(null);
    authRepository.findUserByEmail.mockReturnValue({
      id: "user-unverified",
      email: "unverified@example.com",
      name: "Unverified User",
      avatar: undefined,
      age: 31,
      weight: 72,
      height: 178,
      gender: "male",
      activity: "moderate",
      goal: "maintain",
      role: "USER",
      emailVerified: false,
      tokenVersion: 0,
      createdAt: new Date().toISOString(),
      ...passwordRecord,
    });

    await expect(
      service.login({ email: "unverified@example.com", password })
    ).rejects.toMatchObject({
      code: "REGISTRATION_NOT_VERIFIED",
    });
    expect(authRepository.createSession).not.toHaveBeenCalled();
  });

  it("rejects invalid registration profile fields server-side", () => {
    const { service } = createAuthServiceFixture();

    return expect(
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
    ).rejects.toThrow(/valid email|Name|Age|Weight|Height|Gender|Activity|Goal/);
  });

  it("rejects invalid profile updates server-side", async () => {
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

    await expect(
      service.updateUserProfile(
        {
          weight: 500,
        },
        currentUser
      )
    ).rejects.toThrow(/Weight/);
  });

  it("resets the password, revokes sessions, and bumps token version", async () => {
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

    const result = await service.resetPassword({
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

  it("rejects a password reset token after it has been consumed", async () => {
    const { authRepository, service } = createAuthServiceFixture();
    const user = {
      id: "user-reset-once",
      email: "reset-once@example.com",
      name: "Reset Once",
      role: "USER",
      passwordHash: "old",
      passwordSalt: "salt",
      passwordVersion: "pbkdf2-sha256",
      tokenVersion: 0,
    };
    const rawToken = "single-use-reset-token";
    const resetToken = {
      id: "pw-reset-once",
      userId: user.id,
      tokenHash: "hash",
      expiresAt: Date.now() + 10_000,
      consumedAt: null,
      createdAt: new Date().toISOString(),
    };

    authRepository.findPasswordResetTokenByHash
      .mockReturnValueOnce(resetToken)
      .mockReturnValueOnce({
        ...resetToken,
        consumedAt: new Date().toISOString(),
      });
    authRepository.findUserById.mockReturnValue(user);

    await service.resetPassword({
      token: rawToken,
      password: "StrongPass123!",
    });

    await expect(
      service.resetPassword({
        token: rawToken,
        password: "AnotherStrongPass123!",
      })
    ).rejects.toMatchObject({
      code: "INVALID_RESET_TOKEN",
    });
    expect(authRepository.updateUserPassword).toHaveBeenCalledTimes(1);
  });

  it("exports account data with snapshot and backup summaries", async () => {
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

    const result = await service.exportAccountData(currentUser);

    expect(result.user.email).toBe(currentUser.email);
    expect(result.snapshot).toEqual(snapshot);
    expect(result.backups).toEqual(backups);
  });
});
