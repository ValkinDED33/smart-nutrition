import { resolveAssistantContext } from "@features/assistant/assistantContext";
import {
  resolveAssistantEmotion,
  type AssistantEmotionSignals,
} from "@features/assistant/assistantEmotion";
import {
  resolveAssistantPresence,
  type AssistantPresenceOptions,
} from "@features/assistant/assistantPresence";
import type { AssistantDefaultAction } from "@features/assistant/assistantManifest";

export const hiddenGlobalAssistantRoutePrefixes = [
  "/onboarding",
];

export const shouldHideAssistantLayer = (pathname: string) =>
  hiddenGlobalAssistantRoutePrefixes.some((prefix) => pathname.startsWith(prefix));

const normalizeRouteForComparison = (pathname: string) => {
  const normalized = pathname.trim() || "/";
  const withSlash = normalized.startsWith("/") ? normalized : `/${normalized}`;

  return withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : withSlash;
};

const publicAssistantActionRoutes = new Set([
  "/login",
  "/register",
  "/reset-password",
  "/forgot-password",
  "/verify-email",
  "/language",
]);

export const resolveGlobalAssistantDisplayAction = (
  currentRoute: string,
  defaultAction: AssistantDefaultAction | null
) => {
  if (!defaultAction) {
    return null;
  }

  const normalizedCurrentRoute = normalizeRouteForComparison(currentRoute);
  const normalizedActionRoute = normalizeRouteForComparison(defaultAction.route);
  const shouldOpenCoachInstead =
    normalizedCurrentRoute === normalizedActionRoute &&
    normalizedCurrentRoute !== "/coach" &&
    !publicAssistantActionRoutes.has(normalizedActionRoute);

  return {
    ...defaultAction,
    route: shouldOpenCoachInstead ? "/coach" : defaultAction.route,
    usesCoachFallback: shouldOpenCoachInstead,
  };
};

export const resolveGlobalAssistantLayerModel = (
  pathname: string,
  presenceOptions: Omit<AssistantPresenceOptions, "pathname">,
  emotionSignals: AssistantEmotionSignals = {}
) => {
  const assistantContext = resolveAssistantContext(pathname);
  const presence = resolveAssistantPresence(assistantContext, {
    ...presenceOptions,
    pathname,
  });
  const emotion = resolveAssistantEmotion(
    assistantContext,
    presence,
    emotionSignals
  );

  return {
    ...assistantContext,
    displayAction: resolveGlobalAssistantDisplayAction(
      assistantContext.currentRoute,
      assistantContext.defaultAction
    ),
    presence,
    emotion,
    isVisibleOnAuthenticatedRoute:
      presence.visible && presence.reason !== "public-route",
  };
};
