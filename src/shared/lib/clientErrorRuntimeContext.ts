import type { ClientErrorRuntimeContext } from "./errorRecovery";

type NavigatorWithConnection = Navigator & {
  connection?: {
    downlink?: number;
    effectiveType?: string;
    rtt?: number;
    saveData?: boolean;
  };
  standalone?: boolean;
};

const toFiniteNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const getMediaMatch = (query: string) => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
};

const getTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
};

export const getClientErrorRuntimeContext = (): ClientErrorRuntimeContext => {
  const navigatorRef =
    typeof navigator === "undefined" ? null : (navigator as NavigatorWithConnection);
  const connection = navigatorRef?.connection;

  return {
    viewport:
      typeof window === "undefined"
        ? undefined
        : {
            width: toFiniteNumber(window.innerWidth),
            height: toFiniteNumber(window.innerHeight),
            devicePixelRatio: toFiniteNumber(window.devicePixelRatio),
          },
    screen:
      typeof window === "undefined" || !window.screen
        ? undefined
        : {
            width: toFiniteNumber(window.screen.width),
            height: toFiniteNumber(window.screen.height),
          },
    online: navigatorRef ? navigatorRef.onLine : undefined,
    language: navigatorRef?.language,
    timezone: getTimezone(),
    visibilityState: typeof document === "undefined" ? undefined : document.visibilityState,
    colorScheme: getMediaMatch("(prefers-color-scheme: dark)")
      ? "dark"
      : typeof window === "undefined"
        ? "unknown"
        : "light",
    reducedMotion: getMediaMatch("(prefers-reduced-motion: reduce)"),
    standalone:
      getMediaMatch("(display-mode: standalone)") || navigatorRef?.standalone === true,
    serviceWorkerControlled:
      typeof navigator === "undefined" || !("serviceWorker" in navigator)
        ? undefined
        : Boolean(navigator.serviceWorker.controller),
    connection: connection
      ? {
          effectiveType: connection.effectiveType,
          saveData: connection.saveData,
          downlinkMbps: toFiniteNumber(connection.downlink),
          rttMs: toFiniteNumber(connection.rtt),
        }
      : undefined,
    build: {
      mode: import.meta.env.MODE,
      baseUrl: import.meta.env.BASE_URL,
      production: import.meta.env.PROD,
    },
  };
};
