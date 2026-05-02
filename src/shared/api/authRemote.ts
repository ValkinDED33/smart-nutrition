import type { AuthResponse, User } from "../types/user";
import type { AppSnapshot, AppSnapshotMeta } from "../types/appSnapshot";
import type { MealEntry, MealTemplate } from "../types/meal";
import type { PhotoMealAnalysis } from "../types/photo";
import type { Product } from "../types/product";
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
import type {
  AccountBackupPayload,
  AccountBackupSummary,
  AccountExportPayload,
  AuthProvider,
  AuthRuntimeInfo,
  PasswordResetRequestResult,
  PasswordResetResult,
  RegisterPayload,
} from "./authProvider";
import { AuthApiError } from "./authLocal";

type AuthMode = "local-browser" | "remote-cloud";

export interface RemoteSyncResult {
  ok: boolean;
  message?: string;
  code?: string;
  meta?: AppSnapshotMeta | null;
}

interface RemoteMutationResponse {
  ok: true;
  meta: AppSnapshotMeta | null;
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

const AUTH_MODE_KEY = "smart-nutrition.auth-mode";
const REMOTE_BASE_URL_KEY = "smart-nutrition.remote-base-url";
const REMOTE_USER_KEY = "smart-nutrition.remote-user";

const remoteRuntimeInfo: AuthRuntimeInfo = {
  mode: "remote-cloud",
  providerLabel: "Remote API account",
  sessionLabel: "Secure cookie session",
  syncLabel:
    "Profile, meal, water, fridge, and community changes are synchronized through remote state endpoints.",
  securityLabel:
    "Authentication relies on httpOnly cookie sessions, so tokens are never exposed to client-side JavaScript.",
  supportsCloudSync: true,
  supportsAccountDeletion: true,
  supportsDataExport: true,
  supportsSessionRevocation: true,
};

let remoteBaseProbePromise: Promise<string | null> | null = null;
let remoteRefreshPromise: Promise<void> | null = null;

const loopbackHostnames = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

const dedupe = (values: string[]) => [...new Set(values.filter(Boolean))];

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

const isLocalBrowserHost = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return loopbackHostnames.has(window.location.hostname);
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
  isLocalBrowserHost() || !isLoopbackBaseUrl(value);

const getConfiguredRemoteBaseUrl = () => {
  const configuredBaseUrl = normalizeRemoteBaseUrl(
    import.meta.env.VITE_SMART_NUTRITION_API_BASE_URL
  );

  if (!configuredBaseUrl || !canUseRemoteBaseUrlInCurrentBrowser(configuredBaseUrl)) {
    return null;
  }

  return configuredBaseUrl;
};

const shouldProbeSameOriginApi = () => {
  if (typeof window === "undefined" || !window.location.origin.startsWith("http")) {
    return false;
  }

  return isLocalBrowserHost() || !window.location.hostname.endsWith(".vercel.app");
};

const getStoredAuthMode = (): AuthMode =>
  getClientStorageItem(AUTH_MODE_KEY) === "remote-cloud"
    ? "remote-cloud"
    : "local-browser";

const setStoredAuthMode = (mode: AuthMode) => {
  setClientStorageItem(AUTH_MODE_KEY, mode);
};

const getStoredRemoteBaseUrl = () => {
  const storedBaseUrl = normalizeRemoteBaseUrl(getClientStorageItem(REMOTE_BASE_URL_KEY));

  if (!storedBaseUrl) {
    return null;
  }

  if (!canUseRemoteBaseUrlInCurrentBrowser(storedBaseUrl)) {
    return null;
  }

  return storedBaseUrl;
};

const getStoredRemoteUser = (): User | null => {
  const raw = getClientStorageItem(REMOTE_USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

const setStoredRemoteUser = (user: User) => {
  setClientStorageItem(REMOTE_USER_KEY, JSON.stringify(user));
};

const setRemoteSession = (baseUrl: string, user: User) => {
  setClientStorageItem(REMOTE_BASE_URL_KEY, baseUrl);
  setStoredRemoteUser(user);
  setStoredAuthMode("remote-cloud");
};

const clearRemoteSession = () => {
  removeClientStorageItem(REMOTE_BASE_URL_KEY);
  removeClientStorageItem(REMOTE_USER_KEY);
  clearCachedRemoteState();
  setStoredAuthMode("local-browser");
};

const readJsonResponse = async <T,>(response: Response) => {
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

    if (error.code === "TOO_MANY_ATTEMPTS") {
      return new AuthApiError("TOO_MANY_ATTEMPTS", error.message);
    }

    if (error.code === "INVALID_RESET_TOKEN") {
      return new AuthApiError("INVALID_RESET_TOKEN", error.message);
    }

    if (error.code === "EMAIL_DELIVERY_UNAVAILABLE") {
      return new AuthApiError("EMAIL_DELIVERY_UNAVAILABLE", error.message);
    }

    if (error.code === "WEAK_PASSWORD") {
      return new AuthApiError("WEAK_PASSWORD", error.message);
    }

    if (error.code === "INVALID_PROFILE") {
      return new AuthApiError("INVALID_PROFILE", error.message);
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
    const response = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const authError = toAuthApiError(await toRemoteRequestError(response));

      if (authError) {
        clearRemoteSession();
        throw authError;
      }

      throw new Error("Remote refresh request failed.");
    }

    const payload = await readJsonResponse<AuthResponse>(response);
    setRemoteSession(baseUrl, payload.user);

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
    (await probeRemoteBaseUrl(true));

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

  if (shouldProbeSameOriginApi()) {
    candidates.push(`${window.location.origin}/api`);
  }

  return dedupe(candidates.filter((value): value is string => Boolean(value)));
};

const isRemoteHealthPayload = (value: unknown) =>
  typeof value === "object" &&
  value !== null &&
  "ok" in value &&
  (value as { ok?: unknown }).ok === true &&
  "provider" in value &&
  (value as { provider?: unknown }).provider === "smart-nutrition-sqlite-api";

const probeRemoteBaseUrl = async (force = false): Promise<string | null> => {
  if (!force && remoteBaseProbePromise) {
    return remoteBaseProbePromise;
  }

  remoteBaseProbePromise = (async () => {
    for (const baseUrl of getCandidateBaseUrls()) {
      try {
        const response = await fetch(`${baseUrl}/health`, {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "include",
        });

        if (response.ok && isRemoteHealthPayload(await readJsonResponse<unknown>(response))) {
          return baseUrl;
        }
      } catch {
        continue;
      }
    }

    return null;
  })();

  const baseUrl = await remoteBaseProbePromise;

  if (!baseUrl) {
    remoteBaseProbePromise = null;
  }

  return baseUrl;
};

const requestRemote = async <T,>(
  path: string,
  init: RequestInit = {},
  {
    requireAuth = false,
    allowRefresh = true,
    withSyncContext = false,
  }: { requireAuth?: boolean; allowRefresh?: boolean; withSyncContext?: boolean } = {}
): Promise<{ data: T; baseUrl: string }> => {
  const baseUrl =
    getStoredRemoteBaseUrl() ??
    (await probeRemoteBaseUrl()) ??
    (await probeRemoteBaseUrl(true));

  if (!baseUrl) {
    throw new Error("Remote auth server is not available.");
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const performRequest = async () => {
    const nextHeaders = new Headers(headers);

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

    return fetch(`${baseUrl}${path}`, {
      ...init,
      headers: nextHeaders,
      credentials: "include",
    });
  };

  let response = await performRequest();

  if (response.status === 401 && requireAuth && allowRefresh) {
    try {
      await refreshRemoteAccessToken(baseUrl);
      response = await performRequest();
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

const getOfflineSessionPayload = (): AuthResponse | null => {
  const cachedUser = getStoredRemoteUser();

  if (!cachedUser) {
    return null;
  }

  return {
    user: cachedUser,
    token: "cookie-session",
    snapshot: readCachedRemoteSnapshot(),
  };
};

export const checkRemoteBackendAvailability = async (force = false) =>
  Boolean(await probeRemoteBaseUrl(force));

export const isRemoteAuthAvailable = async () => checkRemoteBackendAvailability();

export const isRemoteAuthMode = () =>
  getStoredAuthMode() === "remote-cloud" && Boolean(getStoredRemoteUser());

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

    writeCachedRemoteSnapshot(data);
    return data;
  } catch {
    return preferCache ? readCachedRemoteSnapshot() : null;
  }
};

const loadRemoteAppState = async (): Promise<AppSnapshot | null> => fetchRemoteAppState();

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

    return {
      ok: true,
      meta: data.meta,
    };
  } catch (error) {
    return toRemoteSyncResult(error);
  }
};

export const pushRemoteProfileState = async (profile: unknown): Promise<RemoteSyncResult> => {
  if (!isRemoteAuthMode()) {
    return {
      ok: false,
      code: "SYNC_DISABLED",
      message: "Cloud sync is not active for this account.",
      meta: null,
    };
  }

  return getRemoteMutationResult("/profile-state", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
};

export const pushRemoteMealState = async (meal: unknown): Promise<RemoteSyncResult> => {
  if (!isRemoteAuthMode()) {
    return {
      ok: false,
      code: "SYNC_DISABLED",
      message: "Cloud sync is not active for this account.",
      meta: null,
    };
  }

  return getRemoteMutationResult("/meal-state", {
    method: "PUT",
    body: JSON.stringify(meal),
  });
};

export const pushRemoteWaterState = async (water: unknown): Promise<RemoteSyncResult> => {
  if (!isRemoteAuthMode()) {
    return {
      ok: false,
      code: "SYNC_DISABLED",
      message: "Cloud sync is not active for this account.",
      meta: null,
    };
  }

  return getRemoteMutationResult("/water-state", {
    method: "PUT",
    body: JSON.stringify(water),
  });
};

export const pushRemoteFridgeState = async (fridge: unknown): Promise<RemoteSyncResult> => {
  if (!isRemoteAuthMode()) {
    return {
      ok: false,
      code: "SYNC_DISABLED",
      message: "Cloud sync is not active for this account.",
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
      message: "Cloud sync is not active for this account.",
      meta: null,
    };
  }

  return getRemoteMutationResult("/community-state", {
    method: "PUT",
    body: JSON.stringify(community),
  });
};

export const addRemoteMealEntries = async (entries: MealEntry[]): Promise<RemoteSyncResult> => {
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

export const removeRemoteMealEntry = async (entryId: string): Promise<RemoteSyncResult> => {
  if (!isRemoteAuthMode() || !entryId) {
    return {
      ok: false,
      code: "INVALID_ENTRY_ID",
      message: "Meal entry id is required for cloud sync.",
      meta: null,
    };
  }

  return getRemoteMutationResult(`/meal-entries/${encodeURIComponent(entryId)}`, {
    method: "DELETE",
  });
};

export const addRemoteMealTemplate = async (
  template: MealTemplate
): Promise<RemoteSyncResult> => {
  if (!isRemoteAuthMode()) {
    return {
      ok: false,
      code: "SYNC_DISABLED",
      message: "Cloud sync is not active for this account.",
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

  return getRemoteMutationResult(`/meal-templates/${encodeURIComponent(templateId)}`, {
    method: "DELETE",
  });
};

export const upsertRemoteMealProduct = async (
  bucket: "saved" | "recent",
  product: Product
): Promise<RemoteSyncResult> => {
  if (!isRemoteAuthMode()) {
    return {
      ok: false,
      code: "SYNC_DISABLED",
      message: "Cloud sync is not active for this account.",
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
      { requireAuth: true }
    );

    return data;
  } catch {
    return null;
  }
};

export const fetchRemoteAccountExport = async (): Promise<AccountExportPayload> => {
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

export const listRemoteAccountBackups = async (): Promise<AccountBackupSummary[]> => {
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

const mapAuthResponse = async (payload: AuthResponse, baseUrl: string) => {
  setRemoteSession(baseUrl, payload.user);
  const granularSnapshot = await loadRemoteAppState();
  const nextSnapshot = granularSnapshot ?? payload.snapshot ?? null;

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
  restoreSession: async () => {
    if (!isRemoteAuthMode() && !getStoredRemoteBaseUrl()) {
      return null;
    }

    try {
      const { data, baseUrl } = await requestRemote<AuthResponse>(
        "/auth/session",
        { method: "GET" },
        { requireAuth: true }
      );

      return mapAuthResponse(data, baseUrl);
    } catch (error) {
      if (
        error instanceof AuthApiError ||
        (error instanceof RemoteRequestError &&
          (error.status === 401 || error.code === "INVALID_CREDENTIALS"))
      ) {
        clearRemoteSession();
        return null;
      }

      return getOfflineSessionPayload();
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

    setRemoteSession(baseUrl, data);

    return data;
  },

  register: async (payload: RegisterPayload) => {
    const { data, baseUrl } = await requestRemote<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }).catch((error) => {
      const authError = toAuthApiError(error);
      throw authError ?? error;
    });

    return mapAuthResponse(data, baseUrl);
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
    const { data } = await requestRemote<PasswordResetResult>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }).catch((error) => {
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
