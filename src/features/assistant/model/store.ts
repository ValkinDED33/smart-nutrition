import { create } from "zustand";
import type {
  AssistantConversationMessage,
  AssistantScreenContext,
} from "@domain/assistant/types";

interface AssistantChatState {
  activeUserId: string | null;
  currentScreen: AssistantScreenContext;
  messages: AssistantConversationMessage[];
  minimized: boolean;
  historyReady: boolean;
  setActiveUserId: (userId: string | null) => void;
  setCurrentScreen: (screen: AssistantScreenContext) => void;
  setMessages: (messages: AssistantConversationMessage[]) => void;
  appendMessage: (message: AssistantConversationMessage) => void;
  setMinimized: (minimized: boolean) => void;
  setHistoryReady: (historyReady: boolean) => void;
  resetConversationState: () => void;
}

const defaultScreen: AssistantScreenContext = {
  screen: "unknown",
  currentPath: "/",
};

export const useAssistantChatStore = create<AssistantChatState>((set) => ({
  activeUserId: null,
  currentScreen: defaultScreen,
  messages: [],
  minimized: false,
  historyReady: false,
  setActiveUserId: (activeUserId) => set({ activeUserId }),
  setCurrentScreen: (currentScreen) => set({ currentScreen }),
  setMessages: (messages) => set({ messages }),
  appendMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setMinimized: (minimized) => set({ minimized }),
  setHistoryReady: (historyReady) => set({ historyReady }),
  resetConversationState: () =>
    set({
      activeUserId: null,
      messages: [],
      historyReady: false,
      minimized: false,
      currentScreen: defaultScreen,
    }),
}));
