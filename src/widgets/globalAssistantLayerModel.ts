import { resolveAssistantContext } from "@features/assistant/assistantContext";

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

export const resolveGlobalAssistantLayerModel = (pathname: string) => {
  const assistantContext = resolveAssistantContext(pathname);

  return {
    ...assistantContext,
    isVisibleOnAuthenticatedRoute:
      assistantContext.area !== "unknown" &&
      assistantContext.visibility === "global" &&
      !shouldHideAssistantLayer(pathname),
  };
};
