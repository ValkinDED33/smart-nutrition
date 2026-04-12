import {
  clearAssistantConversationHistory,
  getAssistantConversationHistory,
} from "../../api/assistant";
import type { AssistantConversationMessage } from "../../types/assistant";

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
