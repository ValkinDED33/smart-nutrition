export interface AuthIdentityHint {
  name?: string;
  email?: string;
}

const IDENTITY_HINT_KEY = "smart-nutrition.identity-hint";
const REGISTER_DRAFT_KEY = "smart-nutrition.register-draft";
const ONBOARDING_KEYS = [
  "smart-nutrition.onboarding",
  "smart-nutrition.onboarding-draft",
  "smart-nutrition.onboarding-profile",
];

const safeReadJson = <T,>(key: string): T | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const sanitizeHint = (value: unknown): AuthIdentityHint => {
  const record =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  const name =
    typeof record.name === "string" && record.name.trim().length > 0
      ? record.name.trim()
      : undefined;
  const email =
    typeof record.email === "string" && record.email.trim().length > 0
      ? record.email.trim().toLowerCase()
      : undefined;

  return {
    ...(name ? { name } : {}),
    ...(email ? { email } : {}),
  };
};

const mergeHints = (hints: AuthIdentityHint[]) =>
  hints.reduce<AuthIdentityHint>(
    (accumulator, hint) => ({
      name: accumulator.name ?? hint.name,
      email: accumulator.email ?? hint.email,
    }),
    {}
  );

const readCookieValue = (name: string) => {
  if (typeof document === "undefined") {
    return null;
  }

  const encodedName = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(encodedName));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(encodedName.length));
};

const writeCookieValue = (name: string, value: string) => {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; path=/; max-age=31536000; SameSite=Lax`;
};

export const readAuthIdentityHint = (): AuthIdentityHint => {
  const storedHint = sanitizeHint(safeReadJson<AuthIdentityHint>(IDENTITY_HINT_KEY));
  const draftHint = sanitizeHint(safeReadJson<AuthIdentityHint>(REGISTER_DRAFT_KEY));
  const onboardingHint = mergeHints(
    ONBOARDING_KEYS.map((key) => sanitizeHint(safeReadJson<AuthIdentityHint>(key)))
  );
  const cookieHint = sanitizeHint({
    name: readCookieValue("smart-nutrition.name") ?? undefined,
    email: readCookieValue("smart-nutrition.email") ?? undefined,
  });

  return mergeHints([storedHint, draftHint, onboardingHint, cookieHint]);
};

export const writeAuthIdentityHint = (hint: AuthIdentityHint) => {
  if (typeof window === "undefined") {
    return;
  }

  const nextHint = sanitizeHint(hint);
  window.localStorage.setItem(IDENTITY_HINT_KEY, JSON.stringify(nextHint));

  if (nextHint.name) {
    writeCookieValue("smart-nutrition.name", nextHint.name);
  }

  if (nextHint.email) {
    writeCookieValue("smart-nutrition.email", nextHint.email);
  }
};

export const writeRegisterDraftHint = (hint: AuthIdentityHint) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    REGISTER_DRAFT_KEY,
    JSON.stringify(sanitizeHint(hint))
  );
};

export const clearRegisterDraftHint = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(REGISTER_DRAFT_KEY);
};
