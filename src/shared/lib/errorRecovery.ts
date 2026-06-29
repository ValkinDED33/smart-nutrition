export const STALE_BUILD_RECOVERY_KEY = "smart-nutrition.stale-build-recovery";
export const STALE_BUILD_RECOVERY_TTL_MS = 15_000;
export const ERROR_RECOVERY_DIAGNOSTIC_KEY =
  "smart-nutrition.error-boundary-diagnostic";

const SMART_NUTRITION_KEY_PREFIX = "smart-nutrition.";
const LEGACY_DB_NAME = "smart-nutrition-client";
const DIAGNOSTIC_TEXT_LIMIT = 180;
const DIAGNOSTIC_USER_AGENT_LIMIT = 120;
const DIAGNOSTIC_COMPONENT_STACK_LINE_LIMIT = 180;
const DIAGNOSTIC_COMPONENT_STACK_MAX_LINES = 8;

const DURABLE_RECOVERY_KEYS = new Set([
  "smart-nutrition.auth-session-hint",
  "smart-nutrition.color-mode",
  "smart-nutrition.language",
  STALE_BUILD_RECOVERY_KEY,
  ERROR_RECOVERY_DIAGNOSTIC_KEY,
]);

const staleBuildErrorPattern =
  /ChunkLoadError|Loading chunk|dynamically imported module|Importing a module script failed|Failed to fetch dynamically imported module|module script/i;

const sensitiveQueryPattern =
  /([?&](?:access_)?token|[?&]code|[?&]key|[?&]password|[?&]email)=([^&#\s)\]}>"']+)/gi;

export interface StorageLike {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

export interface ErrorRecoveryDiagnostic {
  id: string;
  createdAt: string;
  errorName: string;
  message: string;
  route: string;
  staleBuildLikely: boolean;
  userAgent?: string;
}

export interface ClientErrorRuntimeContext {
  viewport?: {
    width?: number;
    height?: number;
    devicePixelRatio?: number;
  };
  screen?: {
    width?: number;
    height?: number;
  };
  online?: boolean;
  language?: string;
  timezone?: string;
  visibilityState?: string;
  colorScheme?: "dark" | "light" | "unknown";
  reducedMotion?: boolean;
  standalone?: boolean;
  serviceWorkerControlled?: boolean;
  connection?: {
    effectiveType?: string;
    saveData?: boolean;
    downlinkMbps?: number;
    rttMs?: number;
  };
  build?: {
    mode?: string;
    baseUrl?: string;
    production?: boolean;
  };
}

export type ClientErrorReportSource =
  | "react-error-boundary"
  | "window-error"
  | "unhandled-rejection"
  | "bootstrap";

export interface ClientErrorReportPayload extends ErrorRecoveryDiagnostic {
  source: ClientErrorReportSource;
  componentStackLines: string[];
  runtimeContext?: ClientErrorRuntimeContext;
}

type BrowserStorageName = "local" | "session";

const getErrorText = (error: unknown) => {
  if (error instanceof Error) {
    return `${error.name} ${error.message} ${error.stack ?? ""}`;
  }

  return String(error);
};

const truncate = (value: string, limit: number) =>
  value.length > limit ? `${value.slice(0, limit - 1)}…` : value;

export const sanitizeDiagnosticText = (value: string) =>
  truncate(value.replace(sensitiveQueryPattern, "$1=[redacted]"), DIAGNOSTIC_TEXT_LIMIT);

const createDiagnosticId = (createdAt: string, message: string) => {
  let hash = 0;
  const input = `${createdAt}:${message}`;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return `sn-${Number.parseInt(createdAt.replace(/\D/g, "").slice(-8), 10).toString(
    36
  )}-${hash.toString(36)}`;
};

export const isLikelyStaleBuildError = (error: unknown) =>
  staleBuildErrorPattern.test(getErrorText(error));

export const shouldAttemptStaleBuildRecovery = (
  error: unknown,
  rawAttemptedAt: string | null,
  now = Date.now(),
  currentHref = ""
) =>
  isLikelyStaleBuildError(error) &&
  !hasRecoveryReloadMarker(currentHref) &&
  !isRecoveryRecentlyAttempted(rawAttemptedAt, now);

export const shouldRecoverOnManualRetry = (
  diagnostic: Pick<ErrorRecoveryDiagnostic, "staleBuildLikely"> | null
) => Boolean(diagnostic?.staleBuildLikely);

export const isRecoveryRecentlyAttempted = (
  rawValue: string | null,
  now = Date.now()
) => {
  const attemptedAt = rawValue ? Number(rawValue) : Number.NaN;

  return Number.isFinite(attemptedAt)
    ? now - attemptedAt < STALE_BUILD_RECOVERY_TTL_MS
    : rawValue !== null;
};

export const hasRecoveryReloadMarker = (currentHref: string) => {
  try {
    return new URL(currentHref).searchParams.has("sn_recovery");
  } catch {
    return false;
  }
};

export const shouldPreserveSmartNutritionStorageKey = (key: string) =>
  !key.startsWith(SMART_NUTRITION_KEY_PREFIX) || DURABLE_RECOVERY_KEYS.has(key);

export const clearVolatileSmartNutritionStorage = (storage: StorageLike) => {
  const removedKeys: string[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);

    if (key && !shouldPreserveSmartNutritionStorageKey(key)) {
      removedKeys.push(key);
    }
  }

  removedKeys.forEach((key) => storage.removeItem(key));

  return removedKeys;
};

export const buildErrorRecoveryDiagnostic = (
  error: unknown,
  route = "/",
  now = new Date(),
  userAgent?: string
): ErrorRecoveryDiagnostic => {
  const errorName = error instanceof Error ? error.name : typeof error;
  const rawMessage = error instanceof Error ? error.message : String(error);
  const message = sanitizeDiagnosticText(rawMessage);
  const createdAt = now.toISOString();

  return {
    id: createDiagnosticId(createdAt, message),
    createdAt,
    errorName: sanitizeDiagnosticText(errorName),
    message,
    route: sanitizeDiagnosticText(route),
    staleBuildLikely: isLikelyStaleBuildError(error),
    userAgent: userAgent ? truncate(userAgent, DIAGNOSTIC_USER_AGENT_LIMIT) : undefined,
  };
};

export const buildClientErrorReportPayload = (
  diagnostic: ErrorRecoveryDiagnostic,
  componentStack?: string | null,
  source: ClientErrorReportSource = "react-error-boundary",
  runtimeContext?: ClientErrorRuntimeContext
): ClientErrorReportPayload => ({
  ...diagnostic,
  source,
  componentStackLines: String(componentStack ?? "")
    .trim()
    .split("\n")
    .map((line) => sanitizeDiagnosticText(line.trim()))
    .filter(Boolean)
    .slice(0, DIAGNOSTIC_COMPONENT_STACK_MAX_LINES)
    .map((line) => truncate(line, DIAGNOSTIC_COMPONENT_STACK_LINE_LIMIT)),
  runtimeContext,
});

const getBrowserStorage = (name: BrowserStorageName): StorageLike | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const propertyName = `${name}Storage` as const;
    const storage = window[propertyName];

    return storage ?? null;
  } catch {
    return null;
  }
};

