import { createAssistantRuntimeContext } from "./assistantContext";
import {
  assistantRuntimeMemory,
  clearAssistantRuntimeMemory,
  loadAssistantConversationHistory,
  saveAssistantConversationHistory,
} from "./assistantMemory";
import {
  askAssistantRuntimeQuestion,
  assistantRuntimeGateway,
} from "./assistantGateway";
import {
  buildAssistantWelcomeMessage,
  buildGuidedAssistantReply,
  getAssistantHonestyNote,
  getAssistantModeLabel,
} from "./assistantRuntimeRules";
import type { AssistantQuestionInput, AssistantRuntimeContext } from "@domain/assistant/types";
import type { AssistantRuntimeMemoryStore } from "./assistantMemory";
import type { AssistantRuntimeGateway } from "./assistantGateway";
import type { AssistantChatMessage, AssistantContextSource } from "./assistantRuntimeTypes";

export type { AssistantChatMessage, AssistantContextSource } from "./assistantRuntimeTypes";

export interface AssistantRuntimeDependencies {
  provider?: AssistantRuntimeGateway;
  memory?: AssistantRuntimeMemoryStore;
}

export interface AssistantRuntime {
  createContext: (source: AssistantContextSource) => AssistantRuntimeContext;
  askQuestion: typeof askAssistantRuntimeQuestion;
  loadHistory: () => Promise<AssistantChatMessage[]>;
  clearHistory: () => Promise<boolean>;
  getPersonality: typeof getAssistantRuntimePersonality;
  buildWelcomeMessage: typeof buildAssistantWelcomeMessage;
  buildGuidedReply: (input: AssistantQuestionInput) => ReturnType<typeof buildGuidedAssistantReply>;
  getModeLabel: typeof getAssistantModeLabel;
  getHonestyNote: typeof getAssistantHonestyNote;
}

export const getAssistantRuntimePersonality = (context: AssistantRuntimeContext) =>
  context.memory?.personality ?? context.assistantPersonality;

export const createAssistantRuntime = ({
  provider = assistantRuntimeGateway,
  memory = assistantRuntimeMemory,
}: AssistantRuntimeDependencies = {}): AssistantRuntime => ({
  createContext: createAssistantRuntimeContext,
  askQuestion: (input) => provider.askQuestion(input),
  loadHistory: () => memory.loadHistory(),
  clearHistory: () => memory.clearHistory(),
  getPersonality: getAssistantRuntimePersonality,
  buildWelcomeMessage: buildAssistantWelcomeMessage,
  buildGuidedReply: buildGuidedAssistantReply,
  getModeLabel: getAssistantModeLabel,
  getHonestyNote: getAssistantHonestyNote,
});

export const assistantRuntime = createAssistantRuntime();

export {
  askAssistantRuntimeQuestion,
  buildAssistantWelcomeMessage,
  buildGuidedAssistantReply,
  clearAssistantRuntimeMemory,
  createAssistantRuntimeContext,
  getAssistantHonestyNote,
  getAssistantModeLabel,
  loadAssistantConversationHistory,
  saveAssistantConversationHistory,
};
