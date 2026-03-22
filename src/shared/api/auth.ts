import type { AuthResponse, User } from "../types/user";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  age: number;
  weight: number;
  height: number;
  gender: "male" | "female";
  activity: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "cut" | "maintain" | "bulk";
}

interface StoredUserRecord extends User {
  passwordHash: string;
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
  code: "EMAIL_IN_USE" | "INVALID_CREDENTIALS" | "TOO_MANY_ATTEMPTS";

  constructor(code: AuthApiError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

const USERS_KEY = "smart-nutrition.users";
const SESSION_KEY = "smart-nutrition.session";
const ATTEMPTS_KEY = "smart-nutrition.login-attempts";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_MS = 1000 * 60 * 5;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const sanitizeName = (name: string) => name.trim().replace(/\s+/g, " ");

const hashPassword = (password: string) =>
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

const defaultUser: StoredUserRecord = {
  id: "demo-user",
  name: "Іван",
  email: "ivan@mail.com",
  age: 25,
  weight: 70,
  height: 175,
  avatar: "https://i.pravatar.cc/150?img=3",
  gender: "male",
  activity: "moderate",
  goal: "maintain",
  createdAt: new Date().toISOString(),
  passwordHash: String(hashPassword("StrongPass123!")),
};

const readJson = <T,>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key);

  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const ensureUsers = () => {
  const users = readJson<StoredUserRecord[]>(USERS_KEY, []);

  if (users.length > 0) return users;

  writeJson(USERS_KEY, [defaultUser]);
  return [defaultUser];
};

const saveUsers = (users: StoredUserRecord[]) => {
  writeJson(USERS_KEY, users);
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

export const restoreSession = async (): Promise<AuthResponse | null> => {
  await sleep(150);

  const session = getSession();
  if (!session) return null;

  if (session.expiresAt <= Date.now()) {
    localStorage.removeItem(SESSION_KEY);
    throw new AuthApiError("INVALID_CREDENTIALS", "Session expired.");
  }

  const user = ensureUsers().find((item) => item.email === session.email);

  if (!user) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }

  return {
    user: toPublicUser(user),
    token: session.token,
  };
};

export const logout = async () => {
  await sleep(50);
  localStorage.removeItem(SESSION_KEY);
};

export const updateStoredProfile = async (user: User): Promise<User> => {
  await sleep(250);

  const users = ensureUsers();
  const updatedUsers = users.map((storedUser) =>
    storedUser.email === user.email ? { ...storedUser, ...user } : storedUser
  );

  saveUsers(updatedUsers);

  return user;
};

export const register = async (
  userData: RegisterPayload
): Promise<AuthResponse> => {
  await sleep(450);

  const users = ensureUsers();
  const email = normalizeEmail(userData.email);

  if (users.some((user) => user.email === email)) {
    throw new AuthApiError("EMAIL_IN_USE", "User already exists.");
  }

  const storedUser: StoredUserRecord = {
    id: createUserId(),
    name: sanitizeName(userData.name),
    email,
    age: userData.age,
    weight: userData.weight,
    height: userData.height,
    avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`,
    gender: userData.gender,
    activity: userData.activity,
    goal: userData.goal,
    createdAt: new Date().toISOString(),
    passwordHash: String(hashPassword(userData.password)),
  };

  saveUsers([...users, storedUser]);

  const session = createSession(email);

  return {
    user: toPublicUser(storedUser),
    token: session.token,
  };
};

export const login = async (
  emailInput: string,
  password: string
): Promise<AuthResponse> => {
  await sleep(300);

  const email = normalizeEmail(emailInput);
  assertLoginAllowed(email);

  const user = ensureUsers().find((item) => item.email === email);
  const passwordHash = String(hashPassword(password));

  if (!user || user.passwordHash !== passwordHash) {
    registerFailedAttempt(email);
    throw new AuthApiError(
      "INVALID_CREDENTIALS",
      "Invalid email or password."
    );
  }

  clearAttempts(email);
  const session = createSession(email);

  return {
    user: toPublicUser(user),
    token: session.token,
  };
};
