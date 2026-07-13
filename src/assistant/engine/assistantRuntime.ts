import { createAssistantRuntimeContext } from "./assistantContext";
import {
  resolveAssistantPromptContext,
  serializeAssistantPromptContext,
} from "@features/assistant/assistantPromptContext";
import {
  clearAssistantRuntimeMemory,
  loadAssistantConversationHistory,
  saveAssistantConversationHistory,
} from "./assistantMemory";
import { askAssistantRuntimeQuestion } from "./assistantGateway";
import {
  buildAssistantWelcomeMessage,
  buildGuidedAssistantReply,
  getAssistantHonestyNote,
  getAssistantModeLabel,
} from "./assistantRuntimeRules";
import type { AssistantRuntimeContext } from "@domain/assistant/types";

const getAssistantRuntimePersonality = (context: AssistantRuntimeContext) =>
  context.memory?.personality ?? context.assistantPersonality;

export {
  askAssistantRuntimeQuestion,
  buildAssistantWelcomeMessage,
  buildGuidedAssistantReply,
  clearAssistantRuntimeMemory,
  createAssistantRuntimeContext,
  getAssistantHonestyNote,
  getAssistantModeLabel,
  getAssistantRuntimePersonality,
  loadAssistantConversationHistory,
  resolveAssistantPromptContext,
  saveAssistantConversationHistory,
  serializeAssistantPromptContext,
};
