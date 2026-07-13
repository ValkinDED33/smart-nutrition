import { resolveAssistantContext } from "@features/assistant/assistantContext";
import {
  resolveAssistantEmotion,
  type AssistantEmotionSignals,
} from "@features/assistant/assistantEmotion";
import {
  resolveAssistantPresence,
  type AssistantPresenceOptions,
  type AssistantViewport,
} from "@features/assistant/assistantPresence";
import type { AssistantDefaultAction } from "@features/assistant/assistantManifest";

const hiddenGlobalAssistantRoutePrefixes = [
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

export const resolveGlobalAssistantAvatarRenderMode = ({
  presenceMode,
  inputFocused = false,
}: {
  viewport: AssistantViewport;
  presenceMode: ReturnType<typeof resolveAssistantPresence>["mode"];
  inputFocused?: boolean;
}): "2d" => {
  if (presenceMode === "hidden" || inputFocused) {
    return "2d";
  }

  return "2d";
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
    avatarRenderMode: resolveGlobalAssistantAvatarRenderMode({
      viewport: presenceOptions.viewport,
      presenceMode: presence.mode,
      inputFocused: presenceOptions.inputFocused,
    }),
    isVisibleOnAuthenticatedRoute:
      presence.visible && presence.reason !== "public-route",
  };
};
