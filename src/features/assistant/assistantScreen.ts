import type { AssistantScreenContext } from "@domain/assistant/types";
import {
  resolveAssistantArea,
  type AssistantArea,
} from "./assistantManifest";

const assistantAreaToScreen: Record<
  AssistantArea,
  AssistantScreenContext["screen"]
> = {
  auth: "unknown",
  onboarding: "unknown",
  home: "dashboard",
  meals: "food",
  coach: "coach",
  progress: "progress",
  profile: "profile",
  community: "community",
  recipes: "recipes",
  water: "water",
  admin: "admin",
  unknown: "unknown",
};

export const getAssistantScreenFromPath = (
  path: string
): AssistantScreenContext["screen"] =>
  assistantAreaToScreen[resolveAssistantArea(path)];

export const createAssistantScreenContext = (
  path: string
): AssistantScreenContext => ({
  screen: getAssistantScreenFromPath(path),
  currentPath: path,
});
