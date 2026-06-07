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
const MAX_LOCAL_HISTORY_MESSAGES = 24;

const getLocalStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const getLocalHistoryKey = (userId?: string | null) =>
  `${LOCAL_HISTORY_PREFIX}${userId?.trim() || "anonymous"}`;

const isMessageRole = (
  value: unknown
): value is AssistantConversationMessage["role"] =>
  value === "assistant" || value === "user";

const normalizeLocalHistory = (value: unknown): AssistantConversationMessage[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.reduce<AssistantConversationMessage[]>((messages, item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        typeof (item as AssistantConversationMessage).id !== "string" ||
        !isMessageRole((item as AssistantConversationMessage).role) ||
        typeof (item as AssistantConversationMessage).text !== "string"
      ) {
        return messages;
      }

      const message = item as AssistantConversationMessage;
      const text = message.text.trim();

      if (!text) {
        return messages;
      }

      messages.push({
        id: message.id,
        role: message.role,
        text,
        mode: message.mode,
        followUpQuestionIds: message.followUpQuestionIds,
        createdAt: message.createdAt,
      });

      return messages;
    }, []);
};

const loadLocalHistory = (userId?: string | null) => {
  const storage = getLocalStorage();

  if (!storage) {
    return [];
  }

  try {
    return normalizeLocalHistory(
      JSON.parse(storage.getItem(getLocalHistoryKey(userId)) ?? "[]")
    );
  } catch {
    return [];
  }
};

const saveLocalHistory = (
  messages: AssistantConversationMessage[],
  userId?: string | null
) => {
  const storage = getLocalStorage();

  if (!storage) {
    return false;
  }

  try {
    storage.setItem(
      getLocalHistoryKey(userId),
      JSON.stringify(messages.slice(-MAX_LOCAL_HISTORY_MESSAGES))
    );
    return true;
  } catch {
    return false;
  }
};

const clearLocalHistory = (userId?: string | null) => {
  const storage = getLocalStorage();

  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(getLocalHistoryKey(userId));
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
      const remoteHistory = await loadHistory(userId);

      if (remoteHistory.length > 0) {
        saveLocalHistory(remoteHistory, userId);
      }

      return remoteHistory;
    } catch {
      return loadLocalHistory(userId);
    }
  },
  saveHistory: async (messages, userId) => {
    const savedLocally = saveLocalHistory(messages, userId);

    if (saveHistory) {
      return saveHistory(messages, userId);
    }

    return savedLocally;
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
