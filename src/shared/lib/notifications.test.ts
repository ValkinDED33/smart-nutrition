import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canUseWebNotifications,
  getSafeNotificationPermission,
  requestSafeNotificationPermission,
  showSafeNotification,
} from "./notifications";

const stubNotificationApi = (
  permission: NotificationPermission,
  requestPermission = vi.fn(async () => permission)
) => {
  const notificationApi = {
    permission,
    requestPermission,
  };

  vi.stubGlobal("window", { Notification: notificationApi });
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("safe notification runtime", () => {
  it("reports unsupported when the runtime has no Notification API", () => {
    vi.stubGlobal("window", {});

    expect(canUseWebNotifications()).toBe(false);
    expect(getSafeNotificationPermission()).toBe("unsupported");
  });

  it("requests permission only when the current state is default", async () => {
    const requestPermission = vi.fn().mockResolvedValue("granted");
    stubNotificationApi("default", requestPermission);

    await expect(requestSafeNotificationPermission()).resolves.toBe("granted");
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });

  it("does not throw when permission is granted but no service worker is ready", async () => {
    stubNotificationApi("granted");

    await expect(showSafeNotification("Water reminder")).resolves.toEqual({
      ok: false,
      reason: "service-worker-unavailable",
    });
  });

  it("uses ServiceWorkerRegistration.showNotification when available", async () => {
    const showNotification = vi.fn().mockResolvedValue(undefined);
    stubNotificationApi("granted");
    vi.stubGlobal("navigator", {
      serviceWorker: {
        ready: Promise.resolve({ showNotification }),
      },
    });

    await expect(
      showSafeNotification("Meal reminder", { body: "Lunch is due" })
    ).resolves.toEqual({
      ok: true,
      channel: "service-worker",
    });
    expect(showNotification).toHaveBeenCalledWith("Meal reminder", {
      body: "Lunch is due",
    });
  });

  it("returns a safe failure when the service worker notification call fails", async () => {
    stubNotificationApi("granted");
    vi.stubGlobal("navigator", {
      serviceWorker: {
        ready: Promise.resolve({
          showNotification: vi.fn().mockRejectedValue(new Error("blocked")),
        }),
      },
    });

    await expect(showSafeNotification("Reminder")).resolves.toEqual({
      ok: false,
      reason: "show-failed",
    });
  });

  it("does not request notifications when the user already denied permission", async () => {
    const requestPermission = vi.fn().mockResolvedValue("granted");
    stubNotificationApi("denied", requestPermission);

    await expect(requestSafeNotificationPermission()).resolves.toBe("denied");
    expect(requestPermission).not.toHaveBeenCalled();
  });
});
