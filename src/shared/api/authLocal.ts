import type { User } from "../types/user";
import { getDefaultAvatar } from "../lib/avatar";
import {
  getClientStorageItem,
  removeClientStorageItem,
  setClientStorageItem,
} from "../lib/clientPersistence";
import type { AuthProvider, AuthRuntimeInfo, RegisterPayload } from "./authProvider";

interface StoredUserRecord extends User {
  passwordHash: string;
  passwordSalt?: string;
  passwordVersion?: "legacy32" | "pbkdf2-sha256";
  createdAt: string;
}

interface SessionRecord {
  email: string;
  token: string;
  expiresAt: number;
}

interface FailedAttemptRecord {
  count: number;
  lockUntil: number | null;
}

export class AuthApiError extends Error {
  code:
    | "EMAIL_IN_USE"
    | "INVALID_CREDENTIALS"
    | "TOO_MANY_ATTEMPTS"
    | "INVALID_RESET_TOKEN"
    | "EMAIL_DELIVERY_UNAVAILABLE"
    | "WEAK_PASSWORD"
    | "BACKEND_UNAVAILABLE";

  constructor(code: AuthApiError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

const USERS_KEY = "smart-nutrition.users";
const SESSION_KEY = "smart-nutrition.session";
const ATTEMPTS_KEY = "smart-nutrition.login-attempts";
const RESET_TOKENS_KEY = "smart-nutrition.password-reset-tokens";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const PASSWORD_RESET_TTL_MS = 1000 * 60 * 60;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_MS = 1000 * 60 * 5;
const LEGACY_DEMO_USER_ID = "demo-user";
const PASSWORD_ITERATIONS = 120_000;
const textEncoder = new TextEncoder();
const strongPasswordPattern =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-\\/\][+=~`]).{10,}$/;

interface PasswordResetTokenRecord {
  email: string;
  token: string;
  expiresAt: number;
  createdAt: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const sanitizeName = (name: string) => name.trim().replace(/\s+/g, " ");

const legacyHashPassword = (password: string) =>
  Array.from(password).reduce((hash, char) => {
    const next = (hash << 5) - hash + char.charCodeAt(0);
    return next >>> 0;
  }, 0);

const createToken = () =>
  globalThis.crypto?.randomUUID?.() ??
  `token-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createUserId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const encodeBase64 = (bytes: Uint8Array) => {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return globalThis.btoa(binary);
};

const decodeBase64 = (value: string) => {
  const binary = globalThis.atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

const readJson = <T,>(key: string, fallback: T): T => {
  const raw = getClientStorageItem(key);

  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  setClientStorageItem(key, JSON.stringify(value));
};

const ensureUsers = () => {
  const users = readJson<StoredUserRecord[]>(USERS_KEY, []);
  const sanitizedUsers = users.filter((user) => user.id !== LEGACY_DEMO_USER_ID);

  if (sanitizedUsers.length !== users.length) {
    writeJson(USERS_KEY, sanitizedUsers);
  }

  return sanitizedUsers;
};

const saveUsers = (users: StoredUserRecord[]) => {
  writeJson(USERS_KEY, users);
};

const getPasswordResetTokens = () =>
  readJson<PasswordResetTokenRecord[]>(RESET_TOKENS_KEY, []).filter(
    (token) => token.expiresAt > Date.now()
  );

const savePasswordResetTokens = (tokens: PasswordResetTokenRecord[]) => {
  writeJson(
    RESET_TOKENS_KEY,
    tokens.filter((token) => token.expiresAt > Date.now())
  );
};

const getAttempts = () => readJson<Record<string, FailedAttemptRecord>>(ATTEMPTS_KEY, {});

const setAttempts = (attempts: Record<string, FailedAttemptRecord>) => {
  writeJson(ATTEMPTS_KEY, attempts);
};

const clearAttempts = (email: string) => {
  const attempts = getAttempts();
  delete attempts[email];
  setAttempts(attempts);
};

const assertStrongPassword = (password: string) => {
  if (!strongPasswordPattern.test(password)) {
    throw new AuthApiError(
      "WEAK_PASSWORD",
      "Password must be at least 10 characters and include upper, lower, digit, and symbol."
    );
  }
};

const registerFailedAttempt = (email: string) => {
  const attempts = getAttempts();
  const current = attempts[email] ?? { count: 0, lockUntil: null };
  const nextCount = current.count + 1;

  attempts[email] = {
    count: nextCount,
    lockUntil: nextCount >= MAX_LOGIN_ATTEMPTS ? Date.now() + LOGIN_LOCK_MS : null,
  };

  setAttempts(attempts);
};

const assertLoginAllowed = (email: string) => {
  const attempts = getAttempts()[email];

  if (!attempts?.lockUntil) return;

  if (attempts.lockUntil > Date.now()) {
    throw new AuthApiError(
      "TOO_MANY_ATTEMPTS",
      "Too many failed login attempts."
    );
  }

  clearAttempts(email);
};

const toPublicUser = (storedUser: StoredUserRecord): User => ({
  id: storedUser.id,
  name: storedUser.name,
  email: storedUser.email,
  avatar: storedUser.avatar,
  age: storedUser.age,
  weight: storedUser.weight,
  height: storedUser.height,
  gender: storedUser.gender,
  activity: storedUser.activity,
  goal: storedUser.goal,
  role: storedUser.role ?? "USER",
  twoFactorEnabled: storedUser.twoFactorEnabled ?? false,
  twoFactorRequired: storedUser.twoFactorRequired ?? false,
  measurements: storedUser.measurements,
});

const createSession = (email: string) => {
  const session: SessionRecord = {
    email,
    token: createToken(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  };

  writeJson(SESSION_KEY, session);
  return session;
};

const getSession = () => readJson<SessionRecord | null>(SESSION_KEY, null);

const canUseStrongCrypto = () =>
  Boolean(
    globalThis.crypto?.subtle &&
      globalThis.crypto?.getRandomValues
  );

const createRandomSalt = () => {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return encodeBase64(bytes);
};

const derivePasswordHash = async (password: string, salt: string) => {
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await globalThis.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: decodeBase64(salt),
      iterations: PASSWORD_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  return encodeBase64(new Uint8Array(derivedBits));
};

const createPasswordRecord = async (password: string) => {
  if (!canUseStrongCrypto()) {
    return {
      passwordHash: String(legacyHashPassword(password)),
      passwordVersion: "legacy32" as const,
      passwordSalt: undefined,
    };
  }

  const passwordSalt = createRandomSalt();
  const passwordHash = await derivePasswordHash(password, passwordSalt);

  return {
    passwordHash,
    passwordSalt,
    passwordVersion: "pbkdf2-sha256" as const,
  };
};

const verifyPassword = async (storedUser: StoredUserRecord, password: string) => {
  if (
    storedUser.passwordVersion === "pbkdf2-sha256" &&
    storedUser.passwordSalt &&
    canUseStrongCrypto()
  ) {
    const derivedHash = await derivePasswordHash(password, storedUser.passwordSalt);
    return derivedHash === storedUser.passwordHash;
  }

  return String(legacyHashPassword(password)) === storedUser.passwordHash;
};

const localRuntimeInfo: AuthRuntimeInfo = {
  mode: "local-browser",
  providerLabel: "Local browser account",
  sessionLabel: "7-day browser session",
  syncLabel: "This build stores account data in the current browser only.",
  securityLabel: "Passwords are stored locally with browser-side hashing.",
  supportsCloudSync: false,
  supportsAccountDeletion: true,
  supportsDataExport: true,
  supportsSessionRevocation: false,
};

export const localAuthProvider: AuthProvider = {
  restoreSession: async () => {
    await sleep(150);

    const session = getSession();
    if (!session) return null;

    if (session.expiresAt <= Date.now()) {
      removeClientStorageItem(SESSION_KEY);
      throw new AuthApiError("INVALID_CREDENTIALS", "Session expired.");
    }

    const user = ensureUsers().find((item) => item.email === session.email);

    if (!user) {
      removeClientStorageItem(SESSION_KEY);
      return null;
    }

    return {
      user: toPublicUser(user),
      token: session.token,
    };
  },

  logout: async () => {
    await sleep(50);
    removeClientStorageItem(SESSION_KEY);
  },

  logoutEverywhere: async () => {
    await sleep(50);
    removeClientStorageItem(SESSION_KEY);
  },

  updateStoredProfile: async (user: User) => {
    await sleep(250);

    const users = ensureUsers();
    const updatedUsers = users.map((storedUser) =>
      storedUser.email === user.email ? { ...storedUser, ...user } : storedUser
    );

    saveUsers(updatedUsers);

    return user;
  },

  register: async (userData: RegisterPayload) => {
    await sleep(450);

    const users = ensureUsers();
    const email = normalizeEmail(userData.email);

    if (users.some((user) => user.email === email)) {
      throw new AuthApiError("EMAIL_IN_USE", "User already exists.");
    }

    assertStrongPassword(userData.password);

    const passwordRecord = await createPasswordRecord(userData.password);

    const storedUser: StoredUserRecord = {
      id: createUserId(),
      name: sanitizeName(userData.name),
      email,
      age: userData.age,
      weight: userData.weight,
      height: userData.height,
      avatar: getDefaultAvatar(email),
      gender: userData.gender,
      activity: userData.activity,
      goal: userData.goal,
      role: "USER",
      twoFactorEnabled: false,
      twoFactorRequired: false,
      createdAt: new Date().toISOString(),
      ...passwordRecord,
    };

    saveUsers([...users, storedUser]);

    const session = createSession(email);

    return {
      user: toPublicUser(storedUser),
      token: session.token,
    };
  },

  login: async (emailInput: string, password: string) => {
    await sleep(300);

    const email = normalizeEmail(emailInput);
    assertLoginAllowed(email);

    const users = ensureUsers();
    let user = users.find((item) => item.email === email);

    if (!user || !(await verifyPassword(user, password))) {
      registerFailedAttempt(email);
      throw new AuthApiError(
        "INVALID_CREDENTIALS",
        "Invalid email or password."
      );
    }

    if (user.passwordVersion !== "pbkdf2-sha256") {
      const upgradedPassword = await createPasswordRecord(password);
      const upgradedUser: StoredUserRecord = { ...user, ...upgradedPassword };
      user = upgradedUser;
      saveUsers(users.map((item) => (item.email === email ? upgradedUser : item)));
    }

    clearAttempts(email);
    const session = createSession(email);

    return {
      user: toPublicUser(user),
      token: session.token,
    };
  },

  requestPasswordReset: async (emailInput: string) => {
    await sleep(250);

    const email = normalizeEmail(emailInput);
    const user = ensureUsers().find((item) => item.email === email);

    if (!user) {
      return {
        ok: true as const,
        message:
          "If an account with that email exists, a password reset link has been prepared.",
        delivery: "preview" as const,
      };
    }

    const token = createToken();
    const nextTokens = getPasswordResetTokens().filter((item) => item.email !== email);

    nextTokens.push({
      email,
      token,
      expiresAt: Date.now() + PASSWORD_RESET_TTL_MS,
      createdAt: new Date().toISOString(),
    });

    savePasswordResetTokens(nextTokens);

    return {
      ok: true as const,
      message:
        "If an account with that email exists, a password reset link has been prepared.",
      delivery: "preview" as const,
      previewToken: token,
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS).toISOString(),
    };
  },

  resetPassword: async (token: string, password: string) => {
    await sleep(250);

    assertStrongPassword(password);

    const activeTokens = getPasswordResetTokens();
    const resetToken = activeTokens.find((item) => item.token === token);

    if (!resetToken) {
      throw new AuthApiError(
        "INVALID_RESET_TOKEN",
        "Password reset token is invalid or expired."
      );
    }

    const users = ensureUsers();
    const user = users.find((item) => item.email === resetToken.email);

    if (!user) {
      throw new AuthApiError(
        "INVALID_RESET_TOKEN",
        "Password reset token is invalid or expired."
      );
    }

    const passwordRecord = await createPasswordRecord(password);
    saveUsers(
      users.map((item) =>
        item.email === user.email ? { ...item, ...passwordRecord } : item
      )
    );
    savePasswordResetTokens(activeTokens.filter((item) => item.email !== user.email));
    clearAttempts(user.email);

    const session = getSession();

    if (session?.email === user.email) {
      removeClientStorageItem(SESSION_KEY);
    }

    return {
      ok: true as const,
      message: "Password has been updated. You can log in with the new password.",
    };
  },

  deleteAccount: async (emailInput: string) => {
    await sleep(150);

    const email = normalizeEmail(emailInput);
    const users = ensureUsers().filter((user) => user.email !== email);

    saveUsers(users);
    clearAttempts(email);

    const session = getSession();

    if (session?.email === email) {
      removeClientStorageItem(SESSION_KEY);
    }
  },

  getRuntimeInfo: () => localRuntimeInfo,
};
