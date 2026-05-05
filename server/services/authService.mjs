import {
  assertPasswordPolicy,
  AuthApiError,
  createId,
  createInitialCommunityState,
  createInitialFridgeState,
  createInitialMealState,
  createOpaqueToken,
  createInitialProfileState,
  createInitialWaterState,
  createPasswordRecord,
  createSessionToken,
  getBearerToken,
  readCookieValue,
  hashOneTimeToken,
  normalizeEmail,
  sanitizeName,
  toPublicUser,
  verifySessionToken,
  verifyPassword,
} from "../lib/domain.mjs";

export const createAuthService = ({
  authRepository,
  stateRepository,
  emailService,
  config,
}) => {
  const getTokenVersion = (user) => Math.max(Number(user?.tokenVersion ?? 0) || 0, 0);
  const passwordResetRequestMessage =
    "If an account with that email exists, a password reset link has been prepared.";
  const validEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validActivityLevels = new Set([
    "sedentary",
    "light",
    "moderate",
    "active",
    "very_active",
  ]);
  const validGoals = new Set(["cut", "maintain", "bulk"]);
  const validGenders = new Set(["male", "female"]);

  const hasOwn = (value, key) =>
    Boolean(value) && Object.prototype.hasOwnProperty.call(value, key);

  const assertValidEmail = (email) => {
    if (!validEmailPattern.test(email)) {
      throw new AuthApiError("INVALID_PROFILE", "A valid email address is required.");
    }
  };

  const readName = (value) => {
    const name = sanitizeName(value);

    if (name.length < 2 || name.length > 80) {
      throw new AuthApiError("INVALID_PROFILE", "Name must be between 2 and 80 characters.");
    }

    return name;
  };

  const readBoundedNumber = (value, fieldName, { min, max }) => {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue) || numberValue < min || numberValue > max) {
      throw new AuthApiError(
        "INVALID_PROFILE",
        `${fieldName} must be a number between ${min} and ${max}.`
      );
    }

    return numberValue;
  };

  const readEnumValue = (value, allowedValues, fallback, fieldName) => {
    const nextValue = String(value ?? fallback);

    if (!allowedValues.has(nextValue)) {
      throw new AuthApiError("INVALID_PROFILE", `${fieldName} is not supported.`);
    }

    return nextValue;
  };

  const readAvatar = (value) => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    const avatar = String(value).trim();
    const allowedAvatarPattern = /^(https?:\/\/|data:image\/(?:png|jpeg|jpg|webp|svg\+xml)[;,])/i;

    if (avatar.length > 512 * 1024 || !allowedAvatarPattern.test(avatar)) {
      throw new AuthApiError("INVALID_PROFILE", "Avatar must be a safe image URL.");
    }

    return avatar;
  };

  const readMeasurements = (value) => {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value !== "object" || Array.isArray(value)) {
      throw new AuthApiError("INVALID_PROFILE", "Measurements must be an object.");
    }

    const nextMeasurements = {};

    [
      ["waist", 30, 250],
      ["abdomen", 30, 280],
      ["hip", 30, 280],
      ["chest", 30, 280],
    ].forEach(([field, min, max]) => {
      if (!hasOwn(value, field) || value[field] === undefined || value[field] === null || value[field] === "") {
        return;
      }

      nextMeasurements[field] = readBoundedNumber(value[field], field, { min, max });
    });

    return Object.keys(nextMeasurements).length > 0 ? nextMeasurements : undefined;
  };

  const readProfileInput = (body, fallback = {}) => ({
    name: readName(hasOwn(body, "name") ? body.name : fallback.name),
    avatar: readAvatar(hasOwn(body, "avatar") ? body.avatar : fallback.avatar),
    age: readBoundedNumber(
      hasOwn(body, "age") ? body.age : fallback.age,
      "Age",
      { min: 10, max: 120 }
    ),
    weight: readBoundedNumber(
      hasOwn(body, "weight") ? body.weight : fallback.weight,
      "Weight",
      { min: 30, max: 300 }
    ),
    height: readBoundedNumber(
      hasOwn(body, "height") ? body.height : fallback.height,
      "Height",
      { min: 120, max: 250 }
    ),
    gender: readEnumValue(
      hasOwn(body, "gender") ? body.gender : fallback.gender,
      validGenders,
      "male",
      "Gender"
    ),
    activity: readEnumValue(
      hasOwn(body, "activity") ? body.activity : fallback.activity,
      validActivityLevels,
      "moderate",
      "Activity level"
    ),
    goal: readEnumValue(
      hasOwn(body, "goal") ? body.goal : fallback.goal,
      validGoals,
      "maintain",
      "Goal"
    ),
    measurements: readMeasurements(
      hasOwn(body, "measurements") ? body.measurements : fallback.measurements
    ),
  });

  const writeAuditLog = ({
    actorUserId = null,
    actorRole = "USER",
    action,
    targetType = null,
    targetId = null,
    details = null,
  }) => {
    authRepository.createAuditLog?.({
      id: createId("audit"),
      actorUserId,
      actorRole,
      action,
      targetType,
      targetId,
      details,
      createdAt: new Date().toISOString(),
    });
  };

  const buildAuthResponse = (user, accessToken, refreshToken = undefined) => ({
    user: toPublicUser(user),
    token: accessToken,
    refreshToken,
    snapshot: stateRepository.getSnapshotByUserId(user.id, user),
  });
  const getDefaultPasswordResetDelivery = () =>
    config.isProduction || emailService?.isConfigured?.() ? "email" : "preview";

  const getUserById = (userId) => authRepository.findUserById(userId);

  const buildPasswordResetResponse = ({
    delivery = getDefaultPasswordResetDelivery(),
    previewToken = undefined,
    expiresAt = undefined,
  } = {}) => ({
    ok: true,
    message: passwordResetRequestMessage,
    delivery,
    previewToken,
    expiresAt,
  });

  const createAccessToken = (user) =>
    createSessionToken({
      userId: user.id,
      expiresAt: Date.now() + config.accessTokenTtlMs,
      secret: config.jwtSecret,
      kind: "access",
      tokenVersion: getTokenVersion(user),
    });

  const createRefreshSession = (user) => {
    const expiresAt = Date.now() + config.refreshTokenTtlMs;
    const session = {
      token: createSessionToken({
        userId: user.id,
        expiresAt,
        secret: config.jwtSecret,
        kind: "refresh",
        tokenVersion: getTokenVersion(user),
      }),
      userId: user.id,
      expiresAt,
    };

    authRepository.createSession(session);
    return session;
  };

  const authenticateRefreshToken = (token) => {
    if (!token) {
      return null;
    }

    const verifiedToken = verifySessionToken(token, config.jwtSecret);

    if (!verifiedToken) {
      return null;
    }

    if (verifiedToken.kind === "access") {
      return null;
    }

    const session = authRepository.findSessionByToken(token);

    if (!session) {
      return null;
    }

    if (
      session.expiresAt <= Date.now() ||
      verifiedToken.expiresAt <= Date.now() ||
      verifiedToken.userId !== session.userId
    ) {
      authRepository.deleteSessionByToken(token);
      return null;
    }

    const user = authRepository.findUserById(session.userId);

    if (!user) {
      authRepository.deleteSessionByToken(token);
      return null;
    }

    if (verifiedToken.tokenVersion !== getTokenVersion(user)) {
      authRepository.deleteSessionByToken(token);
      return null;
    }

    return { token, session, user };
  };

  const authenticateToken = (token) => {
    if (!token) {
      return null;
    }

    const verifiedToken = verifySessionToken(token, config.jwtSecret);

    if (!verifiedToken) {
      return null;
    }

    if (verifiedToken.kind === "refresh") {
      return null;
    }

    if (verifiedToken.kind === "legacy") {
      return authenticateRefreshToken(token);
    }

    if (verifiedToken.expiresAt <= Date.now()) {
      return null;
    }

    const user = getUserById(verifiedToken.userId);

    if (!user) {
      return null;
    }

    if (verifiedToken.tokenVersion !== getTokenVersion(user)) {
      return null;
    }

    return { token, user, session: null };
  };

  const getAccessTokenFromRequest = (request) =>
    getBearerToken(request) ?? readCookieValue(request, config.authAccessCookieName);

  const getRefreshTokenFromRequest = (request, body = undefined) =>
    String(
      body?.refreshToken ??
        readCookieValue(request, config.authRefreshCookieName) ??
        ""
    );

  const authenticateRequest = (request) => authenticateToken(getAccessTokenFromRequest(request));

  const clearLoginAttempts = (email) => {
    authRepository.clearLoginAttempt(email);
  };

  const assertLoginAllowed = (email) => {
    const attempt = authRepository.getLoginAttempt(email);

    if (!attempt?.lockUntil) {
      return;
    }

    if (attempt.lockUntil > Date.now()) {
      throw new AuthApiError("TOO_MANY_ATTEMPTS", "Too many failed login attempts.");
    }

    clearLoginAttempts(email);
  };

  const registerFailedAttempt = (email) => {
    const current = authRepository.getLoginAttempt(email) ?? { count: 0, lockUntil: null };
    const nextCount = current.count + 1;

    authRepository.upsertLoginAttempt({
      email,
      count: nextCount,
      lockUntil:
        nextCount >= config.maxLoginAttempts ? Date.now() + config.loginLockMs : null,
    });
  };

  if (config.superAdminEmail) {
    authRepository.promoteUserByEmailToSuperAdmin?.(config.superAdminEmail);
  }

  return {
    authenticateToken,
    authenticateRequest,

    cleanupExpiredSessions: () => {
      authRepository.cleanupExpiredSessions();
      authRepository.cleanupExpiredPasswordResetTokens?.();
    },

    getHealthInfo: () => ({
      ok: true,
      mode: "remote-cloud",
      provider: "smart-nutrition-sqlite-api",
      auth: "httpOnly-cookie-session",
    }),

    register: (body) => {
      const email = normalizeEmail(body.email);

      assertValidEmail(email);

      if (authRepository.findUserByEmail(email)) {
        throw new AuthApiError("EMAIL_IN_USE", "User already exists.");
      }

      assertPasswordPolicy(String(body.password || ""));
      const profileInput = readProfileInput(body);

      const shouldBootstrapSuperAdmin =
        Boolean(config.superAdminEmail) &&
        email === config.superAdminEmail &&
        !authRepository.hasUserWithRole?.("SUPER_ADMIN");
      const role = shouldBootstrapSuperAdmin ? "SUPER_ADMIN" : "USER";
      const passwordRecord = createPasswordRecord(
        String(body.password || ""),
        config.passwordIterations
      );

      const user = {
        id: createId("user"),
        ...profileInput,
        email,
        createdAt: new Date().toISOString(),
        role,
        twoFactorEnabled: false,
        twoFactorRequired: role === "ADMIN" || role === "SUPER_ADMIN",
        tokenVersion: 0,
        ...passwordRecord,
      };

      authRepository.insertUser(user);
      stateRepository.upsertSnapshot(user.id, {
        profile: createInitialProfileState(user),
        meal: createInitialMealState(),
        water: createInitialWaterState(),
        fridge: createInitialFridgeState(),
        community: createInitialCommunityState(),
        updatedAt: new Date().toISOString(),
      });

      const refreshSession = createRefreshSession(user);
      writeAuditLog({
        actorUserId: user.id,
        actorRole: user.role,
        action: "auth.registered",
        targetType: "user",
        targetId: user.id,
        details: {
          email: user.email,
          role: user.role,
        },
      });
      return buildAuthResponse(user, createAccessToken(user), refreshSession.token);
    },

    requestPasswordReset: async (body) => {
      const email = normalizeEmail(body?.email);

      if (!email) {
        return buildPasswordResetResponse();
      }

      const user = authRepository.findUserByEmail(email);

      if (!user) {
        return buildPasswordResetResponse();
      }

      authRepository.deletePasswordResetTokensByUserId?.(user.id);

      const rawToken = createOpaqueToken(32);
      const expiresAt = Date.now() + config.passwordResetTokenTtlMs;
      const resetUrl = `${config.appBaseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

      authRepository.createPasswordResetToken?.({
        id: createId("pw-reset"),
        userId: user.id,
        tokenHash: hashOneTimeToken(rawToken, config.jwtSecret),
        expiresAt,
        createdAt: new Date().toISOString(),
      });

      writeAuditLog({
        actorUserId: user.id,
        actorRole: user.role,
        action: "auth.password_reset_requested",
        targetType: "user",
        targetId: user.id,
      });

      const emailResult = await emailService?.sendPasswordResetEmail?.({
        to: user.email,
        name: user.name,
        resetUrl,
        expiresAt,
      });

      if (emailResult?.ok) {
        return buildPasswordResetResponse({
          delivery: "email",
        });
      }

      if (config.isProduction) {
        return buildPasswordResetResponse({
          delivery: "email",
        });
      }

      return buildPasswordResetResponse({
        delivery: "preview",
        previewToken: rawToken,
        expiresAt: new Date(expiresAt).toISOString(),
      });
    },

    resetPassword: (body) => {
      const token = String(body?.token || "").trim();
      const password = String(body?.password || "");

      if (!token) {
        throw new AuthApiError("INVALID_RESET_TOKEN", "Password reset token is invalid or expired.");
      }

      assertPasswordPolicy(password);

      const tokenHash = hashOneTimeToken(token, config.jwtSecret);
      const resetToken = authRepository.findPasswordResetTokenByHash?.(tokenHash);

      if (
        !resetToken ||
        resetToken.consumedAt ||
        resetToken.expiresAt <= Date.now()
      ) {
        throw new AuthApiError("INVALID_RESET_TOKEN", "Password reset token is invalid or expired.");
      }

      const user = authRepository.findUserById(resetToken.userId);

      if (!user) {
        throw new AuthApiError("INVALID_RESET_TOKEN", "Password reset token is invalid or expired.");
      }

      const consumedAt = new Date().toISOString();
      authRepository.markPasswordResetTokenConsumed?.(tokenHash, consumedAt);

      const passwordRecord = createPasswordRecord(password, config.passwordIterations);

      authRepository.updateUserPassword?.({
        userId: user.id,
        ...passwordRecord,
      });
      authRepository.incrementUserTokenVersion?.(user.id);
      authRepository.deleteSessionsByUserId(user.id);
      authRepository.deletePasswordResetTokensByUserId?.(user.id);
      clearLoginAttempts(user.email);

      writeAuditLog({
        actorUserId: user.id,
        actorRole: user.role,
        action: "auth.password_reset_completed",
        targetType: "user",
        targetId: user.id,
      });

      return {
        ok: true,
        message: "Password has been updated. You can log in with the new password.",
      };
    },

    login: (body) => {
      const email = normalizeEmail(body.email);
      const password = String(body.password || "");

      assertLoginAllowed(email);

      const user = authRepository.findUserByEmail(email);

      if (!user || !verifyPassword(user, password, config.passwordIterations)) {
        registerFailedAttempt(email);
        throw new AuthApiError("INVALID_CREDENTIALS", "Invalid email or password.");
      }

      clearLoginAttempts(email);
      const refreshSession = createRefreshSession(user);
      writeAuditLog({
        actorUserId: user.id,
        actorRole: user.role,
        action: "auth.logged_in",
        targetType: "session",
        targetId: refreshSession.token,
      });
      return buildAuthResponse(user, createAccessToken(user), refreshSession.token);
    },

    restoreSession: (request) => {
      const auth = authenticateRequest(request);
      return auth
        ? buildAuthResponse(
            auth.user,
            auth.token,
            auth.session?.token
          )
        : null;
    },

    refreshSession: (request, body) => {
      const refreshToken = getRefreshTokenFromRequest(request, body);
      const auth = authenticateRefreshToken(refreshToken);

      if (!auth) {
        throw new AuthApiError("INVALID_CREDENTIALS", "Refresh session expired.");
      }

      authRepository.deleteSessionByToken(refreshToken);
      const nextRefreshSession = createRefreshSession(auth.user);

      return buildAuthResponse(
        auth.user,
        createAccessToken(auth.user),
        nextRefreshSession.token
      );
    },

    logout: (request, body = {}) => {
      const token = getAccessTokenFromRequest(request);
      const refreshToken = getRefreshTokenFromRequest(request, body);
      const auth = authenticateRequest(request);

      if (refreshToken) {
        authRepository.deleteSessionByToken(refreshToken);
      }

      if (token && verifySessionToken(token, config.jwtSecret)?.kind === "legacy") {
        authRepository.deleteSessionByToken(token);
      }

      if (auth?.user) {
        writeAuditLog({
          actorUserId: auth.user.id,
          actorRole: auth.user.role,
          action: "auth.logged_out",
          targetType: "user",
          targetId: auth.user.id,
        });
      }
    },

    logoutAll: (currentUser) => {
      authRepository.incrementUserTokenVersion?.(currentUser.id);
      authRepository.deleteSessionsByUserId(currentUser.id);
      writeAuditLog({
        actorUserId: currentUser.id,
        actorRole: currentUser.role,
        action: "auth.logged_out_all",
        targetType: "user",
        targetId: currentUser.id,
      });
    },

    updateUserProfile: (requestBody, currentUser) => {
      const profileInput = readProfileInput(requestBody, currentUser);
      const updatedUser = authRepository.updateUser({
        ...currentUser,
        ...profileInput,
      });

      writeAuditLog({
        actorUserId: currentUser.id,
        actorRole: currentUser.role,
        action: "auth.profile_updated",
        targetType: "user",
        targetId: currentUser.id,
      });
      return toPublicUser(updatedUser);
    },

    deleteAccount: (currentUser) => {
      if (currentUser.role === "SUPER_ADMIN") {
        throw new AuthApiError("FORBIDDEN", "The super admin account cannot be deleted.");
      }

      writeAuditLog({
        actorUserId: currentUser.id,
        actorRole: currentUser.role,
        action: "auth.account_deleted",
        targetType: "user",
        targetId: currentUser.id,
      });
      authRepository.deleteSessionsByUserId(currentUser.id);
      authRepository.deleteUser(currentUser.id);
      clearLoginAttempts(currentUser.email);
    },

    exportAccountData: (currentUser) => ({
      exportedAt: new Date().toISOString(),
      mode: "remote-cloud",
      user: toPublicUser(currentUser),
      snapshot: stateRepository.getSnapshotByUserId(currentUser.id, currentUser),
      backups: authRepository.listUserBackups?.(currentUser.id) ?? [],
    }),

    listAccountBackups: (currentUser) =>
      authRepository.listUserBackups?.(currentUser.id) ?? [],

    readAccountBackup: (currentUser, backupId = undefined) => {
      const backup = authRepository.readUserBackup?.(currentUser.id, backupId) ?? null;

      if (!backup) {
        throw new AuthApiError("BACKUP_NOT_FOUND", "Backup not found.");
      }

      return backup;
    },
  };
};
