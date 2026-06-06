import { create } from "zustand";
import type {
  AssistantAnimation,
  AssistantMood,
  AssistantProp,
  AssistantScene,
  AssistantStatus,
  AssistantUserStyle,
} from "@assistant/engine/assistantRuntimeTypes";

export interface AssistantState {
  scene: AssistantScene;
  status: AssistantStatus;
  animation: AssistantAnimation;
  prop: AssistantProp;
  mood: AssistantMood;
  userStyle: AssistantUserStyle;
}

interface AssistantStore extends AssistantState {
  setState: (status: AssistantStatus) => void;
  setScene: (scene: AssistantScene) => void;
  setAnimation: (animation: AssistantAnimation) => void;
  setProp: (prop: AssistantProp) => void;
  setMood: (mood: AssistantMood) => void;
  setUserStyle: (userStyle: AssistantUserStyle) => void;
  applyState: (state: Partial<AssistantState>) => void;
}

export const useAssistantStore = create<AssistantStore>((set) => ({
  scene: "home",
  status: "idle",
  animation: "none",
  prop: "none",
  mood: "neutral",
  userStyle: "adult",
  setState: (status) => set({ status }),
  setScene: (scene) => set({ scene }),
  setAnimation: (animation) => set({ animation }),
  setProp: (prop) => set({ prop }),
  setMood: (mood) => set({ mood }),
  setUserStyle: (userStyle) => set({ userStyle }),
  applyState: (state) => set(state),
}));
