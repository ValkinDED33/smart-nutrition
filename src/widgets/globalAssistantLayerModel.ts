import { resolveAssistantContext } from "@features/assistant/assistantContext";
import {
  resolveAssistantEmotion,
  type AssistantEmotionSignals,
} from "@features/assistant/assistantEmotion";
import {
  resolveAssistantPresence,
  type AssistantPresenceOptions,
} from "@features/assistant/assistantPresence";

export const hiddenGlobalAssistantRoutePrefixes = [
  "/login",
  "/register",
  "/reset-password",
  "/forgot-password",
  "/verify-email",
  "/language",
  "/onboarding",
];

export const shouldHideAssistantLayer = (pathname: string) =>
  hiddenGlobalAssistantRoutePrefixes.some((prefix) => pathname.startsWith(prefix));

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
    presence,
    emotion,
    isVisibleOnAuthenticatedRoute:
      presence.visible && presence.reason !== "public-route",
  };
};
