import {
  getClientStorageItem,
  removeClientStorageItem,
  setClientStorageItem,
} from "./clientPersistence";

const AUTH_SESSION_HINT_KEY = "smart-nutrition.auth-session-hint";
const AUTH_SESSION_HINT_TTL_MS = 1000 * 60 * 60 * 24 * 8;

type AuthSessionHint = {
  savedAt: number;
  baseUrl?: string;
};

const readBrowserStorageItem = (key: string) => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const parseAuthSessionHint = (rawValue: string | null): AuthSessionHint | null => {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as AuthSessionHint).savedAt !== "number"
    ) {
      return null;
    }

    const baseUrl =
      typeof (parsed as AuthSessionHint).baseUrl === "string"
        ? (parsed as AuthSessionHint).baseUrl
        : undefined;

    return {
      savedAt: (parsed as AuthSessionHint).savedAt,
      baseUrl,
    };
  } catch {
    return null;
  }
};

const readAuthSessionHint = () =>
  parseAuthSessionHint(
    getClientStorageItem(AUTH_SESSION_HINT_KEY) ??
      readBrowserStorageItem(AUTH_SESSION_HINT_KEY)
  );

export const hasRecentAuthSessionHint = (now = Date.now()) => {
  const hint = readAuthSessionHint();

  return Boolean(
    hint &&
      Number.isFinite(hint.savedAt) &&
      now - hint.savedAt >= 0 &&
      now - hint.savedAt <= AUTH_SESSION_HINT_TTL_MS
  );
};

export const writeAuthSessionHint = (baseUrl?: string) => {
  const hint: AuthSessionHint = {
    savedAt: Date.now(),
    baseUrl,
  };

  setClientStorageItem(AUTH_SESSION_HINT_KEY, JSON.stringify(hint));
};

export const clearAuthSessionHint = () => {
  removeClientStorageItem(AUTH_SESSION_HINT_KEY);
};
