import {
  AuthApiError,
  createId,
  createInitialMealState,
  createInitialProfileState,
  createPasswordRecord,
  createSessionToken,
  getBearerToken,
  normalizeEmail,
  sanitizeName,
  toPublicUser,
  verifySessionToken,
  verifyPassword,
} from "../lib/domain.mjs";

export const createAuthService = ({ authRepository, stateRepository, config }) => {
  const buildAuthResponse = (user, accessToken, refreshToken = undefined) => ({
    user: toPublicUser(user),
    token: accessToken,
    refreshToken,
    snapshot: stateRepository.getSnapshotByUserId(user.id, user),
  });

  const getUserById = (userId) => authRepository.findUserById(userId);

  const createAccessToken = (userId) =>
    createSessionToken({
      userId,
      expiresAt: Date.now() + config.accessTokenTtlMs,
      secret: config.jwtSecret,
      kind: "access",
    });

  const createRefreshSession = (userId) => {
    const expiresAt = Date.now() + config.refreshTokenTtlMs;
    const session = {
      token: createSessionToken({
        userId,
        expiresAt,
        secret: config.jwtSecret,
        kind: "refresh",
      }),
      userId,
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

    return { token, user, session: null };
  };

  const authenticateRequest = (request) => authenticateToken(getBearerToken(request));

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

  return {
    authenticateToken,
    authenticateRequest,

    cleanupExpiredSessions: () => {
      authRepository.cleanupExpiredSessions();
    },

    getHealthInfo: () => ({
      ok: true,
      mode: "remote-cloud",
      provider: "smart-nutrition-sqlite-api",
      auth: "access-refresh-tokens",
    }),

    register: (body) => {
      const email = normalizeEmail(body.email);

      if (!email || authRepository.findUserByEmail(email)) {
        throw new AuthApiError("EMAIL_IN_USE", "User already exists.");
      }

      const passwordRecord = createPasswordRecord(
        String(body.password || ""),
        config.passwordIterations
      );

      const user = {
        id: createId("user"),
        name: sanitizeName(body.name),
        email,
        avatar: body.avatar,
        age: Number(body.age || 0),
        weight: Number(body.weight || 0),
        height: Number(body.height || 0),
        gender: body.gender === "female" ? "female" : "male",
        activity: body.activity || "moderate",
        goal: body.goal || "maintain",
        measurements: body.measurements,
        createdAt: new Date().toISOString(),
        ...passwordRecord,
      };

      authRepository.insertUser(user);
      stateRepository.upsertSnapshot(user.id, {
        profile: createInitialProfileState(user),
        meal: createInitialMealState(),
        updatedAt: new Date().toISOString(),
      });

      const refreshSession = createRefreshSession(user.id);
      return buildAuthResponse(user, createAccessToken(user.id), refreshSession.token);
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
      const refreshSession = createRefreshSession(user.id);
      return buildAuthResponse(user, createAccessToken(user.id), refreshSession.token);
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

    refreshSession: (body) => {
      const refreshToken = String(body?.refreshToken || "");
      const auth = authenticateRefreshToken(refreshToken);

      if (!auth) {
        throw new AuthApiError("INVALID_CREDENTIALS", "Refresh session expired.");
      }

      authRepository.deleteSessionByToken(refreshToken);
      const nextRefreshSession = createRefreshSession(auth.user.id);

      return buildAuthResponse(
        auth.user,
        createAccessToken(auth.user.id),
        nextRefreshSession.token
      );
    },

    logout: (request, body = {}) => {
      const token = getBearerToken(request);
      const refreshToken = String(body?.refreshToken || "");

      if (refreshToken) {
        authRepository.deleteSessionByToken(refreshToken);
      }

      if (token && verifySessionToken(token, config.jwtSecret)?.kind === "legacy") {
        authRepository.deleteSessionByToken(token);
      }
    },

    logoutAll: (currentUser) => {
      authRepository.deleteSessionsByUserId(currentUser.id);
    },

    updateUserProfile: (requestBody, currentUser) => {
      const updatedUser = authRepository.updateUser({
        ...currentUser,
        name: sanitizeName(requestBody.name ?? currentUser.name),
        avatar: requestBody.avatar ?? currentUser.avatar,
        age: Number(requestBody.age ?? currentUser.age),
        weight: Number(requestBody.weight ?? currentUser.weight),
        height: Number(requestBody.height ?? currentUser.height),
        gender: requestBody.gender === "female" ? "female" : "male",
        activity: requestBody.activity ?? currentUser.activity,
        goal: requestBody.goal ?? currentUser.goal,
        measurements: requestBody.measurements ?? currentUser.measurements,
      });

      return toPublicUser(updatedUser);
    },

    deleteAccount: (currentUser) => {
      authRepository.deleteSessionsByUserId(currentUser.id);
      authRepository.deleteUser(currentUser.id);
      clearLoginAttempts(currentUser.email);
    },
  };
};
