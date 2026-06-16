import type { AssistantContext } from "./assistantContext";

export type AssistantViewport = "mobile" | "tablet" | "desktop";

export type AssistantRouteKind = "public" | "auth" | "onboarding" | "unknown";

export type AssistantPresenceMode = "hidden" | "compact" | "bubble" | "coach";

export type AssistantPresencePriority = "low" | "normal" | "high";

export interface AssistantPresenceOptions {
  pathname: string;
  viewport: AssistantViewport;
  inputFocused?: boolean;
  routeKind?: AssistantRouteKind;
  prefersReducedMotion?: boolean;
}

export interface AssistantPresence {
  visible: boolean;
  mode: AssistantPresenceMode;
  reason: string;
  allowSpeechBubble: boolean;
  allowMotion: boolean;
  priority: AssistantPresencePriority;
}

const mobileDenseAssistantAreas = new Set([
  "meals",
  "coach",
  "progress",
  "profile",
  "community",
  "recipes",
  "water",
]);

const publicRoutePrefixes = [
  "/login",
  "/register",
  "/reset-password",
  "/forgot-password",
  "/verify-email",
  "/language",
];

const normalizePathname = (pathname: string) => {
  const normalized = pathname.trim() || "/";

  return normalized.startsWith("/") ? normalized : `/${normalized}`;
};

const matchesRoutePrefix = (pathname: string, prefix: string) =>
  prefix === "/" ? pathname === "/" : pathname.startsWith(prefix);

export const resolveAssistantRouteKind = (
  pathname: string
): AssistantRouteKind => {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname.startsWith("/onboarding")) {
    return "onboarding";
  }

  if (
    publicRoutePrefixes.some((prefix) =>
      matchesRoutePrefix(normalizedPathname, prefix)
    )
  ) {
    return "public";
  }

  return "auth";
};

const hiddenPresence = (
  reason: string,
  prefersReducedMotion = false
): AssistantPresence => ({
  visible: false,
  mode: "hidden",
  reason,
  allowSpeechBubble: false,
  allowMotion: !prefersReducedMotion,
  priority: "low",
});

const compactPresence = ({
  reason,
  prefersReducedMotion,
  priority = "normal",
}: {
  reason: string;
  prefersReducedMotion: boolean;
  priority?: AssistantPresencePriority;
}): AssistantPresence => ({
  visible: true,
  mode: "compact",
  reason,
  allowSpeechBubble: false,
  allowMotion: !prefersReducedMotion,
  priority,
});

export const resolveAssistantPresence = (
  context: AssistantContext,
  options: AssistantPresenceOptions
): AssistantPresence => {
  const pathname = normalizePathname(options.pathname);
  const routeKind = options.routeKind ?? resolveAssistantRouteKind(pathname);
  const inputFocused = Boolean(options.inputFocused);
  const prefersReducedMotion = Boolean(options.prefersReducedMotion);

  if (routeKind === "public") {
    if (inputFocused && options.viewport === "mobile") {
      return hiddenPresence("mobile-public-input-focused", prefersReducedMotion);
    }

    return compactPresence({
      reason: "public-route",
      prefersReducedMotion,
      priority: "low",
    });
  }

  if (routeKind === "onboarding" || context.visibility === "onboarding") {
    return hiddenPresence("onboarding-guide-handles-assistant", prefersReducedMotion);
  }

  if (context.area === "unknown" || context.visibility === "hidden") {
    return hiddenPresence("no-global-assistant-context", prefersReducedMotion);
  }

  if (context.visibility !== "global") {
    return hiddenPresence("assistant-not-global-for-route", prefersReducedMotion);
  }

  if (inputFocused && options.viewport === "mobile") {
    return hiddenPresence("mobile-input-focused", prefersReducedMotion);
  }

  if (inputFocused) {
    return compactPresence({
      reason: "input-focused",
      prefersReducedMotion,
      priority: "low",
    });
  }

  if (
    (options.viewport === "mobile" || options.viewport === "tablet") &&
    mobileDenseAssistantAreas.has(context.area)
  ) {
    return compactPresence({
      reason: "compact-dense-surface",
      prefersReducedMotion,
      priority: "low",
    });
  }

  if (options.viewport === "mobile") {
    return compactPresence({
      reason: "mobile-viewport",
      prefersReducedMotion,
      priority: "normal",
    });
  }

  if (options.viewport === "tablet") {
    return compactPresence({
      reason: "tablet-viewport",
      prefersReducedMotion,
      priority: "normal",
    });
  }

  if (context.area === "profile") {
    return compactPresence({
      reason: "profile-interactive-surface",
      prefersReducedMotion,
      priority: "normal",
    });
  }

  if (context.area === "community") {
    return compactPresence({
      reason: "community-content-surface",
      prefersReducedMotion,
      priority: "normal",
    });
  }

  if (context.area === "meals") {
    return compactPresence({
      reason: "meals-dense-input-surface",
      prefersReducedMotion,
      priority: "normal",
    });
  }

  if (context.area === "progress") {
    return compactPresence({
      reason: "progress-chart-surface",
      prefersReducedMotion,
      priority: "normal",
    });
  }

  if (context.area === "recipes") {
    return compactPresence({
      reason: "recipes-content-surface",
      prefersReducedMotion,
      priority: "normal",
    });
  }

  if (context.area === "water") {
    return compactPresence({
      reason: "water-check-in-surface",
      prefersReducedMotion,
      priority: "normal",
    });
  }

  if (context.area === "coach") {
    return {
      visible: true,
      mode: "coach",
      reason: "coach-route",
      allowSpeechBubble: true,
      allowMotion: !prefersReducedMotion,
      priority: "high",
    };
  }

  return {
    visible: true,
    mode: "bubble",
    reason: "desktop-authenticated-route",
    allowSpeechBubble: true,
    allowMotion: !prefersReducedMotion,
    priority: context.tone === "urgent" ? "high" : "normal",
  };
};
