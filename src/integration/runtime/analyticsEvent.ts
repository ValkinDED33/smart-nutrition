import type {
  RuntimeAnalyticsEvent,
  RuntimeAnalyticsProperties,
} from "./analytics";

let analyticsModulePromise: Promise<typeof import("./analytics")> | null = null;

const loadAnalyticsModule = () => {
  analyticsModulePromise ??= import("./analytics");

  return analyticsModulePromise;
};

export const trackRuntimeEvent = (
  event: RuntimeAnalyticsEvent,
  properties?: RuntimeAnalyticsProperties
) => {
  if (typeof window === "undefined") {
    return;
  }

  void loadAnalyticsModule()
    .then(async ({ captureRuntimeEvent, initializePostHog }) => {
      const client = await initializePostHog();

      if (!client) {
        return;
      }

      captureRuntimeEvent(event, properties);
    })
    .catch((error: unknown) => {
      console.warn(
        "[analytics] event capture skipped",
        error instanceof Error ? error.message : "unknown error"
      );
    });
};
