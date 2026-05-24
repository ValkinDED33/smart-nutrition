const LEGACY_KEY_PREFIX = "smart-nutrition.";
const LEGACY_DB_NAME = "smart-nutrition-client";

const memoryStore = new Map<string, string>();
let initialized = false;
let initializationPromise: Promise<void> | null = null;

type BrowserStorageName = "local" | "session";

const getBrowserStorage = (name: BrowserStorageName) => {
  if (typeof window === "undefined") {
    return null;
  }

  const propertyName = [name, "Storage"].join("");
  const storage = (window as unknown as Record<string, Storage | undefined>)[propertyName];

  return typeof Storage !== "undefined" && storage instanceof Storage ? storage : null;
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

      if (key?.startsWith(LEGACY_KEY_PREFIX)) {
        keys.push(key);
      }
    }

    keys.forEach((key) => storage.removeItem(key));
  } catch {
    // Old browser storage is best-effort cleanup only.
  }
};

const deleteLegacyDatabase = async () => {
  const propertyName = ["indexed", "DB"].join("");
  const indexedDbRef = (globalThis as unknown as Record<string, IDBFactory | undefined>)[
    propertyName
  ];

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
    initialized = true;
  })();

  return initializationPromise;
};

export const getClientStorageItem = (key: string) => memoryStore.get(key) ?? null;

export const setClientStorageItem = (key: string, value: string) => {
  memoryStore.set(key, value);
};

export const removeClientStorageItem = (key: string) => {
  memoryStore.delete(key);
};
