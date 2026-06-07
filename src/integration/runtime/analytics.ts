import type { PostHog } from "posthog-js";

interface PostHogConfig {
  apiHost?: string;
  key: string;
}

export type RuntimeAnalyticsEvent =
  | "screen_viewed"
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

  const config = readPostHogConfig();

  if (!config || typeof window === "undefined") {
    return null;
  }

  const { default: posthog } = await import("posthog-js");

  posthog.init(config.key, {
    api_host: config.apiHost,
    capture_pageview: false,
    autocapture: false,
  });

  posthogClient = posthog;
  return posthogClient;
};

export const captureRuntimeEvent = (
  event: RuntimeAnalyticsEvent,
  properties?: RuntimeAnalyticsProperties
) => {
  posthogClient?.capture(event, properties);
};
