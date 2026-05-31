import { clearCookie, setCookie, sendJson } from "../lib/http.mjs";

export const createAuthSessionHelpers = (config) => {
  const clearAuthCookies = (response) => {
    clearCookie(response, {
      name: config.authAccessCookieName,
      sameSite: config.authCookieSameSite,
      secure: config.authCookieSecure,
    });
    clearCookie(response, {
      name: config.authRefreshCookieName,
      sameSite: config.authCookieSameSite,
      secure: config.authCookieSecure,
    });
  };

  const applyAuthCookies = (response, payload) => {
    if (payload?.token) {
      setCookie(response, {
        name: config.authAccessCookieName,
        value: payload.token,
        maxAge: Math.floor(config.accessTokenTtlMs / 1000),
        sameSite: config.authCookieSameSite,
        secure: config.authCookieSecure,
      });
    }

    if (payload?.refreshToken) {
      setCookie(response, {
        name: config.authRefreshCookieName,
        value: payload.refreshToken,
        maxAge: Math.floor(config.refreshTokenTtlMs / 1000),
        sameSite: config.authCookieSameSite,
        secure: config.authCookieSecure,
      });
    }
  };

  const sendAuthSession = (response, statusCode, payload) => {
    applyAuthCookies(response, payload);
    sendJson(response, statusCode, {
      user: payload.user,
      snapshot: payload.snapshot ?? null,
    });
  };

  return {
    clearAuthCookies,
    applyAuthCookies,
    sendAuthSession,
  };
};
