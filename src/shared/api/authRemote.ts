import type {
  AuthResponse,
  RegistrationVerificationPending,
  User,
} from "@domain/user/types";
import type { AppSnapshot, AppSnapshotMeta } from "../types/appSnapshot";
import type { MealEntry, MealTemplate } from "@domain/meal/types";
import type { PhotoMealAnalysis } from "../types/photo";
import type { Product } from "@domain/products/types";
import { getRemoteDeviceId } from "../lib/remoteDevice";
import {
  clearCachedRemoteState,
  readCachedRemoteMeta,
  readCachedRemoteSnapshot,
  writeCachedRemoteMeta,
  writeCachedRemoteSnapshot,
} from "../lib/remoteStateCache";
import {
  getClientStorageItem,
  removeClientStorageItem,
  setClientStorageItem,
} from "../lib/clientPersistence";
import {
  clearAuthSessionHint,
  writeAuthSessionHint,
} from "../lib/authSessionHint";
import { AuthApiError } from "./authProvider";
import type {
  AccountBackupPayload,
  AccountBackupSummary,
  AccountExportPayload,
  AuthProvider,
  AuthRuntimeInfo,
  PasswordResetRequestResult,
  PasswordResetResult,
  RegisterPayload,
  RegistrationAvailabilityResult,
  RegistrationResult,
} from "./authProvider";

export interface RemoteSyncResult {
  ok: boolean;
  message?: string;
  code?: string;
  meta?: AppSnapshotMeta | null;
  meal?: unknown;
}

const REMOTE_API_UNAVAILABLE_MESSAGE = "Backend unavailable. Please reconnect.";
const CLOUD_SYNC_DISABLED_MESSAGE = "Cloud sync is not active for this account.";

export interface ProductIntakePayload {
  source: "barcode" | "search" | "manual" | "recommendation" | "photo";
  product?: Product;
  barcode?: string;
  query?: string;
  quantity: number;
  mealType: MealEntry["mealType"];
  eatenAt?: string;
  idempotencyKey: string;
  options?: {
    saveToLibrary?: boolean;
    submitToCatalog?: boolean;
  };
}

export interface ProductIntakeResult extends RemoteSyncResult {
  meal?: unknown;
  entry?: MealEntry;
  product?: Product;
  outcomes?: {
    mealAdded: boolean;
    librarySaved: boolean;
    catalogAccepted: boolean;
    catalogFailedRetryable: boolean;
  };
  catalog?: {
    requested: boolean;
    accepted: boolean;
    failed: boolean;
    retryable: boolean;
    message: string | null;
  };
}

export interface TelegramConnectionStatus {
  configured: boolean;
  provider: "telegram";
  botUsername: string | null;
  connected: boolean;
  connectedAt: string | null;
}

export interface TelegramConnectLink extends TelegramConnectionStatus {
  url: string;
  expiresAt: string;
}

interface RemoteMutationResponse {
  ok: true;
  meta: AppSnapshotMeta | null;
  meal?: unknown;
}

interface RemoteProfileAndStateResponse extends RemoteMutationResponse {
  user: User;
}

interface RemoteBackupListResponse {
  items: AccountBackupSummary[];
}

class RemoteRequestError extends Error {
  code: string;
  status: number;
  meta: AppSnapshotMeta | null;

  constructor({
    code,
    message,
    status,
    meta = null,
  }: {
    code: string;
    message: string;
    status: number;
    meta?: AppSnapshotMeta | null;
  }) {
    super(message);
    this.code = code;
    this.status = status;
    this.meta = meta;
  }
}

const REMOTE_BASE_URL_KEY = "smart-nutrition.remote-base-url";
const PUBLIC_REMOTE_API_BASE_URL =
  "https://smart-nutrition-sk5r.onrender.com/api";
const REMOTE_HEALTH_TIMEOUT_MS = 3_500;
const REMOTE_STARTUP_HEALTH_TIMEOUT_MS = 2_000;
const REMOTE_AUTH_REFRESH_TIMEOUT_MS = 12_000;
const REMOTE_REQUEST_TIMEOUT_MS = 18_000;
const REMOTE_LONG_REQUEST_TIMEOUT_MS = 45_000;
const PUBLIC_FRONTEND_HOSTNAMES = new Set([
  "www.smart-nutrition.club",
  "smart-nutrition.club",
  "smart-nutrition-alpha.vercel.app",
  "smart-nutrition-topaz.vercel.app",
  "smart-nutrition-git-master-valkindeds-projects.vercel.app",
  "smart-nutrition-ibgl50b69-valkindeds-projects.vercel.app",
]);
const LEGACY_BROWSER_AUTH_KEYS = [
  "smart-nutrition.users",
  "smart-nutrition.session",
  "smart-nutrition.login-attempts",
  "smart-nutrition.password-reset-tokens",
  "smart-nutrition.registration-verification-tokens",
  "smart-nutrition.auth-mode",
  "smart-nutrition.remote-user",
];

