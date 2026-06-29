export type SafeNotificationPermission = NotificationPermission | "unsupported";

export type SafeNotificationResult = {
  ok: boolean;
  channel?: "service-worker";
  reason?:
    | "unsupported"
    | "permission-default"
    | "permission-denied"
    | "service-worker-unavailable"
    | "show-failed";
};

const SERVICE_WORKER_READY_TIMEOUT_MS = 1_500;

const getNotificationApi = (): typeof Notification | null => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }

  const notificationApi = window.Notification;

  return typeof notificationApi?.requestPermission === "function"
    ? notificationApi
    : null;
};

export const getSafeNotificationPermission = (): SafeNotificationPermission => {
  const notificationApi = getNotificationApi();

  if (!notificationApi) {
    return "unsupported";
  }

  try {
    return notificationApi.permission;
  } catch {
    return "unsupported";
  }
};

export const canUseWebNotifications = () =>
  getSafeNotificationPermission() !== "unsupported";

export const requestSafeNotificationPermission =
  async (): Promise<SafeNotificationPermission> => {
    const notificationApi = getNotificationApi();

    if (!notificationApi) {
      return "unsupported";
    }

    try {
      if (notificationApi.permission !== "default") {
        return notificationApi.permission;
      }

      return await notificationApi.requestPermission();
    } catch {
      return "unsupported";
    }
  };

const getReadyServiceWorkerRegistration =
  async (): Promise<ServiceWorkerRegistration | null> => {
    if (
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator) ||
      !navigator.serviceWorker
    ) {
      return null;
    }

    let timerId: ReturnType<typeof globalThis.setTimeout> | null = null;

    try {
      const timeout = new Promise<null>((resolve) => {
        timerId = globalThis.setTimeout(
          () => resolve(null),
          SERVICE_WORKER_READY_TIMEOUT_MS
        );
      });
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        timeout,
      ]);

      return registration && typeof registration.showNotification === "function"
        ? registration
        : null;
    } catch {
      return null;
    } finally {
      if (timerId !== null) {
        globalThis.clearTimeout(timerId);
      }
    }
  };

export const showSafeNotification = async (
  title: string,
  options: NotificationOptions = {}
): Promise<SafeNotificationResult> => {
  const permission = getSafeNotificationPermission();

  if (permission === "unsupported") {
    return { ok: false, reason: "unsupported" };
  }

  if (permission === "denied") {
    return { ok: false, reason: "permission-denied" };
  }

  if (permission !== "granted") {
    return { ok: false, reason: "permission-default" };
  }

  const registration = await getReadyServiceWorkerRegistration();

  if (!registration) {
    return { ok: false, reason: "service-worker-unavailable" };
  }

  try {
    await registration.showNotification(title, options);

    return { ok: true, channel: "service-worker" };
  } catch {
    return { ok: false, reason: "show-failed" };
  }
};
