import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class FakeStorage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    // Test storage mirrors the browser Storage.key(index) API.
    // eslint-disable-next-line security/detect-object-injection
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

  return { localStorage };
};

describe("remoteDevice", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(globalThis, "Storage");
    Reflect.deleteProperty(globalThis, "window");
  });

  it("persists the non-secret remote device id across client persistence boot", async () => {
    const { localStorage } = installStorage();
    const persistence = await import("./clientPersistence");
    const remoteDevice = await import("./remoteDevice");

    await persistence.initializeClientPersistence();
    const deviceId = remoteDevice.getRemoteDeviceId();

    expect(deviceId).toBeTruthy();
    expect(localStorage.getItem("smart-nutrition.remote-device-id")).toBe(deviceId);

    vi.resetModules();
    const persistenceAfterReload = await import("./clientPersistence");
    const remoteDeviceAfterReload = await import("./remoteDevice");

    await persistenceAfterReload.initializeClientPersistence();

    expect(remoteDeviceAfterReload.getRemoteDeviceId()).toBe(deviceId);
  });
});