const remoteRuntimeInfo: AuthRuntimeInfo = {
  mode: "remote-cloud",
  providerLabel: "Remote API account",
  sessionLabel: "Secure cookie session",
  syncLabel:
    "Profile, meal, water, fridge, and community changes are synchronized through remote state endpoints.",
  securityLabel:
    "Authentication relies on httpOnly cookie sessions, so tokens are never exposed to client-side JavaScript.",
  supportsAccountDeletion: true,
  supportsDataExport: true,
  supportsSessionRevocation: true,
};

let remoteBaseProbePromise: Promise<string | null> | null = null;
let remoteRefreshPromise: Promise<void> | null = null;
let remoteSessionActive = false;

const loopbackHostnames = new Set([
  ["local", "host"].join(""),
  ["127", "0", "0", "1"].join("."),
  "::1",
  "[::1]",
]);

const dedupe = (values: string[]) => [...new Set(values.filter(Boolean))];

const createTimedAbortSignal = (
  timeoutMs: number,
  upstreamSignal?: AbortSignal | null
) => {
  const controller = new AbortController();
  let settled = false;
  const abort = () => {
    if (!settled) {
      controller.abort();
    }
  };
  const timerId = globalThis.setTimeout(abort, timeoutMs);
  const abortFromUpstream = () => abort();

  if (upstreamSignal?.aborted) {
    abort();
  } else {
    upstreamSignal?.addEventListener("abort", abortFromUpstream, {
      once: true,
    });
  }

  return {
    signal: controller.signal,
    clear: () => {
      settled = true;
      globalThis.clearTimeout(timerId);
      upstreamSignal?.removeEventListener("abort", abortFromUpstream);
    },
  };
};

const normalizeRemoteBaseUrl = (value: unknown) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  try {
    const parsedUrl = new URL(value.trim());

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return null;
    }

    parsedUrl.hash = "";
    parsedUrl.search = "";

    return parsedUrl.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
};

const isLoopbackBaseUrl = (value: string) => {
  try {
    const { hostname } = new URL(value);
    return loopbackHostnames.has(hostname);
  } catch {
    return false;
  }
};

export const canUseRemoteBaseUrlInCurrentBrowser = (value: string) =>
  !isLoopbackBaseUrl(value);

const isVercelPreviewHostname = (hostname: string) =>
  hostname.endsWith(".vercel.app");

const getPublicDeploymentRemoteBaseUrl = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const { hostname } = window.location;

  return PUBLIC_FRONTEND_HOSTNAMES.has(hostname) ||
    isVercelPreviewHostname(hostname)
    ? PUBLIC_REMOTE_API_BASE_URL
    : null;
};

const getConfiguredRemoteBaseUrl = () => {
  const configuredBaseUrl =
    normalizeRemoteBaseUrl(import.meta.env.VITE_SMART_NUTRITION_API_BASE_URL) ??
    normalizeRemoteBaseUrl(getPublicDeploymentRemoteBaseUrl());

  if (
    !configuredBaseUrl ||
    !canUseRemoteBaseUrlInCurrentBrowser(configuredBaseUrl)
  ) {
    return null;
  }

  return configuredBaseUrl;
};

const getStoredRemoteBaseUrl = () => {
  const storedBaseUrl = normalizeRemoteBaseUrl(
    getClientStorageItem(REMOTE_BASE_URL_KEY)
  );

  if (!storedBaseUrl) {
    return null;
  }

  if (!canUseRemoteBaseUrlInCurrentBrowser(storedBaseUrl)) {
    return null;
  }

  return storedBaseUrl;
};

export const purgeLegacyBrowserAuthStorage = () => {
  LEGACY_BROWSER_AUTH_KEYS.forEach((key) => {
    removeClientStorageItem(key);
  });
};

const setRemoteSession = (baseUrl: string) => {
  purgeLegacyBrowserAuthStorage();
  setClientStorageItem(REMOTE_BASE_URL_KEY, baseUrl);
  writeAuthSessionHint(baseUrl);
  remoteSessionActive = true;
};

const rememberRemoteBaseUrl = (baseUrl: string) => {
  setClientStorageItem(REMOTE_BASE_URL_KEY, baseUrl);
};

const clearRemoteSession = () => {
  remoteSessionActive = false;
  removeClientStorageItem(REMOTE_BASE_URL_KEY);
  clearAuthSessionHint();
  clearCachedRemoteState();
  purgeLegacyBrowserAuthStorage();
};

const isRegistrationVerificationPending = (
  value: unknown
): value is RegistrationVerificationPending =>
  typeof value === "object" &&
  value !== null &&
  (value as { requiresVerification?: unknown }).requiresVerification === true;

const readJsonResponse = async <T>(response: Response) => {
  if (response.status === 204) {
    return undefined as T;
  }

  const responseText = await response.text();

  if (!responseText.trim()) {
    return undefined as T;
  }

  return JSON.parse(responseText) as T;
};

const readRemoteErrorPayload = async (response: Response) => {
  try {
    return (await response.json()) as {
      code?: string;
      message?: string;
      meta?: AppSnapshotMeta | null;
    };
  } catch {
    return {
      code: undefined,
      message: undefined,
      meta: null,
    };
  }
};

