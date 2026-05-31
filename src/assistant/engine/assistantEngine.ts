import { assistantRules } from "./assistantRules";
import {
  getUserStyle,
  normalizeUserContext,
  type AssistantAction,
  type UserContext,
} from "./assistantTypes";
import { useAssistantStore } from "../state/assistantStore";

const TRANSITION_MS = 600;

export const resolveAssistantRule = (
  action: AssistantAction,
  user: Partial<UserContext> & { age?: number | null }
) => {
  const context = normalizeUserContext(user);
  const style = getUserStyle(context.age);

  return {
    style,
    rule: assistantRules[action]?.[style] ?? null,
  };
};

export const runAssistantAction = (
  action: AssistantAction,
  user: Partial<UserContext> & { age?: number | null }
) => {
  const { style, rule } = resolveAssistantRule(action, user);

  if (!rule) {
    return false;
  }

  const store = useAssistantStore.getState();
  store.setUserStyle(style);
  store.setAnimation("smoke_in");
  store.setState("transition");

  window.setTimeout(() => {
    const nextAnimation = rule.reaction ?? rule.animation;
    const nextStore = useAssistantStore.getState();

    nextStore.applyState({
      scene: rule.scene,
      prop: rule.prop,
      mood: rule.mood,
      animation: nextAnimation,
      status: nextAnimation === "none" ? "idle" : "reacting",
      userStyle: style,
    });

    window.setTimeout(() => {
      const currentStore = useAssistantStore.getState();
      currentStore.applyState({
        animation: "none",
        status: "idle",
      });
    }, TRANSITION_MS);
  }, TRANSITION_MS);

  return true;
};
