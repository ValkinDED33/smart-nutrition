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
  isOwnerRole,
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
  brevoService = null,
  config,
  logger = console,
}) => {
  const getTokenVersion = (user) => Math.max(Number(user?.tokenVersion ?? 0) || 0, 0);
  const getRefreshTokenHash = (token) => hashOneTimeToken(token, config.jwtSecret);
  const passwordResetRequestMessage =
    "If an account with that email exists, a password reset link has been prepared.";
  const registrationVerificationMessage =
    "Registration confirmation link has been prepared.";
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
  const validLanguages = new Set(["uk", "pl", "en"]);

  const hasOwn = (value, key) =>
    Boolean(value) && Object.prototype.hasOwnProperty.call(value, key);

  const assertValidEmail = (email) => {
    if (!validEmailPattern.test(email)) {
      throw new AuthApiError("INVALID_PROFILE", "A valid email address is required.");
    }
  };

  const isRegistrationVerified = (user) =>
    user?.emailVerified !== false;

  const isUserBanned = (user) => Boolean(user?.bannedAt);

  const maskEmail = (email) => {
    const [name = "", domain = ""] = String(email ?? "").split("@");
    const visibleName = name.length <= 2 ? `${name[0] ?? "*"}*` : `${name.slice(0, 2)}***`;
    return `${visibleName}@${domain}`;
  };

  const readName = (value) => {
    const name = sanitizeName(value);

    if (name.length < 2 || name.length > 80) {
      throw new AuthApiError("INVALID_PROFILE", "Name must be between 2 and 80 characters.");
    }

    return name;
  };

  const normalizeNameForAvailability = (value) =>
    sanitizeName(value).toLowerCase();

  const findUserByName = async (name) => {
    const normalizedName = normalizeNameForAvailability(name);

    if (!normalizedName) {
      return null;
    }

    const users = (await authRepository.listUsers?.()) ?? [];

    return users.find((user) => normalizeNameForAvailability(user?.name) === normalizedName) ?? null;
  };

  const assertProfileNameAvailable = async (name, currentUserId) => {
    const existingNameUser = await findUserByName(name);

    if (existingNameUser && existingNameUser.id !== currentUserId) {
      throw new AuthApiError("NAME_IN_USE", "A user with this name already exists.");
    }
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
    const allowedAvatarPattern = /^(https?:\/\/|data:image\/(?:png|jpeg|jpg|webp)[;,])/i;

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
    languagePreference: readEnumValue(
      hasOwn(body, "languagePreference")
        ? body.languagePreference
        : fallback.languagePreference,
      validLanguages,
      "uk",
      "Language"
    ),
    measurements: readMeasurements(
      hasOwn(body, "measurements") ? body.measurements : fallback.measurements
    ),
  });

  const writeAuditLog = async ({
    actorUserId = null,
    actorRole = "USER",
    action,
    targetType = null,
    targetId = null,
    details = null,
  }) => {
    await authRepository.createAuditLog?.({
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

  const buildAuthResponse = async (user, accessToken, refreshToken = undefined) => ({
    user: toPublicUser(user),
    token: accessToken,
    refreshToken,
    snapshot: await stateRepository.getSnapshotByUserId(user.id, user),
  });
  const getUserById = (userId) => authRepository.findUserById(userId);

  const buildPasswordResetResponse = () => ({
    ok: true,
    message: passwordResetRequestMessage,
    delivery: "email",
  });

  const buildRegistrationVerificationResponse = ({
    email,
    expiresAt,
  }) => ({
    ok: true,
    requiresVerification: true,
    email,
    channel: "email",
    maskedTarget: maskEmail(email),
    delivery: "email",
    message: registrationVerificationMessage,
    expiresAt: new Date(expiresAt).toISOString(),
  });

  const syncVerifiedMarketingContact = async (user) => {
    try {
      const result = await brevoService?.upsertContact?.({
        email: user.email,
        name: user.name,
      });

      if (result && !result.ok) {
        logger.warn?.("[brevo] verified contact sync skipped", {
          provider: "brevo",
          userId: user.id,
          code: result.code ?? "BREVO_CONTACT_SYNC_FAILED",
        });
      }
    } catch (error) {
      logger.warn?.("[brevo] verified contact sync skipped", {
        provider: "brevo",
        userId: user.id,
        code: String(error?.code ?? error?.name ?? "BREVO_CONTACT_SYNC_ERROR").slice(0, 80),
        message: String(error?.message ?? "").replace(/\s+/g, " ").trim().slice(0, 160),
      });
    }
  };

  const createRegistrationVerification = async (user) => {
    await authRepository.deleteRegistrationVerificationTokensByUserId?.(user.id);

    const token = createOpaqueToken(32);
    const expiresAt =
      Date.now() + (config.registrationVerificationTokenTtlMs ?? 1000 * 60 * 15);
    const tokenHash = hashOneTimeToken(token, config.jwtSecret);
    const verificationUrl = `${config.appBaseUrl}/verify-email?token=${encodeURIComponent(token)}`;

    await authRepository.createRegistrationVerificationToken?.({
      id: createId("registration-token"),
      userId: user.id,
      channel: "email",
      target: user.email,
      codeHash: tokenHash,
      expiresAt,
      createdAt: new Date().toISOString(),
    });

    const emailResult = await emailService?.sendRegistrationVerificationEmail?.({
      to: user.email,
      name: user.name,
      verificationUrl,
      expiresAt,
    });

    if (!emailResult?.ok) {
      throw new AuthApiError(
        "VERIFICATION_DELIVERY_UNAVAILABLE",
        "Email verification could not be delivered."
      );
    }

    return buildRegistrationVerificationResponse({
      email: user.email,
      expiresAt,
    });
  };

  const createAccessToken = (user) =>
    createSessionToken({
      userId: user.id,
      expiresAt: Date.now() + config.accessTokenTtlMs,
      secret: config.jwtSecret,
      kind: "access",
      tokenVersion: getTokenVersion(user),
    });

  const createRefreshSession = async (user) => {
    const expiresAt = Date.now() + config.refreshTokenTtlMs;
    const token = createSessionToken({
      userId: user.id,
      expiresAt,
      secret: config.jwtSecret,
      kind: "refresh",
      tokenVersion: getTokenVersion(user),
    });
    const tokenHash = getRefreshTokenHash(token);
    const session = {
      token,
      tokenHash,
      userId: user.id,
      expiresAt,
    };

    await authRepository.createSession({
      token: tokenHash,
      userId: user.id,
      expiresAt,
    });
    return session;
  };

  const deleteRefreshTokenSession = async (token) => {
    if (!token) {
      return;
    }

    await authRepository.deleteSessionByToken(getRefreshTokenHash(token));
    await authRepository.deleteSessionByToken(token);
  };

  const authenticateRefreshToken = async (token) => {
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

    const tokenHash = getRefreshTokenHash(token);
    let session = await authRepository.findSessionByToken(tokenHash);

    if (!session) {
      session = await authRepository.findSessionByToken(token);
    }

    if (!session) {
      return null;
    }

    if (
      session.expiresAt <= Date.now() ||
      verifiedToken.expiresAt <= Date.now() ||
      verifiedToken.userId !== session.userId
    ) {
      await deleteRefreshTokenSession(token);
      return null;
    }

    const user = await authRepository.findUserById(session.userId);

    if (!user) {
      await deleteRefreshTokenSession(token);
      return null;
    }

    if (isUserBanned(user) || !isRegistrationVerified(user)) {
      await deleteRefreshTokenSession(token);
      return null;
    }

    if (verifiedToken.tokenVersion !== getTokenVersion(user)) {
      await deleteRefreshTokenSession(token);
      return null;
    }

    return { token, tokenHash, session, user };
  };

  const authenticateToken = async (token) => {
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

    const user = await getUserById(verifiedToken.userId);

    if (!user) {
      return null;
    }

    if (isUserBanned(user) || !isRegistrationVerified(user)) {
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

  const clearLoginAttempts = async (email) => {
    await authRepository.clearLoginAttempt(email);
  };

  const assertLoginAllowed = async (email) => {
    const attempt = await authRepository.getLoginAttempt(email);

    if (!attempt?.lockUntil) {
      return;
    }

    if (attempt.lockUntil > Date.now()) {
      throw new AuthApiError("TOO_MANY_ATTEMPTS", "Too many failed login attempts.");
    }

    await clearLoginAttempts(email);
  };

  const registerFailedAttempt = async (email) => {
    const current = (await authRepository.getLoginAttempt(email)) ?? { count: 0, lockUntil: null };
    const nextCount = current.count + 1;

    await authRepository.upsertLoginAttempt({
      email,
      count: nextCount,
      lockUntil:
        nextCount >= config.maxLoginAttempts ? Date.now() + config.loginLockMs : null,
    });
  };

  return {
    authenticateToken,
    authenticateRequest,

    cleanupExpiredSessions: async () => {
      await authRepository.cleanupExpiredSessions();
      await authRepository.cleanupExpiredPasswordResetTokens?.();
      await authRepository.cleanupExpiredRegistrationVerificationTokens?.();
    },

    getHealthInfo: () => ({
      ok: true,
      mode: "remote-cloud",
      provider:
        config.databaseProvider === "postgres"
          ? "smart-nutrition-postgres-api"
          : config.databaseProvider === "mongodb"
            ? "smart-nutrition-mongodb-api"
          : "smart-nutrition-sqlite-api",
      auth: "httpOnly-cookie-session",
    }),

    register: async (body) => {
      const email = normalizeEmail(body.email);

      assertValidEmail(email);
      assertPasswordPolicy(String(body.password || ""));
      const profileInput = readProfileInput(body);

      const existingUser = await authRepository.findUserByEmail(email);

      if (existingUser) {
        if (isRegistrationVerified(existingUser)) {
          throw new AuthApiError("EMAIL_IN_USE", "A user with this email already exists.");
        }

        if (isUserBanned(existingUser)) {
          throw new AuthApiError("ACCOUNT_BANNED", "This account is banned.");
        }

        return createRegistrationVerification(existingUser);
      }

      const existingNameUser = await findUserByName(profileInput.name);

      if (existingNameUser) {
        throw new AuthApiError("NAME_IN_USE", "A user with this name already exists.");
      }

      const hasExistingOwner =
        (await authRepository.hasUserWithRole?.("OWNER")) ||
        (await authRepository.hasUserWithRole?.("SUPER_ADMIN"));
      const shouldBootstrapOwner =
        Boolean(config.superAdminEmail) &&
        email === config.superAdminEmail &&
        !hasExistingOwner;
      const role = shouldBootstrapOwner ? "OWNER" : "USER";
      const passwordRecord = createPasswordRecord(
        String(body.password || ""),
        config.passwordIterations
      );

      const user = {
        id: createId("user"),
        ...profileInput,
        email,
        emailVerified: false,
        verificationChannel: "email",
        createdAt: new Date().toISOString(),
        role,
        bannedAt: null,
        bannedReason: null,
        twoFactorEnabled: false,
        twoFactorRequired: role === "ADMIN" || isOwnerRole(role),
        tokenVersion: 0,
        ...passwordRecord,
      };

      await authRepository.insertUser(user);
      await stateRepository.upsertSnapshot(user.id, {
        profile: createInitialProfileState(user),
        meal: createInitialMealState(),
        water: createInitialWaterState(),
        fridge: createInitialFridgeState(),
        community: createInitialCommunityState(user.languagePreference),
        updatedAt: new Date().toISOString(),
      });

      await writeAuditLog({
        actorUserId: user.id,
        actorRole: user.role,
        action: "auth.registered",
        targetType: "user",
        targetId: user.id,
        details: {
          email: user.email,
          role: user.role,
          verificationChannel: "email",
        },
      });
      try {
        return await createRegistrationVerification(user);
      } catch (error) {
        await authRepository.deleteUser?.(user.id);
        throw error;
      }
    },

    checkRegistrationAvailability: async (body = {}) => {
      const rawEmail = normalizeEmail(body.email);
      const rawName = sanitizeName(body.name);
      const response = {
        email: {
          checked: false,
          valid: false,
          available: false,
        },
        name: {
          checked: false,
          valid: false,
          available: false,
        },
      };

      if (rawEmail) {
        response.email.checked = true;
        response.email.valid = validEmailPattern.test(rawEmail);
        response.email.available =
          response.email.valid && !(await authRepository.findUserByEmail(rawEmail));
      }

      if (rawName) {
        response.name.checked = true;
        response.name.valid = rawName.length >= 2 && rawName.length <= 80;
        response.name.available =
          response.name.valid && !(await findUserByName(rawName));
      }

      return response;
    },

    verifyRegistration: async (body) => {
      const token = String(body?.token ?? "").trim();

      if (!token) {
        throw new AuthApiError(
          "INVALID_VERIFICATION_LINK",
          "Registration confirmation link is invalid or expired."
        );
      }

      const tokenHash = hashOneTimeToken(token, config.jwtSecret);
      const verificationToken =
        await authRepository.findRegistrationVerificationTokenByHash?.(tokenHash);

      if (
        !verificationToken ||
        verificationToken.channel !== "email" ||
        verificationToken.expiresAt <= Date.now()
      ) {
        throw new AuthApiError(
          "INVALID_VERIFICATION_LINK",
          "Registration confirmation link is invalid or expired."
        );
      }

      const user = await authRepository.findUserById(verificationToken.userId);

      if (!user) {
        throw new AuthApiError(
          "INVALID_VERIFICATION_LINK",
          "Registration confirmation link is invalid or expired."
        );
      }

      if (isUserBanned(user)) {
        throw new AuthApiError("ACCOUNT_BANNED", "This account is banned.");
      }

      if (verificationToken.consumedAt) {
        if (!isRegistrationVerified(user)) {
          throw new AuthApiError(
            "INVALID_VERIFICATION_LINK",
            "Registration confirmation link is invalid or expired."
          );
        }

        await clearLoginAttempts(user.email);
        const refreshSession = await createRefreshSession(user);

        return buildAuthResponse(
          user,
          createAccessToken(user),
          refreshSession.token
        );
      }

      const consumedAt = new Date().toISOString();
      await authRepository.markRegistrationVerificationTokenConsumed?.(tokenHash, consumedAt);
      const verifiedUser =
        (await authRepository.markUserRegistrationVerified?.({
          userId: user.id,
          channel: verificationToken.channel,
        })) ?? user;
      await clearLoginAttempts(user.email);

      const refreshSession = await createRefreshSession(verifiedUser);
      await writeAuditLog({
        actorUserId: verifiedUser.id,
        actorRole: verifiedUser.role,
        action: "auth.registration_verified",
        targetType: "user",
        targetId: verifiedUser.id,
        details: {
          channel: verificationToken.channel,
        },
      });
      await syncVerifiedMarketingContact(verifiedUser);

      return buildAuthResponse(
        verifiedUser,
        createAccessToken(verifiedUser),
        refreshSession.token
      );
    },

    resendRegistrationVerification: async (body) => {
      const email = normalizeEmail(body?.email);
      const user = await authRepository.findUserByEmail(email);

      if (!user || isRegistrationVerified(user)) {
        throw new AuthApiError(
          "INVALID_VERIFICATION_LINK",
          "Registration confirmation is not available for this account."
        );
      }

      if (isUserBanned(user)) {
        throw new AuthApiError("ACCOUNT_BANNED", "This account is banned.");
      }

      const updatedUser =
        (await authRepository.updateUserVerificationTarget?.({
          userId: user.id,
          channel: "email",
        })) ?? user;

      return createRegistrationVerification(updatedUser);
    },

    requestPasswordReset: async (body) => {
      const email = normalizeEmail(body?.email);

      if (!email) {
        return buildPasswordResetResponse();
      }

      const user = await authRepository.findUserByEmail(email);

      if (!user) {
        return buildPasswordResetResponse();
      }

      await authRepository.deletePasswordResetTokensByUserId?.(user.id);

      const rawToken = createOpaqueToken(32);
      const expiresAt = Date.now() + config.passwordResetTokenTtlMs;
      const resetUrl = `${config.appBaseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

      await authRepository.createPasswordResetToken?.({
        id: createId("pw-reset"),
        userId: user.id,
        tokenHash: hashOneTimeToken(rawToken, config.jwtSecret),
        expiresAt,
        createdAt: new Date().toISOString(),
      });

      await writeAuditLog({
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
        return buildPasswordResetResponse();
      }

      return buildPasswordResetResponse();
    },

    resetPassword: async (body) => {
      const token = String(body?.token || "").trim();
      const password = String(body?.password || "");

      if (!token) {
        throw new AuthApiError("INVALID_RESET_TOKEN", "Password reset token is invalid or expired.");
      }

      assertPasswordPolicy(password);

      const tokenHash = hashOneTimeToken(token, config.jwtSecret);
      const resetToken = await authRepository.findPasswordResetTokenByHash?.(tokenHash);

      if (
        !resetToken ||
        resetToken.consumedAt ||
        resetToken.expiresAt <= Date.now()
      ) {
        throw new AuthApiError("INVALID_RESET_TOKEN", "Password reset token is invalid or expired.");
      }

      const user = await authRepository.findUserById(resetToken.userId);

      if (!user) {
        throw new AuthApiError("INVALID_RESET_TOKEN", "Password reset token is invalid or expired.");
      }

      const consumedAt = new Date().toISOString();
      await authRepository.markPasswordResetTokenConsumed?.(tokenHash, consumedAt);

      const passwordRecord = createPasswordRecord(password, config.passwordIterations);

      await authRepository.updateUserPassword?.({
        userId: user.id,
        ...passwordRecord,
      });
      await authRepository.incrementUserTokenVersion?.(user.id);
      await authRepository.deleteSessionsByUserId(user.id);
      await authRepository.deletePasswordResetTokensByUserId?.(user.id);
      await clearLoginAttempts(user.email);

      await writeAuditLog({
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

    login: async (body) => {
      const email = normalizeEmail(body.email);
      const password = String(body.password || "");

      await assertLoginAllowed(email);

      const user = await authRepository.findUserByEmail(email);

      if (!user || !verifyPassword(user, password, config.passwordIterations)) {
        await registerFailedAttempt(email);
        throw new AuthApiError("INVALID_CREDENTIALS", "Invalid email or password.");
      }

      if (isUserBanned(user)) {
        throw new AuthApiError("ACCOUNT_BANNED", "This account is banned.");
      }

      if (!isRegistrationVerified(user)) {
        throw new AuthApiError(
          "REGISTRATION_NOT_VERIFIED",
          "Registration confirmation is required before login."
        );
      }

      await clearLoginAttempts(email);
      const refreshSession = await createRefreshSession(user);
      await writeAuditLog({
        actorUserId: user.id,
        actorRole: user.role,
        action: "auth.logged_in",
        targetType: "session",
        targetId: refreshSession.tokenHash,
      });
      return buildAuthResponse(user, createAccessToken(user), refreshSession.token);
    },

    restoreSession: async (request) => {
      const auth = await authenticateRequest(request);
      return auth
        ? buildAuthResponse(
            auth.user,
            auth.token,
            auth.session?.token
          )
        : null;
    },

    refreshSession: async (request, body) => {
      const refreshToken = getRefreshTokenFromRequest(request, body);
      const auth = await authenticateRefreshToken(refreshToken);

      if (!auth) {
        throw new AuthApiError("INVALID_REFRESH_TOKEN", "Refresh session expired.");
      }

      await deleteRefreshTokenSession(refreshToken);
      const nextRefreshSession = await createRefreshSession(auth.user);

      return buildAuthResponse(
        auth.user,
        createAccessToken(auth.user),
        nextRefreshSession.token
      );
    },

    logout: async (request, body = {}) => {
      const token = getAccessTokenFromRequest(request);
      const refreshToken = getRefreshTokenFromRequest(request, body);
      const auth = await authenticateRequest(request);

      if (refreshToken) {
        await deleteRefreshTokenSession(refreshToken);
      }

      if (token && verifySessionToken(token, config.jwtSecret)?.kind === "legacy") {
        await deleteRefreshTokenSession(token);
      }

      if (auth?.user) {
        await writeAuditLog({
          actorUserId: auth.user.id,
          actorRole: auth.user.role,
          action: "auth.logged_out",
          targetType: "user",
          targetId: auth.user.id,
        });
      }
    },

    logoutAll: async (currentUser) => {
      await authRepository.incrementUserTokenVersion?.(currentUser.id);
      await authRepository.deleteSessionsByUserId(currentUser.id);
      await writeAuditLog({
        actorUserId: currentUser.id,
        actorRole: currentUser.role,
        action: "auth.logged_out_all",
        targetType: "user",
        targetId: currentUser.id,
      });
    },

    updateUserProfile: async (requestBody, currentUser) => {
      const profileInput = readProfileInput(requestBody, currentUser);
      await assertProfileNameAvailable(profileInput.name, currentUser.id);
      const updatedUser = await authRepository.updateUser({
        ...currentUser,
        ...profileInput,
      });

      await writeAuditLog({
        actorUserId: currentUser.id,
        actorRole: currentUser.role,
        action: "auth.profile_updated",
        targetType: "user",
        targetId: currentUser.id,
      });
      return toPublicUser(updatedUser);
    },

    updateUserProfileAndState: async ({
      body,
      currentUser,
      saveProfileState,
      getProfileMeta,
    }) => {
      const profileInput = readProfileInput(body?.user ?? {}, currentUser);
      await assertProfileNameAvailable(profileInput.name, currentUser.id);

      if (typeof saveProfileState !== "function") {
        throw new AuthApiError("INVALID_PROFILE", "Cloud profile sync is unavailable.");
      }

      const savedProfile = await saveProfileState(body?.profile);
      const updatedUser = await authRepository.updateUser({
        ...currentUser,
        ...profileInput,
      });

      await writeAuditLog({
        actorUserId: currentUser.id,
        actorRole: currentUser.role,
        action: "auth.profile_and_state_updated",
        targetType: "user",
        targetId: currentUser.id,
      });

      return {
        ok: true,
        user: toPublicUser(updatedUser),
        profile: savedProfile,
        meta:
          typeof getProfileMeta === "function"
            ? await getProfileMeta()
            : null,
      };
    },

    deleteAccount: async (currentUser) => {
      if (isOwnerRole(currentUser.role)) {
        throw new AuthApiError("FORBIDDEN", "The owner account cannot be deleted.");
      }

      await writeAuditLog({
        actorUserId: currentUser.id,
        actorRole: currentUser.role,
        action: "auth.account_deleted",
        targetType: "user",
        targetId: currentUser.id,
      });
      await authRepository.deleteSessionsByUserId(currentUser.id);
      await authRepository.deleteUser(currentUser.id);
      await clearLoginAttempts(currentUser.email);
    },

    exportAccountData: async (currentUser) => ({
      exportedAt: new Date().toISOString(),
      mode: "remote-cloud",
      user: toPublicUser(currentUser),
      snapshot: await stateRepository.getSnapshotByUserId(currentUser.id, currentUser),
      backups: (await authRepository.listUserBackups?.(currentUser.id)) ?? [],
    }),

    listAccountBackups: async (currentUser) =>
      (await authRepository.listUserBackups?.(currentUser.id)) ?? [],

    readAccountBackup: async (currentUser, backupId = undefined) => {
      const backup = (await authRepository.readUserBackup?.(currentUser.id, backupId)) ?? null;

      if (!backup) {
        throw new AuthApiError("BACKUP_NOT_FOUND", "Backup not found.");
      }

      return backup;
    },
  };
};
