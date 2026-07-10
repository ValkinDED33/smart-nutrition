const LEGACY_KEY_PREFIXES = [
  "smart-nutrition.",
  "smart-nutrition-assistant-history:",
];
const LEGACY_DB_NAME = "smart-nutrition-client";
const DURABLE_PREFERENCE_KEYS = new Set([
  "smart-nutrition.language",
  "smart-nutrition.color-mode",
  "smart-nutrition.auth-session-hint",
  "smart-nutrition.remote-device-id",
]);

const memoryStore = new Map<string, string>();
let initialized = false;
let initializationPromise: Promise<void> | null = null;

type BrowserStorageName = "local" | "session";

const getBrowserStorage = (name: BrowserStorageName) => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storage = name === "local" ? window.localStorage : window.sessionStorage;

    return typeof Storage !== "undefined" && storage instanceof Storage
      ? storage
      : null;
  } catch {
    return null;
  }
};

const purgeLegacyBrowserStorage = (name: BrowserStorageName) => {
  const storage = getBrowserStorage(name);

  if (!storage) {
    return;
  }

  const keys: string[] = [];

  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);

      if (
        key &&
        LEGACY_KEY_PREFIXES.some((prefix) => key.startsWith(prefix)) &&
        !DURABLE_PREFERENCE_KEYS.has(key)
      ) {
        keys.push(key);
      }
    }

    keys.forEach((key) => storage.removeItem(key));
  } catch {
    // Old browser storage is best-effort cleanup only.
  }
};

const deleteLegacyDatabase = async () => {
  let indexedDbRef: IDBFactory | undefined;

  try {
    indexedDbRef = typeof indexedDB === "undefined" ? undefined : indexedDB;
  } catch {
    return;
  }

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

export const initializeClientPersistence = async () => {
  if (initialized) {
    return;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    memoryStore.clear();
    purgeLegacyBrowserStorage("local");
    purgeLegacyBrowserStorage("session");
    await deleteLegacyDatabase();
    const localStorageRef = getBrowserStorage("local");

    DURABLE_PREFERENCE_KEYS.forEach((key) => {
      const value = localStorageRef?.getItem(key);

      if (value !== null && value !== undefined) {
        memoryStore.set(key, value);
      }
    });
    initialized = true;
  })();

  return initializationPromise;
};

export const getClientStorageItem = (key: string) => memoryStore.get(key) ?? null;

export const setClientStorageItem = (key: string, value: string) => {
  memoryStore.set(key, value);

  if (DURABLE_PREFERENCE_KEYS.has(key)) {
    try {
      getBrowserStorage("local")?.setItem(key, value);
    } catch {
      // Preference persistence is best-effort; memory remains the active source.
    }
  }
};

export const removeClientStorageItem = (key: string) => {
  memoryStore.delete(key);

  if (DURABLE_PREFERENCE_KEYS.has(key)) {
    try {
      getBrowserStorage("local")?.removeItem(key);
    } catch {
      // Preference persistence is best-effort; memory removal already happened.
    }
  }
};
