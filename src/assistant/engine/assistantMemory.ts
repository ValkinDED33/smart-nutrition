import {
  clearAssistantConversationHistory,
  getAssistantConversationHistory,
} from "@shared/api/assistant";
import type { AssistantConversationMessage } from "@domain/assistant/types";

export interface AssistantRuntimeMemoryStore {
  loadHistory: () => Promise<AssistantConversationMessage[]>;
  clearHistory: () => Promise<boolean>;
}

export const createAssistantRuntimeMemory = ({
  loadHistory = getAssistantConversationHistory,
  clearHistory = clearAssistantConversationHistory,
}: Partial<AssistantRuntimeMemoryStore> = {}): AssistantRuntimeMemoryStore => ({
  loadHistory,
  clearHistory,
});

export const assistantRuntimeMemory = createAssistantRuntimeMemory();

export const loadAssistantConversationHistory = () =>
  assistantRuntimeMemory.loadHistory();

export const clearAssistantRuntimeMemory = () =>
  assistantRuntimeMemory.clearHistory();
