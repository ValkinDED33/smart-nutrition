import type { AssistantPromptContext } from "@domain/assistant/types";
import {
  resolveAssistantContext,
  type AssistantContext,
} from "./assistantContext";

const normalizeCapability = (
  capability: AssistantContext["capabilities"][number]
): AssistantPromptContext["capabilities"][number] => ({
  id: capability.id,
  area: capability.area,
  duties: [...capability.duties],
  description: capability.description,
  entryRoute: capability.entryRoute ?? null,
});

const buildAssistantPromptContextFromContext = (
  context: AssistantContext
): AssistantPromptContext => {
  const capabilities = context.capabilities.map(normalizeCapability);
  const defaultAction = context.defaultAction
    ? {
        label: context.defaultAction.label,
        route: context.defaultAction.route,
      }
    : null;
  const dutySummary =
    context.duties.length > 0 ? context.duties.join(", ") : "no explicit duties";
  const capabilitySummary =
    capabilities.length > 0
      ? capabilities.map((capability) => capability.id).join(", ")
      : "no capabilities";

  return {
    area: context.area,
    screenName: context.screenName,
    duties: [...context.duties],
    tone: context.tone,
    capabilities,
    defaultAction,
    currentRoute: context.currentRoute,
    summary: `${context.screenName}: area=${context.area}; duties=${dutySummary}; tone=${context.tone}; capabilities=${capabilitySummary}.`,
  };
};

export const resolveAssistantPromptContext = (
  pathname: string
): AssistantPromptContext =>
  buildAssistantPromptContextFromContext(resolveAssistantContext(pathname));

export const serializeAssistantPromptContext = (
  context: AssistantPromptContext
) =>
  [
    `Screen: ${context.screenName}`,
    `Area: ${context.area}`,
    `Route: ${context.currentRoute}`,
    `Tone: ${context.tone}`,
    `Duties: ${context.duties.join(", ") || "none"}`,
    `Capabilities: ${
      context.capabilities
        .map((capability) => `${capability.id} (${capability.duties.join(", ")})`)
        .join("; ") || "none"
    }`,
    `Default action: ${
      context.defaultAction
        ? `${context.defaultAction.label} -> ${context.defaultAction.route}`
        : "none"
    }`,
  ].join("\n");
