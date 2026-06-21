import { buildAssistantPromptStack } from "./assistantPromptStack.mjs";

export const buildAssistantSystemPrompt = (context = {}) =>
  buildAssistantPromptStack(context);
