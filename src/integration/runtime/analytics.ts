import type { PostHog } from "posthog-js";

interface PostHogConfig {
  apiHost?: string;
  key: string;
}

export type RuntimeAnalyticsEvent =
  | "screen_viewed"
  | "brand_home_clicked"
  | "language_changed"
  | "mobile_navigation_selected"
  | "signup_started"
  | "signup_completed"
  | "login_completed"
  | "meal_added"
  | "water_added"
  | "weight_updated"
  | "global_assistant_opened"
  | "assistant_followup_clicked"
  | "assistant_navigation_handoff"
  | "onboarding_completed";

export type RuntimeAnalyticsPropertyValue =
  | string
  | number
  | boolean
  | null;

export type RuntimeAnalyticsProperties = Record<
  string,
  RuntimeAnalyticsPropertyValue
>;

let posthogClient: PostHog | null = null;
let posthogInitPromise: Promise<PostHog | null> | null = null;

export const readPostHogConfig = (): PostHogConfig | null => {
  const key = import.meta.env.VITE_POSTHOG_KEY;

  if (!key) {
    return null;
  }

  return {
    apiHost: import.meta.env.VITE_POSTHOG_HOST,
    key,
  };
};

export const initializePostHog = async () => {
  if (posthogClient) {
    return posthogClient;
  }

  if (posthogInitPromise) {
    return posthogInitPromise;
  }

  const config = readPostHogConfig();

  if (!config || typeof window === "undefined") {
    return null;
  }

  posthogInitPromise = import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(config.key, {
        api_host: config.apiHost,
        capture_pageview: false,
        autocapture: false,
      });

      posthogClient = posthog;
      return posthogClient;
    })
    .catch((error: unknown) => {
      posthogInitPromise = null;
      throw error;
    });

  return posthogInitPromise;
};

export const captureRuntimeEvent = (
  event: RuntimeAnalyticsEvent,
  properties?: RuntimeAnalyticsProperties
) => {
  posthogClient?.capture(event, properties);
};
