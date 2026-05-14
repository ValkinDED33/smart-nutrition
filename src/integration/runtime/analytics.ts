import type { PostHog } from "posthog-js";

interface PostHogConfig {
  apiHost?: string;
  key: string;
}

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
  event: string,
  properties?: Record<string, string | number | boolean | null>
) => {
  posthogClient?.capture(event, properties);
};