export const getSessionStorageItem = (key: string) => {
  try {
    return getBrowserStorage("session")?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

export const setSessionStorageItem = (key: string, value: string) => {
  try {
    getBrowserStorage("session")?.setItem(key, value);
  } catch {
    // Recovery must keep working in restricted mobile storage modes.
  }
};

export const removeSessionStorageItem = (key: string) => {
  try {
    getBrowserStorage("session")?.removeItem(key);
  } catch {
    // Best-effort cleanup only.
  }
};

export const persistErrorRecoveryDiagnostic = (
  diagnostic: ErrorRecoveryDiagnostic
) => {
  setSessionStorageItem(ERROR_RECOVERY_DIAGNOSTIC_KEY, JSON.stringify(diagnostic));
};

export const clearVolatileBrowserState = () => {
  clearVolatileSmartNutritionStorageFromBrowser("local");
  clearVolatileSmartNutritionStorageFromBrowser("session");
};

const clearVolatileSmartNutritionStorageFromBrowser = (name: BrowserStorageName) => {
  const storage = getBrowserStorage(name);

  if (storage) {
    clearVolatileSmartNutritionStorage(storage);
  }
};

const clearServiceWorkers = async () => {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
};

const clearOriginCaches = async () => {
  if (typeof window === "undefined" || !("caches" in window)) {
    return;
  }

  const keys = await window.caches.keys();
  await Promise.all(keys.map((key) => window.caches.delete(key)));
};

const clearLegacyDatabase = async () => {
  const indexedDbRef = globalThis.indexedDB;

  if (!indexedDbRef?.deleteDatabase) {
    return;
  }

  await new Promise<void>((resolve) => {
    try {
      const request = indexedDbRef.deleteDatabase(LEGACY_DB_NAME);

      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    } catch {
      resolve();
    }
  });
};

export const clearRuntimeCaches = async () => {
  await Promise.allSettled([
    clearServiceWorkers(),
    clearOriginCaches(),
    clearLegacyDatabase(),
  ]);
};

export const buildRecoveryReloadUrl = (
  currentHref: string,
  now = Date.now()
) => {
  try {
    const url = new URL(currentHref);
    url.searchParams.set("sn_recovery", String(now));

    return url.toString();
  } catch {
    return "/";
  }
};
