import { readJsonBody, sendError, sendJson, sendNoContent } from "../lib/http.mjs";

const PUBLIC_AUTH_ROUTES = [
  ["POST", "/api/auth/register", "register"],
  ["POST", "/api/auth/verify-registration", "verifyRegistration"],
  ["POST", "/api/auth/resend-verification", "resendVerification"],
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
  bodyLimitBytes,
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

  logoutAll: async ({ response, auth }) => {
    await authService.logoutAll(auth.user);
    clearAuthCookies(response);
    sendNoContent(response);
  },
});