const toRemoteRequestError = async (
  response: Response,
  fallbackCode = "REMOTE_REQUEST_FAILED",
  fallbackMessage = "Remote request failed."
) => {
  const payload = await readRemoteErrorPayload(response);

  return new RemoteRequestError({
    code: payload.code ?? fallbackCode,
    message: payload.message ?? fallbackMessage,
    status: response.status,
    meta: payload.meta ?? null,
  });
};

const toAuthApiError = (error: unknown): AuthApiError | null => {
  if (error instanceof AuthApiError) {
    return error;
  }

  if (error instanceof RemoteRequestError) {
    if (error.code === "EMAIL_IN_USE") {
      return new AuthApiError("EMAIL_IN_USE", error.message);
    }

    if (error.code === "NAME_IN_USE") {
      return new AuthApiError("NAME_IN_USE", error.message);
    }

    if (error.code === "TOO_MANY_ATTEMPTS") {
      return new AuthApiError("TOO_MANY_ATTEMPTS", error.message);
    }

    if (error.code === "INVALID_RESET_TOKEN") {
      return new AuthApiError("INVALID_RESET_TOKEN", error.message);
    }

    if (error.code === "EMAIL_DELIVERY_UNAVAILABLE") {
      return new AuthApiError("EMAIL_DELIVERY_UNAVAILABLE", error.message);
    }

    if (error.code === "VERIFICATION_DELIVERY_UNAVAILABLE") {
      return new AuthApiError(
        "VERIFICATION_DELIVERY_UNAVAILABLE",
        error.message
      );
    }

    if (error.code === "INVALID_VERIFICATION_LINK") {
      return new AuthApiError("INVALID_VERIFICATION_LINK", error.message);
    }

    if (error.code === "REGISTRATION_NOT_VERIFIED") {
      return new AuthApiError("REGISTRATION_NOT_VERIFIED", error.message);
    }

    if (error.code === "ACCOUNT_BANNED") {
      return new AuthApiError("ACCOUNT_BANNED", error.message);
    }

    if (error.code === "WEAK_PASSWORD") {
      return new AuthApiError("WEAK_PASSWORD", error.message);
    }

    if (error.code === "INVALID_PROFILE") {
      return new AuthApiError("INVALID_PROFILE", error.message);
    }

    if (error.code === "INVALID_REFRESH_TOKEN") {
      return new AuthApiError("INVALID_REFRESH_TOKEN", error.message);
    }

    if (error.status === 401 || error.code === "INVALID_CREDENTIALS") {
      return new AuthApiError("INVALID_CREDENTIALS", error.message);
    }

    return null;
  }

  return null;
};

const toRemoteSyncResult = (
  error: unknown,
  fallbackMessage = "Cloud sync could not save the latest change."
): RemoteSyncResult => {
  if (error instanceof AuthApiError) {
    return {
      ok: false,
      code: error.code,
      message: error.message,
      meta: null,
    };
  }

  if (error instanceof RemoteRequestError) {
    return {
      ok: false,
      code: error.code,
      message: error.message,
      meta: error.meta,
    };
  }

  return {
    ok: false,
    code: "SYNC_FAILED",
    message: fallbackMessage,
    meta: null,
  };
};

const getCurrentRemoteStateVersion = () =>
  readCachedRemoteMeta({ allowStale: true })?.updatedAt ??
  readCachedRemoteSnapshot()?.updatedAt ??
  null;

