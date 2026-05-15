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
  smsService = null,
  config,
}) => {
  const getTokenVersion = (user) => Math.max(Number(user?.tokenVersion ?? 0) || 0, 0);
  const getRefreshTokenHash = (token) => hashOneTimeToken(token, config.jwtSecret);
  const passwordResetRequestMessage =
    "If an account with that email exists, a password reset link has been prepared.";
  const registrationVerificationMessage =
    "Registration confirmation code has been prepared.";
  const validEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validPhonePattern = /^[+\d][\d\s().-]{6,24}$/;
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

  const normalizeVerificationChannel = (value) => (value === "sms" ? "sms" : "email");

  const readPhone = (value) =>
    String(value ?? "")
      .trim()
      .replace(/\s+/g, " ");

  const assertValidPhone = (phone) => {
    if (!validPhonePattern.test(phone)) {
      throw new AuthApiError(
        "INVALID_PROFILE",
        "A valid phone number is required for SMS verification."
      );
    }
  };

  const assertSmsDeliveryAvailable = () => {
    if (config.isProduction && !smsService?.isConfigured?.()) {
      throw new AuthApiError(
        "VERIFICATION_DELIVERY_UNAVAILABLE",
        "SMS verification is unavailable until MANGO OFFICE credentials are configured."
      );
    }
  };

  const isRegistrationVerified = (user) =>
    user?.emailVerified !== false || Boolean(user?.phoneVerified);

  const isUserBanned = (user) => Boolean(user?.bannedAt);

  const createVerificationCode = () =>
    String(Math.floor(100000 + Math.random() * 900000));

  const maskEmail = (email) => {
    const [name = "", domain = ""] = String(email ?? "").split("@");
    const visibleName = name.length <= 2 ? `${name[0] ?? "*"}*` : `${name.slice(0, 2)}***`;
    return `${visibleName}@${domain}`;
  };

  const maskPhone = (phone) => {
    const compact = String(phone ?? "").replace(/\s+/g, "");
    return compact.length <= 4 ? "****" : `${compact.slice(0, 2)}***${compact.slice(-2)}`;
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

  const buildRegistrationVerificationResponse = ({
    email,
    channel,
    target,
    delivery,
    previewCode = undefined,
    expiresAt,
  }) => ({
    ok: true,
    requiresVerification: true,
    email,
    channel,
    maskedTarget: channel === "sms" ? maskPhone(target) : maskEmail(email),
    delivery,
    message: registrationVerificationMessage,
    previewCode,
    expiresAt: new Date(expiresAt).toISOString(),
  });

  const createRegistrationVerification = async (user, channel, target) => {
    await authRepository.deleteRegistrationVerificationTokensByUserId?.(user.id);

    const code = createVerificationCode();
    const expiresAt =
      Date.now() + (config.registrationVerificationTokenTtlMs ?? 1000 * 60 * 15);
    const codeHash = hashOneTimeToken(`${user.email}:${code}`, config.jwtSecret);

    await authRepository.createRegistrationVerificationToken?.({
      id: createId("registration-code"),
      userId: user.id,
      channel,
      target,
      codeHash,
      expiresAt,
      createdAt: new Date().toISOString(),
    });

    const emailResult =
      channel === "email"
        ? await emailService?.sendRegistrationVerificationEmail?.({
            to: user.email,
            name: user.name,
            code,
            expiresAt,
          })
        : null;
    const smsResult =
      channel === "sms"
        ? await smsService?.sendRegistrationVerificationSms?.({
            to: target,
            name: user.name,
            code,
            expiresAt,
          })
        : null;

    if (channel === "sms" && config.isProduction && !smsResult?.ok) {
      throw new AuthApiError(
        "VERIFICATION_DELIVERY_UNAVAILABLE",
        "SMS verification could not be delivered through MANGO OFFICE."
      );
    }

    const delivery =
      channel === "email" && emailResult?.ok
        ? "email"
        : channel === "sms" && (smsResult?.ok || config.isProduction)
          ? "sms"
          : "preview";

    return buildRegistrationVerificationResponse({
      email: user.email,
      channel,
      target,
      delivery,
      previewCode: delivery === "preview" ? code : undefined,
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

  if (config.superAdminEmail) {
    void authRepository.promoteUserByEmailToSuperAdmin?.(config.superAdminEmail);
  }

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
          : "smart-nutrition-sqlite-api",
      auth: "httpOnly-cookie-session",
    }),

    register: async (body) => {
      const email = normalizeEmail(body.email);
      const verificationChannel = normalizeVerificationChannel(body.verificationChannel);
      const phone = verificationChannel === "sms" ? readPhone(body.phone) : null;

      assertValidEmail(email);

      if (verificationChannel === "sms") {
        assertValidPhone(phone);
        assertSmsDeliveryAvailable();
      }

      if (await authRepository.findUserByEmail(email)) {
        throw new AuthApiError("EMAIL_IN_USE", "User already exists.");
      }

      assertPasswordPolicy(String(body.password || ""));
      const profileInput = readProfileInput(body);

      const shouldBootstrapSuperAdmin =
        Boolean(config.superAdminEmail) &&
        email === config.superAdminEmail &&
        !(await authRepository.hasUserWithRole?.("SUPER_ADMIN"));
      const role = shouldBootstrapSuperAdmin ? "SUPER_ADMIN" : "USER";
      const passwordRecord = createPasswordRecord(
        String(body.password || ""),
        config.passwordIterations
      );

      const user = {
        id: createId("user"),
        ...profileInput,
        email,
        emailVerified: false,
        phone,
        phoneVerified: false,
        verificationChannel,
        createdAt: new Date().toISOString(),
        role,
        bannedAt: null,
        bannedReason: null,
        twoFactorEnabled: false,
        twoFactorRequired: role === "ADMIN" || role === "SUPER_ADMIN",
        tokenVersion: 0,
        ...passwordRecord,
      };

      await authRepository.insertUser(user);
      await stateRepository.upsertSnapshot(user.id, {
        profile: createInitialProfileState(user),
        meal: createInitialMealState(),
        water: createInitialWaterState(),
        fridge: createInitialFridgeState(),
        community: createInitialCommunityState(),
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
          verificationChannel,
        },
      });
      try {
        return await createRegistrationVerification(
          user,
          verificationChannel,
          verificationChannel === "sms" ? phone : email
        );
      } catch (error) {
        await authRepository.deleteUser?.(user.id);
        throw error;
      }
    },

    verifyRegistration: async (body) => {
      const email = normalizeEmail(body?.email);
      const code = String(body?.code ?? "").trim();

      if (!email || !code) {
        throw new AuthApiError(
          "INVALID_VERIFICATION_CODE",
          "Registration confirmation code is invalid or expired."
        );
      }

      const user = await authRepository.findUserByEmail(email);

      if (!user) {
        throw new AuthApiError(
          "INVALID_VERIFICATION_CODE",
          "Registration confirmation code is invalid or expired."
        );
      }

      if (isUserBanned(user)) {
        throw new AuthApiError("ACCOUNT_BANNED", "This account is banned.");
      }

      const codeHash = hashOneTimeToken(`${email}:${code}`, config.jwtSecret);
      const verificationToken =
        await authRepository.findRegistrationVerificationTokenByHash?.(codeHash);

      if (
        !verificationToken ||
        verificationToken.userId !== user.id ||
        verificationToken.consumedAt ||
        verificationToken.expiresAt <= Date.now()
      ) {
        throw new AuthApiError(
          "INVALID_VERIFICATION_CODE",
          "Registration confirmation code is invalid or expired."
        );
      }

      const consumedAt = new Date().toISOString();
      await authRepository.markRegistrationVerificationTokenConsumed?.(codeHash, consumedAt);
      const verifiedUser =
        (await authRepository.markUserRegistrationVerified?.({
          userId: user.id,
          channel: verificationToken.channel,
        })) ?? user;
      await authRepository.deleteRegistrationVerificationTokensByUserId?.(user.id);
      await clearLoginAttempts(email);

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
          "INVALID_VERIFICATION_CODE",
          "Registration confirmation is not available for this account."
        );
      }

      if (isUserBanned(user)) {
        throw new AuthApiError("ACCOUNT_BANNED", "This account is banned.");
      }

      const verificationChannel = normalizeVerificationChannel(
        body?.channel ?? user.verificationChannel
      );
      const phone = verificationChannel === "sms" ? readPhone(body?.phone ?? user.phone) : null;

      if (verificationChannel === "sms") {
        assertValidPhone(phone);
        assertSmsDeliveryAvailable();
      }

      const updatedUser =
        (await authRepository.updateUserVerificationTarget?.({
          userId: user.id,
          channel: verificationChannel,
          phone,
        })) ?? user;

      return createRegistrationVerification(
        updatedUser,
        verificationChannel,
        verificationChannel === "sms" ? phone : updatedUser.email
      );
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
        throw new AuthApiError("INVALID_CREDENTIALS", "Refresh session expired.");
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

    deleteAccount: async (currentUser) => {
      if (currentUser.role === "SUPER_ADMIN") {
        throw new AuthApiError("FORBIDDEN", "The super admin account cannot be deleted.");
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
