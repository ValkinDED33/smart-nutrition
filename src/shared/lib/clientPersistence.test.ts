import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class FakeStorage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const LANGUAGE_KEY = "smart-nutrition.language";
const COLOR_MODE_KEY = "smart-nutrition.color-mode";
const AUTH_SESSION_HINT_KEY = "smart-nutrition.auth-session-hint";
const REMOTE_DEVICE_ID_KEY = "smart-nutrition.remote-device-id";
const REMOTE_SNAPSHOT_KEY = "smart-nutrition.remote-snapshot";
const ASSISTANT_HISTORY_KEY = "smart-nutrition-assistant-history:user-1";
const PRIVATE_PAYLOAD = "{ private: true }";
const SAVED_AUTH_HINT = JSON.stringify({ savedAt: 1_772_000_000_000 });

const installStorage = () => {
  const localStorage = new FakeStorage();
  const sessionStorage = new FakeStorage();

  Object.defineProperty(globalThis, "Storage", {
    configurable: true,
    value: FakeStorage,
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage,
      sessionStorage,
    },
  });

  return { localStorage, sessionStorage };
};

describe("clientPersistence", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(globalThis, "Storage");
    Reflect.deleteProperty(globalThis, "window");
  });

  it("keeps durable preferences while purging local app data", async () => {
    const { localStorage, sessionStorage } = installStorage();
    localStorage.setItem(LANGUAGE_KEY, "en");
    localStorage.setItem(COLOR_MODE_KEY, "dark");
    localStorage.setItem(AUTH_SESSION_HINT_KEY, SAVED_AUTH_HINT);
    localStorage.setItem(REMOTE_DEVICE_ID_KEY, "device-1");
    localStorage.setItem(REMOTE_SNAPSHOT_KEY, PRIVATE_PAYLOAD);
    localStorage.setItem(ASSISTANT_HISTORY_KEY, PRIVATE_PAYLOAD);
    sessionStorage.setItem(REMOTE_SNAPSHOT_KEY, PRIVATE_PAYLOAD);
    sessionStorage.setItem(ASSISTANT_HISTORY_KEY, PRIVATE_PAYLOAD);

    const persistence = await import("./clientPersistence");

    await persistence.initializeClientPersistence();

    expect(persistence.getClientStorageItem(LANGUAGE_KEY)).toBe("en");
    expect(persistence.getClientStorageItem(COLOR_MODE_KEY)).toBe("dark");
    expect(persistence.getClientStorageItem(AUTH_SESSION_HINT_KEY)).toBe(
      SAVED_AUTH_HINT
    );
    expect(persistence.getClientStorageItem(REMOTE_DEVICE_ID_KEY)).toBe("device-1");
    expect(persistence.getClientStorageItem(REMOTE_SNAPSHOT_KEY)).toBeNull();
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe("en");
    expect(localStorage.getItem(COLOR_MODE_KEY)).toBe("dark");
    expect(localStorage.getItem(AUTH_SESSION_HINT_KEY)).toBe(SAVED_AUTH_HINT);
    expect(localStorage.getItem(REMOTE_DEVICE_ID_KEY)).toBe("device-1");
    expect(localStorage.getItem(REMOTE_SNAPSHOT_KEY)).toBeNull();
    expect(localStorage.getItem(ASSISTANT_HISTORY_KEY)).toBeNull();
    expect(sessionStorage.getItem(REMOTE_SNAPSHOT_KEY)).toBeNull();
    expect(sessionStorage.getItem(ASSISTANT_HISTORY_KEY)).toBeNull();
  });

  it("persists only durable preference keys to browser storage", async () => {
    const { localStorage } = installStorage();
    const persistence = await import("./clientPersistence");

    await persistence.initializeClientPersistence();
    persistence.setClientStorageItem(LANGUAGE_KEY, "pl");
    persistence.setClientStorageItem(AUTH_SESSION_HINT_KEY, SAVED_AUTH_HINT);
    persistence.setClientStorageItem(REMOTE_DEVICE_ID_KEY, "device-1");
    persistence.setClientStorageItem(REMOTE_SNAPSHOT_KEY, PRIVATE_PAYLOAD);

    expect(persistence.getClientStorageItem(LANGUAGE_KEY)).toBe("pl");
    expect(persistence.getClientStorageItem(AUTH_SESSION_HINT_KEY)).toBe(SAVED_AUTH_HINT);
    expect(persistence.getClientStorageItem(REMOTE_DEVICE_ID_KEY)).toBe("device-1");
    expect(persistence.getClientStorageItem(REMOTE_SNAPSHOT_KEY)).toBe(PRIVATE_PAYLOAD);
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe("pl");
    expect(localStorage.getItem(AUTH_SESSION_HINT_KEY)).toBe(SAVED_AUTH_HINT);
    expect(localStorage.getItem(REMOTE_DEVICE_ID_KEY)).toBe("device-1");
    expect(localStorage.getItem(REMOTE_SNAPSHOT_KEY)).toBeNull();

    persistence.removeClientStorageItem(LANGUAGE_KEY);

    expect(persistence.getClientStorageItem(LANGUAGE_KEY)).toBeNull();
    expect(localStorage.getItem(LANGUAGE_KEY)).toBeNull();
  });

  it("does not allow legacy assistant history to become durable browser storage", async () => {
    const { localStorage } = installStorage();
    const persistence = await import("./clientPersistence");

    await persistence.initializeClientPersistence();
    persistence.setClientStorageItem(ASSISTANT_HISTORY_KEY, PRIVATE_PAYLOAD);

    expect(persistence.getClientStorageItem(ASSISTANT_HISTORY_KEY)).toBe(
      PRIVATE_PAYLOAD
    );
    expect(localStorage.getItem(ASSISTANT_HISTORY_KEY)).toBeNull();
  });

  it("keeps bootstrapping when browser storage access is blocked", async () => {
    Object.defineProperty(globalThis, "Storage", {
      configurable: true,
      value: FakeStorage,
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {},
    });
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("Storage access denied");
      },
    });
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get() {
        throw new Error("Storage access denied");
      },
    });

    const persistence = await import("./clientPersistence");

    await expect(persistence.initializeClientPersistence()).resolves.toBeUndefined();

    persistence.setClientStorageItem(LANGUAGE_KEY, "uk");

    expect(persistence.getClientStorageItem(LANGUAGE_KEY)).toBe("uk");
  });
});
