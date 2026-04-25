const DB_NAME = "smart-nutrition-client";
const STORE_NAME = "kv";
const LEGACY_KEY_PREFIX = "smart-nutrition.";

const memoryStore = new Map<string, string>();
let initialized = false;
let initializationPromise: Promise<void> | null = null;
let databasePromise: Promise<IDBDatabase | null> | null = null;

type PersistOperation =
  | { type: "set"; key: string; value: string }
  | { type: "remove"; key: string };

const openDatabase = () => {
  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = new Promise<IDBDatabase | null>((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });

  return databasePromise;
};

const withStore = async <T,>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => Promise<T> | T
) => {
  const database = await openDatabase();

  if (!database) {
    return null as T | null;
  }

  const transaction = database.transaction(STORE_NAME, mode);
  const store = transaction.objectStore(STORE_NAME);

  return handler(store);
};

const readAllEntries = async () => {
  const entries = await withStore<Map<string, string>>("readonly", (store) => {
    return new Promise<Map<string, string>>((resolve) => {
      const nextMap = new Map<string, string>();
      const request = store.openCursor();

      request.onsuccess = () => {
        const cursor = request.result;

        if (!cursor) {
          resolve(nextMap);
          return;
        }

        if (typeof cursor.key === "string" && typeof cursor.value === "string") {
          nextMap.set(cursor.key, cursor.value);
        }

        cursor.continue();
      };

      request.onerror = () => {
        resolve(nextMap);
      };
    });
  });

  return entries ?? new Map<string, string>();
};

const flushOperation = async (operation: PersistOperation) => {
  await withStore("readwrite", (store) => {
    return new Promise<void>((resolve) => {
      const request =
        operation.type === "set"
          ? store.put(operation.value, operation.key)
          : store.delete(operation.key);

      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  });
};

const migrateLegacyLocalStorage = async () => {
  if (typeof window === "undefined") {
    return;
  }

  const legacyKeys: string[] = [];

  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);

      if (key?.startsWith(LEGACY_KEY_PREFIX)) {
        legacyKeys.push(key);
      }
    }
  } catch {
    return;
  }

  if (legacyKeys.length === 0) {
    return;
  }

  await Promise.all(
    legacyKeys.map(async (key) => {
      const value = window.localStorage.getItem(key);

      if (typeof value === "string") {
        memoryStore.set(key, value);
        await flushOperation({ type: "set", key, value });
      }

      window.localStorage.removeItem(key);
    })
  );
};

export const initializeClientPersistence = async () => {
  if (initialized) {
    return;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    const entries = await readAllEntries();
    memoryStore.clear();
    entries.forEach((value, key) => {
      memoryStore.set(key, value);
    });
    await migrateLegacyLocalStorage();
    initialized = true;
  })();

  return initializationPromise;
};

const schedulePersist = (operation: PersistOperation) => {
  void flushOperation(operation);
};

export const getClientStorageItem = (key: string) => memoryStore.get(key) ?? null;

export const setClientStorageItem = (key: string, value: string) => {
  memoryStore.set(key, value);
  schedulePersist({ type: "set", key, value });
};

export const removeClientStorageItem = (key: string) => {
  memoryStore.delete(key);
  schedulePersist({ type: "remove", key });
};

export const createIndexedDbPersistStorage = () => ({
  getItem: (key: string) => Promise.resolve(getClientStorageItem(key)),
  setItem: (key: string, value: string) => {
    setClientStorageItem(key, value);
    return Promise.resolve(value);
  },
  removeItem: (key: string) => {
    removeClientStorageItem(key);
    return Promise.resolve();
  },
});
