import { createAssistantRuntimeContext } from "./assistantContext";
import {
  assistantRuntimeMemory,
  clearAssistantRuntimeMemory,
  loadAssistantConversationHistory,
} from "./assistantMemory";
import {
  askAssistantRuntimeQuestion,
  assistantRuntimeGateway,
} from "./assistantGateway";
import {
  buildAssistantWelcomeMessage,
  buildLocalAssistantReply,
  getAssistantHonestyNote,
  getAssistantModeLabel,
} from "./assistantRules";
import type { AssistantQuestionInput, AssistantRuntimeContext } from "../../types/assistant";
import type { AssistantRuntimeMemoryStore } from "./assistantMemory";
import type { AssistantRuntimeGateway } from "./assistantGateway";
import type { AssistantChatMessage, AssistantContextSource } from "./assistantTypes";

export type { AssistantChatMessage, AssistantContextSource } from "./assistantTypes";

export interface AssistantRuntimeDependencies {
  provider?: AssistantRuntimeGateway;
  memory?: AssistantRuntimeMemoryStore;
}

export interface AssistantRuntime {
  createContext: (source: AssistantContextSource) => AssistantRuntimeContext;
  askQuestion: typeof askAssistantRuntimeQuestion;
  loadHistory: () => Promise<AssistantChatMessage[]>;
  clearHistory: () => Promise<boolean>;
  buildWelcomeMessage: typeof buildAssistantWelcomeMessage;
  buildLocalReply: (input: AssistantQuestionInput) => ReturnType<typeof buildLocalAssistantReply>;
  getModeLabel: typeof getAssistantModeLabel;
  getHonestyNote: typeof getAssistantHonestyNote;
}

export const createAssistantRuntime = ({
  provider = assistantRuntimeGateway,
  memory = assistantRuntimeMemory,
}: AssistantRuntimeDependencies = {}): AssistantRuntime => ({
  createContext: createAssistantRuntimeContext,
  askQuestion: (input) => provider.askQuestion(input),
  loadHistory: () => memory.loadHistory(),
  clearHistory: () => memory.clearHistory(),
  buildWelcomeMessage: buildAssistantWelcomeMessage,
  buildLocalReply: buildLocalAssistantReply,
  getModeLabel: getAssistantModeLabel,
  getHonestyNote: getAssistantHonestyNote,
});

export const assistantRuntime = createAssistantRuntime();

export {
  askAssistantRuntimeQuestion,
  buildAssistantWelcomeMessage,
  buildLocalAssistantReply,
  clearAssistantRuntimeMemory,
  createAssistantRuntimeContext,
  getAssistantHonestyNote,
  getAssistantModeLabel,
  loadAssistantConversationHistory,
};
