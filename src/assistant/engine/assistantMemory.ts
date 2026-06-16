import {
  clearAssistantConversationHistory,
  getAssistantConversationHistory,
} from "@shared/api/assistant";
import type { AssistantConversationMessage } from "@domain/assistant/types";

export interface AssistantRuntimeMemoryStore {
  loadHistory: (userId?: string | null) => Promise<AssistantConversationMessage[]>;
  saveHistory: (
    messages: AssistantConversationMessage[],
    userId?: string | null
  ) => Promise<boolean>;
  clearHistory: (userId?: string | null) => Promise<boolean>;
}

const LOCAL_HISTORY_PREFIX = "smart-nutrition-assistant-history:";

const clearLocalHistory = (userId?: string | null) => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.removeItem(
      `${LOCAL_HISTORY_PREFIX}${userId?.trim() || "anonymous"}`
    );
    return true;
  } catch {
    return false;
  }
};

export const createAssistantRuntimeMemory = ({
  loadHistory = getAssistantConversationHistory,
  clearHistory = clearAssistantConversationHistory,
  saveHistory,
}: Partial<AssistantRuntimeMemoryStore> = {}): AssistantRuntimeMemoryStore => ({
  loadHistory: async (userId) => {
    try {
      return await loadHistory(userId);
    } catch {
      return [];
    }
  },
  saveHistory: async (messages, userId) => {
    if (saveHistory) {
      return saveHistory(messages, userId);
    }

    return false;
  },
  clearHistory: async (userId) => {
    clearLocalHistory(userId);

    try {
      return await clearHistory(userId);
    } catch {
      return true;
    }
  },
});

export const assistantRuntimeMemory = createAssistantRuntimeMemory();

export const loadAssistantConversationHistory = (userId?: string | null) =>
  assistantRuntimeMemory.loadHistory(userId);

export const saveAssistantConversationHistory = (
  messages: AssistantConversationMessage[],
  userId?: string | null
) => assistantRuntimeMemory.saveHistory(messages, userId);

export const clearAssistantRuntimeMemory = (userId?: string | null) =>
  assistantRuntimeMemory.clearHistory(userId);
