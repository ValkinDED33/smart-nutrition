import { readJsonBody, sendError, sendJson, sendNoContent } from "../lib/http.mjs";

const PUBLIC_AUTH_ROUTES = [
  ["POST", "/api/auth/register", "register"],
  ["POST", "/api/auth/verify-registration", "verifyRegistration"],
  ["POST", "/api/auth/resend-verification", "resendVerification"],
  ["POST", "/api/auth/availability", "checkRegistrationAvailability"],
  ["POST", "/api/auth/login", "login"],
  ["POST", "/api/auth/forgot-password", "forgotPassword"],
  ["POST", "/api/auth/reset-password", "resetPassword"],
  ["GET", "/api/auth/session", "getSession"],
  ["GET", "/api/auth/me", "getCurrentUser"],
  ["POST", "/api/auth/refresh", "refreshSession"],
  ["POST", "/api/auth/logout", "logout"],
];

const PROTECTED_AUTH_ROUTES = [
  ["PATCH", "/api/auth/profile", "updateProfile"],
  ["PATCH", "/api/auth/profile-state", "updateProfileAndState"],
  ["POST", "/api/auth/logout-all", "logoutAll"],
];

const toRoute = (authController) => ([method, pathname, handlerName]) => ({
  method,
  pathname,
  handler: authController[handlerName],
});

export const createAuthRoutes = ({ authController, authRouteScope = "all" } = {}) => {
  if (!authController) {
    return [];
  }

  const mapRoute = toRoute(authController);

  if (authRouteScope === "public") {
    return PUBLIC_AUTH_ROUTES.map(mapRoute);
  }

  if (authRouteScope === "protected") {
    return PROTECTED_AUTH_ROUTES.map(mapRoute);
  }

  return [...PUBLIC_AUTH_ROUTES, ...PROTECTED_AUTH_ROUTES].map(mapRoute);
};

export const createAuthController = ({
  authService,
  stateService = null,
  bodyLimitBytes,
  getSyncContext = () => undefined,
  sendAuthSession,
  clearAuthCookies,
}) => ({
  register: async ({ request, response }) => {
    const body = await readJsonBody(request, bodyLimitBytes);
    sendJson(response, 201, await authService.register(body));
  },

  verifyRegistration: async ({ request, response }) => {
    const body = await readJsonBody(request, bodyLimitBytes);
    sendAuthSession(response, 200, await authService.verifyRegistration(body));
  },

  resendVerification: async ({ request, response }) => {
    const body = await readJsonBody(request, bodyLimitBytes);
    sendJson(response, 200, await authService.resendRegistrationVerification(body));
  },

  checkRegistrationAvailability: async ({ request, response }) => {
    const body = await readJsonBody(request, bodyLimitBytes);
    sendJson(response, 200, await authService.checkRegistrationAvailability(body));
  },

  login: async ({ request, response }) => {
    const body = await readJsonBody(request, bodyLimitBytes);
    sendAuthSession(response, 200, await authService.login(body));
  },

  forgotPassword: async ({ request, response }) => {
    const body = await readJsonBody(request, bodyLimitBytes);
    sendJson(response, 200, await authService.requestPasswordReset(body));
  },

  resetPassword: async ({ request, response }) => {
    const body = await readJsonBody(request, bodyLimitBytes);
    sendJson(response, 200, await authService.resetPassword(body));
  },

  getSession: async ({ request, response }) => {
    const session = await authService.restoreSession(request);

    if (!session) {
      sendError(response, 401, "INVALID_CREDENTIALS", "Session expired.");
      return;
    }

    sendAuthSession(response, 200, session);
  },

  getCurrentUser: async ({ request, response }) => {
    const session = await authService.restoreSession(request);

    if (!session) {
      sendError(response, 401, "INVALID_CREDENTIALS", "Session expired.");
      return;
    }

    sendJson(response, 200, { user: session.user });
  },

  refreshSession: async ({ request, response }) => {
    const body = await readJsonBody(request, bodyLimitBytes);
    sendAuthSession(response, 200, await authService.refreshSession(request, body));
  },

  logout: async ({ request, response }) => {
    const body = await readJsonBody(request, bodyLimitBytes);
    await authService.logout(request, body);
    clearAuthCookies(response);
    sendNoContent(response);
  },

  updateProfile: async ({ request, response, auth }) => {
    const body = await readJsonBody(request, bodyLimitBytes);
    sendJson(response, 200, await authService.updateUserProfile(body, auth.user));
  },

  updateProfileAndState: async ({ request, response, auth }) => {
    if (!stateService?.saveProfileState || !stateService?.getSnapshotMeta) {
      sendError(response, 503, "STATE_SYNC_UNAVAILABLE", "Cloud profile sync is unavailable.");
      return;
    }

    const body = await readJsonBody(request, bodyLimitBytes);
    const result = await authService.updateUserProfileAndState({
      body,
      currentUser: auth.user,
      saveProfileState: (profileState) =>
        stateService.saveProfileState(auth.user, profileState, getSyncContext(request)),
      getProfileMeta: () => stateService.getSnapshotMeta(auth.user),
    });

    sendJson(response, 200, result);
  },

  logoutAll: async ({ response, auth }) => {
    await authService.logoutAll(auth.user);
    clearAuthCookies(response);
    sendNoContent(response);
  },
});
