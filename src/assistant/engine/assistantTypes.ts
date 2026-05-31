export type AssistantScene =
  | "home"
  | "office"
  | "kitchen"
  | "gym"
  | "classic_office";

export type AssistantStatus = "idle" | "thinking" | "reacting" | "transition";

export type AssistantAnimation =
  | "none"
  | "smoke_in"
  | "smoke_out"
  | "typing"
  | "drink"
  | "nod"
  | "slow_drink"
  | "slow_think";

export type AssistantProp = "none" | "phone" | "laptop" | "tablet" | "typewriter";

export type AssistantMood = "happy" | "focused" | "neutral" | "calm";

export type AssistantUserStyle = "young" | "adult" | "elder";

export type AssistantAction =
  | "WATER_DRANK"
  | "MEAL_ADDED"
  | "OPEN_APP"
  | "WORKOUT_DONE"
  | "IDLE";

export interface UserContext {
  age: number;
  style: AssistantUserStyle;
  activityLevel: "low" | "medium" | "high";
}

export interface AssistantBehaviorRule {
  scene: AssistantScene;
  prop: AssistantProp;
  animation: AssistantAnimation;
  mood: AssistantMood;
  reaction?: AssistantAnimation;
}

export type AssistantRuleMap = Record<
  AssistantAction,
  Partial<Record<AssistantUserStyle, AssistantBehaviorRule>>
>;

export const getUserStyle = (age: number): AssistantUserStyle => {
  if (age < 25) {
    return "young";
  }

  if (age < 55) {
    return "adult";
  }

  return "elder";
};

export const normalizeUserContext = (
  user: Partial<UserContext> & { age?: number | null }
): UserContext => {
  const age = typeof user.age === "number" && Number.isFinite(user.age) ? user.age : 30;

  return {
    age,
    style: user.style ?? getUserStyle(age),
    activityLevel: user.activityLevel ?? "medium",
  };
};
