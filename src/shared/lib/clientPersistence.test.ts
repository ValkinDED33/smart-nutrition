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
    localStorage.setItem("smart-nutrition.language", "en");
    localStorage.setItem("smart-nutrition.color-mode", "dark");
    localStorage.setItem(
      "smart-nutrition.auth-session-hint",
      JSON.stringify({ savedAt: 1_772_000_000_000 })
    );
    localStorage.setItem("smart-nutrition.remote-snapshot", "{ private: true }");
    sessionStorage.setItem("smart-nutrition.remote-snapshot", "{ private: true }");

    const persistence = await import("./clientPersistence");

    await persistence.initializeClientPersistence();

    expect(persistence.getClientStorageItem("smart-nutrition.language")).toBe("en");
    expect(persistence.getClientStorageItem("smart-nutrition.color-mode")).toBe("dark");
    expect(persistence.getClientStorageItem("smart-nutrition.auth-session-hint")).toBe(
      JSON.stringify({ savedAt: 1_772_000_000_000 })
    );
    expect(persistence.getClientStorageItem("smart-nutrition.remote-snapshot")).toBeNull();
    expect(localStorage.getItem("smart-nutrition.language")).toBe("en");
    expect(localStorage.getItem("smart-nutrition.color-mode")).toBe("dark");
    expect(localStorage.getItem("smart-nutrition.auth-session-hint")).toBe(
      JSON.stringify({ savedAt: 1_772_000_000_000 })
    );
    expect(localStorage.getItem("smart-nutrition.remote-snapshot")).toBeNull();
    expect(sessionStorage.getItem("smart-nutrition.remote-snapshot")).toBeNull();
  });

  it("persists only durable preference keys to browser storage", async () => {
    const { localStorage } = installStorage();
    const persistence = await import("./clientPersistence");

    await persistence.initializeClientPersistence();
    persistence.setClientStorageItem("smart-nutrition.language", "pl");
    persistence.setClientStorageItem(
      "smart-nutrition.auth-session-hint",
      JSON.stringify({ savedAt: 1_772_000_000_000 })
    );
    persistence.setClientStorageItem("smart-nutrition.remote-snapshot", "{ private: true }");

    expect(persistence.getClientStorageItem("smart-nutrition.language")).toBe("pl");
    expect(persistence.getClientStorageItem("smart-nutrition.auth-session-hint")).toBe(
      JSON.stringify({ savedAt: 1_772_000_000_000 })
    );
    expect(persistence.getClientStorageItem("smart-nutrition.remote-snapshot")).toBe(
      "{ private: true }"
    );
    expect(localStorage.getItem("smart-nutrition.language")).toBe("pl");
    expect(localStorage.getItem("smart-nutrition.auth-session-hint")).toBe(
      JSON.stringify({ savedAt: 1_772_000_000_000 })
    );
    expect(localStorage.getItem("smart-nutrition.remote-snapshot")).toBeNull();

    persistence.removeClientStorageItem("smart-nutrition.language");

    expect(persistence.getClientStorageItem("smart-nutrition.language")).toBeNull();
    expect(localStorage.getItem("smart-nutrition.language")).toBeNull();
  });
});