const refreshRemoteAccessToken = async (baseUrl: string) => {
  if (remoteRefreshPromise) {
    return remoteRefreshPromise;
  }

  remoteRefreshPromise = (async () => {
    let response: Response;
    const timeout = createTimedAbortSignal(REMOTE_AUTH_REFRESH_TIMEOUT_MS);

    try {
      response = await fetch(`${baseUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        credentials: "include",
        signal: timeout.signal,
      });
    } catch {
      throw new AuthApiError(
        "REMOTE_API_UNAVAILABLE",
        REMOTE_API_UNAVAILABLE_MESSAGE
      );
    } finally {
      timeout.clear();
    }

    if (!response.ok) {
      const authError = toAuthApiError(await toRemoteRequestError(response));

      if (authError) {
        clearRemoteSession();
        throw authError;
      }

      throw new Error("Remote refresh request failed.");
    }

    const payload = await readJsonResponse<AuthResponse>(response);
    setRemoteSession(baseUrl);

    if (payload.snapshot) {
      writeCachedRemoteSnapshot(payload.snapshot);
    }
  })().finally(() => {
    remoteRefreshPromise = null;
  });

  return remoteRefreshPromise;
};

export const refreshRemoteSession = async () => {
  const baseUrl =
    getStoredRemoteBaseUrl() ??
    (await probeRemoteBaseUrl()) ??
    (await probeRemoteBaseUrl({ force: true }));

  if (!baseUrl) {
    return false;
  }

  try {
    await refreshRemoteAccessToken(baseUrl);
    return true;
  } catch {
    return false;
  }
};

const getCandidateBaseUrls = () => {
  const candidates = [getStoredRemoteBaseUrl(), getConfiguredRemoteBaseUrl()];

  return dedupe(candidates.filter((value): value is string => Boolean(value)));
};

const isRemoteHealthPayload = (value: unknown) =>
  typeof value === "object" &&
  value !== null &&
  "ok" in value &&
  (value as { ok?: unknown }).ok === true &&
  (isLegacyRemoteHealthPayload(value) || isPublicRemoteHealthPayload(value));

const isLegacyRemoteHealthPayload = (value: object) =>
  "provider" in value &&
  ((value as { provider?: unknown }).provider ===
    "smart-nutrition-sqlite-api" ||
    (value as { provider?: unknown }).provider ===
      "smart-nutrition-postgres-api" ||
    (value as { provider?: unknown }).provider ===
      "smart-nutrition-mongodb-api");

const isPublicRemoteHealthPayload = (value: object) => {
  const payload = value as {
    auth?: unknown;
    mode?: unknown;
    storage?: { engine?: unknown } | null;
  };

  return (
    payload.auth === "httpOnly-cookie-session" &&
    typeof payload.mode === "string" &&
    typeof payload.storage === "object" &&
    payload.storage !== null &&
    ["mongodb", "postgres", "sqlite"].includes(String(payload.storage.engine))
  );
};

interface RemoteProbeOptions {
  force?: boolean;
  signal?: AbortSignal | null;
  timeoutMs?: number;
}

const probeRemoteBaseUrl = async ({
  force = false,
  signal = null,
  timeoutMs = REMOTE_HEALTH_TIMEOUT_MS,
}: RemoteProbeOptions = {}): Promise<string | null> => {
  const canReuseSharedProbe = !force && !signal && timeoutMs === REMOTE_HEALTH_TIMEOUT_MS;

  if (canReuseSharedProbe && remoteBaseProbePromise) {
    return remoteBaseProbePromise;
  }

  const probePromise = (async () => {
    for (const baseUrl of getCandidateBaseUrls()) {
      if (signal?.aborted) {
        return null;
      }

      const timeout = createTimedAbortSignal(timeoutMs, signal);

      try {
        const response = await fetch(`${baseUrl}/health`, {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "include",
          signal: timeout.signal,
        });

        if (
          response.ok &&
          isRemoteHealthPayload(await readJsonResponse<unknown>(response))
        ) {
          return baseUrl;
        }
      } catch {
        if (signal?.aborted) {
          return null;
        }

        continue;
      } finally {
        timeout.clear();
      }
    }

    return null;
  })();

  if (canReuseSharedProbe) {
    remoteBaseProbePromise = probePromise;
  }

  const baseUrl = await probePromise;

  if (canReuseSharedProbe && !baseUrl) {
    remoteBaseProbePromise = null;
  }

  return baseUrl;
};

export const requestRemote = async <T>(
  path: string,
  init: RequestInit = {},
  {
    requireAuth = false,
    allowRefresh = true,
    withSyncContext = false,
    timeoutMs = REMOTE_REQUEST_TIMEOUT_MS,
  }: {
    requireAuth?: boolean;
    allowRefresh?: boolean;
    withSyncContext?: boolean;
    timeoutMs?: number;
  } = {}
): Promise<{ data: T; baseUrl: string }> => {
  const upstreamSignal = init.signal ?? null;
  const baseUrl =
    getStoredRemoteBaseUrl() ??
    (await probeRemoteBaseUrl({ signal: upstreamSignal, timeoutMs })) ??
    (await probeRemoteBaseUrl({ force: true, signal: upstreamSignal, timeoutMs }));

  if (!baseUrl) {
    throw new AuthApiError(
      "REMOTE_API_UNAVAILABLE",
      REMOTE_API_UNAVAILABLE_MESSAGE
    );
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const performRequest = async () => {
    const nextHeaders = new Headers(headers);
    const { signal: upstreamSignal, ...requestInit } = init;
    const timeout = createTimedAbortSignal(timeoutMs, upstreamSignal);

    if (withSyncContext) {
      const deviceId = getRemoteDeviceId();
      const baseVersion = getCurrentRemoteStateVersion();

      if (deviceId) {
        nextHeaders.set("X-Device-Id", deviceId);
      }

      if (baseVersion) {
        nextHeaders.set("X-State-Version", baseVersion);
      }
    }

    try {
      return await fetch(`${baseUrl}${path}`, {
        ...requestInit,
        headers: nextHeaders,
        credentials: "include",
        signal: timeout.signal,
      });
    } finally {
      timeout.clear();
    }
  };

  let response: Response;

  try {
    response = await performRequest();
  } catch {
    throw new AuthApiError(
      "REMOTE_API_UNAVAILABLE",
      REMOTE_API_UNAVAILABLE_MESSAGE
    );
  }

  if (response.status === 401 && requireAuth && allowRefresh) {
    try {
      await refreshRemoteAccessToken(baseUrl);
      try {
        response = await performRequest();
      } catch {
        throw new AuthApiError(
          "REMOTE_API_UNAVAILABLE",
          REMOTE_API_UNAVAILABLE_MESSAGE
        );
      }
    } catch (error) {
      const authError = toAuthApiError(error);

      if (authError) {
        clearRemoteSession();
        throw authError;
      }

      throw error;
    }
  }

  if (!response.ok) {
    throw await toRemoteRequestError(response);
  }

  const data = await readJsonResponse<T>(response);
  return { data, baseUrl };
};

export const checkRemoteBackendAvailability = async (force = false) =>
  Boolean(await probeRemoteBaseUrl({ force }));

export const isRemoteAuthAvailable = async () =>
  checkRemoteBackendAvailability();

export const isRemoteAuthMode = () => remoteSessionActive;

export const getRemoteAuthRuntimeInfo = () => remoteRuntimeInfo;

export const getRemoteSessionToken = () => null;

export const getRemoteBaseUrl = () => getStoredRemoteBaseUrl();

export const fetchRemoteStateMeta = async ({
  force = false,
}: { force?: boolean } = {}): Promise<AppSnapshotMeta | null> => {
  if (!isRemoteAuthMode()) {
    return null;
  }

  if (!force) {
    const cachedMeta = readCachedRemoteMeta();

    if (cachedMeta) {
      return cachedMeta;
    }
  }

  try {
    const { data } = await requestRemote<AppSnapshotMeta>(
      "/state/meta",
      { method: "GET" },
      { requireAuth: true }
    );

    writeCachedRemoteMeta(data);

    return data;
  } catch {
    return readCachedRemoteMeta({ allowStale: true });
  }
};

export const fetchRemoteAppState = async ({
  preferCache = false,
  force = false,
}: {
  preferCache?: boolean;
  force?: boolean;
} = {}): Promise<AppSnapshot | null> => {
  if (!isRemoteAuthMode()) {
    return null;
  }

  if (preferCache && !force) {
    const cachedSnapshot = readCachedRemoteSnapshot();

    if (cachedSnapshot) {
      return cachedSnapshot;
    }
  }

  try {
    const { data } = await requestRemote<AppSnapshot>(
      "/state",
      { method: "GET" },
      { requireAuth: true }
    );
    const nextData = preserveCachedCompanionState(data);

    if (nextData) {
      writeCachedRemoteSnapshot(nextData);
    }
    return nextData;
  } catch {
    return preferCache ? readCachedRemoteSnapshot() : null;
  }
};

const preserveCachedCompanionState = (snapshot: AppSnapshot | null) => {
  if (!snapshot || snapshot.companion !== undefined) {
    return snapshot;
  }

  const cachedCompanion = readCachedRemoteSnapshot()?.companion;

  return cachedCompanion === undefined
    ? snapshot
    : {
        ...snapshot,
        companion: cachedCompanion,
      };
};

export const pushRemoteAppSnapshot = async (
  snapshot: AppSnapshot
): Promise<RemoteSyncResult> => {
  if (!isRemoteAuthMode()) {
    return {
      ok: false,
      code: "SYNC_DISABLED",
      message: CLOUD_SYNC_DISABLED_MESSAGE,
      meta: null,
    };
  }

  const result = await getRemoteMutationResult("/state", {
    method: "PUT",
    body: JSON.stringify(snapshot),
  });

  if (result.ok) {
    writeCachedRemoteSnapshot({
      ...snapshot,
      updatedAt: result.meta?.updatedAt ?? snapshot.updatedAt ?? null,
      profileUpdatedAt:
        result.meta?.profileUpdatedAt ??
        result.meta?.updatedAt ??
        snapshot.profileUpdatedAt ??
        null,
      mealUpdatedAt:
        result.meta?.mealUpdatedAt ??
        result.meta?.updatedAt ??
        snapshot.mealUpdatedAt ??
        null,
      waterUpdatedAt:
        result.meta?.waterUpdatedAt ??
        result.meta?.updatedAt ??
        snapshot.waterUpdatedAt ??
        null,
      backupEnabled: result.meta?.backupEnabled ?? snapshot.backupEnabled,
      lastWriterDeviceId:
        result.meta?.lastWriterDeviceId ?? snapshot.lastWriterDeviceId ?? null,
    });
  }

  return result;
};

const getRemoteMutationResult = async (
  path: string,
  init: RequestInit
): Promise<RemoteSyncResult> => {
  try {
    const { data } = await requestRemote<RemoteMutationResponse>(path, init, {
      requireAuth: true,
      withSyncContext: true,
    });

    if (data.meta) {
      writeCachedRemoteMeta(data.meta);
    }

    if (data.meal) {
      const cachedSnapshot = readCachedRemoteSnapshot();

      if (cachedSnapshot) {
        writeCachedRemoteSnapshot({
          ...cachedSnapshot,
          meal: data.meal,
          mealUpdatedAt: data.meta?.mealUpdatedAt ?? cachedSnapshot.mealUpdatedAt,
          updatedAt: data.meta?.updatedAt ?? cachedSnapshot.updatedAt,
        });
      }
    }

    return {
      ok: true,
      meta: data.meta,
      meal: data.meal,
    };
  } catch (error) {
    return toRemoteSyncResult(error);
  }
};

export const pushRemoteProfileState = async (
  profile: unknown
): Promise<RemoteSyncResult> => {
  if (!isRemoteAuthMode()) {
    return {
      ok: false,
      code: "SYNC_DISABLED",
      message: CLOUD_SYNC_DISABLED_MESSAGE,
      meta: null,
    };
  }

  return getRemoteMutationResult("/profile-state", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
};

export const updateRemoteProfileWithState = async (
  user: User,
  profile: unknown
): Promise<RemoteSyncResult & { user?: User }> => {
  if (!isRemoteAuthMode()) {
    return {
      ok: false,
      code: "SYNC_DISABLED",
      message: CLOUD_SYNC_DISABLED_MESSAGE,
      meta: null,
    };
  }

  try {
    const { data } = await requestRemote<RemoteProfileAndStateResponse>(
      "/auth/profile-state",
      {
        method: "PATCH",
        body: JSON.stringify({ user, profile }),
      },
      { requireAuth: true, withSyncContext: true }
    );

    if (data.meta) {
      writeCachedRemoteMeta(data.meta);
    }

    return {
      ok: true,
      user: data.user,
      meta: data.meta,
    };
  } catch (error) {
    return toRemoteSyncResult(error);
  }
};

export const pushRemoteMealState = async (
  meal: unknown
): Promise<RemoteSyncResult> => {
  if (!isRemoteAuthMode()) {
    return {
      ok: false,
      code: "SYNC_DISABLED",
      message: CLOUD_SYNC_DISABLED_MESSAGE,
      meta: null,
    };
  }

  return getRemoteMutationResult("/meal-state", {
    method: "PUT",
    body: JSON.stringify(meal),
  });
};

export const pushRemoteWaterState = async (
  water: unknown
): Promise<RemoteSyncResult> => {
  if (!isRemoteAuthMode()) {
    return {
      ok: false,
      code: "SYNC_DISABLED",
      message: CLOUD_SYNC_DISABLED_MESSAGE,
      meta: null,
    };
  }

  return getRemoteMutationResult("/water-state", {
    method: "PUT",
    body: JSON.stringify(water),
  });
};

export const pushRemoteFridgeState = async (
  fridge: unknown
): Promise<RemoteSyncResult> => {
  if (!isRemoteAuthMode()) {
    return {
      ok: false,
      code: "SYNC_DISABLED",
      message: CLOUD_SYNC_DISABLED_MESSAGE,
      meta: null,
    };
  }

  return getRemoteMutationResult("/fridge-state", {
    method: "PUT",
    body: JSON.stringify(fridge),
  });
};

export const pushRemoteCommunityState = async (
  community: unknown
): Promise<RemoteSyncResult> => {
  if (!isRemoteAuthMode()) {
    return {
      ok: false,
      code: "SYNC_DISABLED",
      message: CLOUD_SYNC_DISABLED_MESSAGE,
      meta: null,
    };
  }

  return getRemoteMutationResult("/community-state", {
    method: "PUT",
    body: JSON.stringify(community),
  });
};

export const pushRemoteCompanionState = async (
  companion: unknown
): Promise<RemoteSyncResult> => {
  if (!isRemoteAuthMode()) {
    return {
      ok: false,
      code: "SYNC_DISABLED",
      message: CLOUD_SYNC_DISABLED_MESSAGE,
      meta: null,
    };
  }

  return getRemoteMutationResult("/companion-state", {
    method: "PUT",
    body: JSON.stringify(companion),
  });
};

export const addRemoteMealEntries = async (
  entries: MealEntry[]
): Promise<RemoteSyncResult> => {
  if (!isRemoteAuthMode() || entries.length === 0) {
    return {
      ok: false,
      code: "INVALID_ENTRIES",
      message: "Meal entries are required for cloud sync.",
      meta: null,
    };
  }

  return getRemoteMutationResult("/meal-entries", {
    method: "POST",
    body: JSON.stringify({ entries }),
  });
};

export const addRemoteProductIntake = async (
  payload: ProductIntakePayload
): Promise<ProductIntakeResult> => {
  if (!isRemoteAuthMode()) {
    return {
      ok: false,
      code: "SYNC_DISABLED",
      message: CLOUD_SYNC_DISABLED_MESSAGE,
      meta: null,
    };
  }

  try {
    const { data } = await requestRemote<ProductIntakeResult>(
      "/meal/product-intake",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      {
        requireAuth: true,
        withSyncContext: true,
      }
    );

    if (data.meta) {
      writeCachedRemoteMeta(data.meta);
    }

    if (data.meal) {
      const cachedSnapshot = readCachedRemoteSnapshot();

      if (cachedSnapshot) {
        writeCachedRemoteSnapshot({
          ...cachedSnapshot,
          meal: data.meal,
          mealUpdatedAt: data.meta?.mealUpdatedAt ?? cachedSnapshot.mealUpdatedAt,
          updatedAt: data.meta?.updatedAt ?? cachedSnapshot.updatedAt,
        });
      }
    }

    return data;
  } catch (error) {
    return toRemoteSyncResult(error);
  }
};

export const removeRemoteMealEntry = async (
  entryId: string
): Promise<RemoteSyncResult> => {
  if (!isRemoteAuthMode() || !entryId) {
    return {
      ok: false,
      code: "INVALID_ENTRY_ID",
      message: "Meal entry id is required for cloud sync.",
      meta: null,
    };
  }

  return getRemoteMutationResult(
    `/meal-entries/${encodeURIComponent(entryId)}`,
    {
      method: "DELETE",
    }
  );
};

export const addRemoteMealTemplate = async (
  template: MealTemplate
): Promise<RemoteSyncResult> => {
  if (!isRemoteAuthMode()) {
    return {
      ok: false,
      code: "SYNC_DISABLED",
      message: CLOUD_SYNC_DISABLED_MESSAGE,
      meta: null,
    };
  }

  return getRemoteMutationResult("/meal-templates", {
    method: "POST",
    body: JSON.stringify(template),
  });
};

export const removeRemoteMealTemplate = async (
  templateId: string
): Promise<RemoteSyncResult> => {
  if (!isRemoteAuthMode() || !templateId) {
    return {
      ok: false,
      code: "INVALID_TEMPLATE_ID",
      message: "Meal template id is required for cloud sync.",
      meta: null,
    };
  }

  return getRemoteMutationResult(
    `/meal-templates/${encodeURIComponent(templateId)}`,
    {
      method: "DELETE",
    }
  );
};

export const upsertRemoteMealProduct = async (
  bucket: "saved" | "recent",
  product: Product
): Promise<RemoteSyncResult> => {
  if (!isRemoteAuthMode()) {
    return {
      ok: false,
      code: "SYNC_DISABLED",
      message: CLOUD_SYNC_DISABLED_MESSAGE,
      meta: null,
    };
  }

  return getRemoteMutationResult(`/meal-products/${bucket}`, {
    method: "POST",
    body: JSON.stringify(product),
  });
};

export const removeRemoteMealProduct = async (
  bucket: "saved" | "recent",
  productKey: string
): Promise<RemoteSyncResult> => {
  if (!isRemoteAuthMode() || !productKey) {
    return {
      ok: false,
      code: "INVALID_PRODUCT_KEY",
      message: "Meal product key is required for cloud sync.",
      meta: null,
    };
  }

  return getRemoteMutationResult(
    `/meal-products/${bucket}/${encodeURIComponent(productKey)}`,
    { method: "DELETE" }
  );
};

export const analyzeRemoteMealPhoto = async (
  imageDataUrl: string,
  mealType: string
): Promise<PhotoMealAnalysis | null> => {
  if (!isRemoteAuthMode()) {
    return null;
  }

  try {
    const { data } = await requestRemote<PhotoMealAnalysis>(
      "/photo-analysis",
      {
        method: "POST",
        body: JSON.stringify({
          imageDataUrl,
          mealType,
        }),
      },
      { requireAuth: true, timeoutMs: REMOTE_LONG_REQUEST_TIMEOUT_MS }
    );

    return data;
  } catch {
    return null;
  }
};

export const fetchRemoteAccountExport =
  async (): Promise<AccountExportPayload> => {
    const { data } = await requestRemote<AccountExportPayload>(
      "/account/export",
      { method: "GET" },
      { requireAuth: true }
    );

    if (data.snapshot) {
      writeCachedRemoteSnapshot(data.snapshot);
    }

    return data;
  };

export const listRemoteAccountBackups = async (): Promise<
  AccountBackupSummary[]
> => {
  const { data } = await requestRemote<RemoteBackupListResponse>(
    "/account/backups",
    { method: "GET" },
    { requireAuth: true }
  );

  return Array.isArray(data.items) ? data.items : [];
};

export const fetchRemoteAccountBackup = async (
  backupId: string
): Promise<AccountBackupPayload> => {
  const { data } = await requestRemote<AccountBackupPayload>(
    `/account/backups/${encodeURIComponent(backupId)}`,
    { method: "GET" },
    { requireAuth: true }
  );

  return data;
};

export const fetchRemoteTelegramStatus =
  async (): Promise<TelegramConnectionStatus> => {
    const { data } = await requestRemote<TelegramConnectionStatus>(
      "/telegram/status",
      { method: "GET" },
      { requireAuth: true }
    );

    return data;
  };

export const createRemoteTelegramConnectLink =
  async (): Promise<TelegramConnectLink> => {
    const { data } = await requestRemote<TelegramConnectLink>(
      "/telegram/connect",
      { method: "POST" },
      { requireAuth: true }
    );

    return data;
  };

export const disconnectRemoteTelegram =
  async (): Promise<TelegramConnectionStatus> => {
    const { data } = await requestRemote<TelegramConnectionStatus>(
      "/telegram/disconnect",
      { method: "POST" },
      { requireAuth: true }
    );

    return data;
  };

const mapAuthResponse = async (payload: AuthResponse, baseUrl: string) => {
  setRemoteSession(baseUrl);
  const nextSnapshot = preserveCachedCompanionState(
    payload.snapshot ?? null
  );

  if (nextSnapshot) {
    writeCachedRemoteSnapshot(nextSnapshot);
  }

  return {
    ...payload,
    token: "cookie-session",
    refreshToken: undefined,
    snapshot: nextSnapshot,
  };
};

export const remoteAuthProvider: AuthProvider = {
  restoreSession: async ({
    signal,
    timeoutMs = REMOTE_REQUEST_TIMEOUT_MS,
  } = {}) => {
    if (signal?.aborted) {
      throw new AuthApiError(
        "REMOTE_API_UNAVAILABLE",
        REMOTE_API_UNAVAILABLE_MESSAGE
      );
    }

    if (
      !getStoredRemoteBaseUrl() &&
      !(await probeRemoteBaseUrl({
        signal,
        timeoutMs: Math.min(timeoutMs, REMOTE_STARTUP_HEALTH_TIMEOUT_MS),
      }))
    ) {
      return null;
    }

    try {
      const { data, baseUrl } = await requestRemote<AuthResponse>(
        "/auth/session",
        { method: "GET", signal },
        { requireAuth: true, timeoutMs }
      );

      return mapAuthResponse(data, baseUrl);
    } catch (error) {
      if (error instanceof AuthApiError) {
        if (error.code === "REMOTE_API_UNAVAILABLE") {
          throw error;
        }

        clearRemoteSession();
        return null;
      }

      if (
        error instanceof RemoteRequestError &&
        (error.status === 401 || error.code === "INVALID_CREDENTIALS")
      ) {
        clearRemoteSession();
        return null;
      }

      throw error;
    }
  },

  logout: async () => {
    if (getStoredRemoteBaseUrl()) {
      try {
        await requestRemote(
          "/auth/logout",
          {
            method: "POST",
          },
          { requireAuth: false, allowRefresh: false }
        );
      } catch {
        // local cleanup still matters even if the request fails
      }
    }

    clearRemoteSession();
  },

  logoutEverywhere: async () => {
    if (getStoredRemoteBaseUrl()) {
      await requestRemote(
        "/auth/logout-all",
        { method: "POST" },
        { requireAuth: true }
      ).catch((error) => {
        const authError = toAuthApiError(error);
        throw authError ?? error;
      });
    }

    clearRemoteSession();
  },

  updateStoredProfile: async (user: User) => {
    const { data, baseUrl } = await requestRemote<User>(
      "/auth/profile",
      {
        method: "PATCH",
        body: JSON.stringify(user),
      },
      { requireAuth: true }
    ).catch((error) => {
      const authError = toAuthApiError(error);
      throw authError ?? error;
    });

    setRemoteSession(baseUrl);

    return data;
  },

  register: async (payload: RegisterPayload) => {
    const { data, baseUrl } = await requestRemote<RegistrationResult>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    ).catch((error) => {
      const authError = toAuthApiError(error);
      throw authError ?? error;
    });

    if (isRegistrationVerificationPending(data)) {
      rememberRemoteBaseUrl(baseUrl);
      return data;
    }

    return mapAuthResponse(data, baseUrl);
  },

  checkRegistrationAvailability: async (payload: {
    name?: string;
    email?: string;
  }) => {
    const { data } = await requestRemote<RegistrationAvailabilityResult>(
      "/auth/availability",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    ).catch((error) => {
      const authError = toAuthApiError(error);
      throw authError ?? error;
    });

    return data;
  },

  verifyRegistration: async (payload) => {
    const { data, baseUrl } = await requestRemote<AuthResponse>(
      "/auth/verify-registration",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    ).catch((error) => {
      const authError = toAuthApiError(error);
      throw authError ?? error;
    });

    return mapAuthResponse(data, baseUrl);
  },

  resendRegistrationVerification: async (payload) => {
    const { data, baseUrl } =
      await requestRemote<RegistrationVerificationPending>(
        "/auth/resend-verification",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      ).catch((error) => {
        const authError = toAuthApiError(error);
        throw authError ?? error;
      });

    rememberRemoteBaseUrl(baseUrl);
    return data;
  },

  login: async (email: string, password: string) => {
    const { data, baseUrl } = await requestRemote<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }).catch((error) => {
      const authError = toAuthApiError(error);
      throw authError ?? error;
    });

    return mapAuthResponse(data, baseUrl);
  },

  requestPasswordReset: async (email: string) => {
    const { data } = await requestRemote<PasswordResetRequestResult>(
      "/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      }
    ).catch((error) => {
      const authError = toAuthApiError(error);
      throw authError ?? error;
    });

    return data;
  },

  resetPassword: async (token: string, password: string) => {
    const { data } = await requestRemote<PasswordResetResult>(
      "/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify({ token, password }),
      }
    ).catch((error) => {
      const authError = toAuthApiError(error);
      throw authError ?? error;
    });

    return data;
  },

  deleteAccount: async (_email: string) => {
    void _email;

    await requestRemote(
      "/account",
      { method: "DELETE" },
      { requireAuth: true }
    ).catch((error) => {
      const authError = toAuthApiError(error);
      throw authError ?? error;
    });

    clearRemoteSession();
  },

  getRuntimeInfo: () => remoteRuntimeInfo,
};
