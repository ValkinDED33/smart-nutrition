export interface AuthIdentityHint {
  name?: string;
  email?: string;
}

const AUTH_IDENTITY_HINT_KEY = "smart-nutrition.auth-identity-hint";
const AUTH_IDENTITY_HINT_TTL_MS = 1000 * 60 * 60 * 24;
let memoryHintValue: string | null = null;

type AuthIdentityHintEnvelope = AuthIdentityHint & {
  savedAt: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const normalizeHint = (hint: AuthIdentityHint): AuthIdentityHint => {
  const name = hint.name?.trim();
  const email = hint.email?.trim().toLowerCase();

  return {
    ...(name ? { name } : {}),
    ...(email ? { email } : {}),
  };
};

const getSessionStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const parseHintEnvelope = (rawValue: string | null): AuthIdentityHint | null => {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!isRecord(parsed) || typeof parsed.savedAt !== "number") {
      return null;
    }

    if (Date.now() - parsed.savedAt > AUTH_IDENTITY_HINT_TTL_MS) {
      return null;
    }

    return normalizeHint({
      name: typeof parsed.name === "string" ? parsed.name : undefined,
      email: typeof parsed.email === "string" ? parsed.email : undefined,
    });
  } catch {
    return null;
  }
};

export const readAuthIdentityHint = (): AuthIdentityHint => {
  const storage = getSessionStorage();
  const hint = parseHintEnvelope(
    storage?.getItem(AUTH_IDENTITY_HINT_KEY) ?? memoryHintValue
  );

  return hint ?? {};
};

export const writeAuthIdentityHint = (hint: AuthIdentityHint) => {
  const normalizedHint = normalizeHint(hint);
  const storage = getSessionStorage();

  if (!normalizedHint.name && !normalizedHint.email) {
    memoryHintValue = null;
    storage?.removeItem(AUTH_IDENTITY_HINT_KEY);
    return;
  }

  const envelope: AuthIdentityHintEnvelope = {
    ...normalizedHint,
    savedAt: Date.now(),
  };
  const serializedEnvelope = JSON.stringify(envelope);

  memoryHintValue = serializedEnvelope;
  storage?.setItem(AUTH_IDENTITY_HINT_KEY, serializedEnvelope);
};

export const writeRegisterDraftHint = (hint: AuthIdentityHint) =>
  writeAuthIdentityHint(hint);

export const clearRegisterDraftHint = () => {
  memoryHintValue = null;
  getSessionStorage()?.removeItem(AUTH_IDENTITY_HINT_KEY);
};
