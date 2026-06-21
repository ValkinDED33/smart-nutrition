import type { ProfileState } from "@features/profile/profileSlice";
import type { WaterState } from "@features/water/waterSlice";
import type {
  AssistantConversationMessage,
  AssistantPromptContext,
  AssistantRuntimeContext,
} from "@domain/assistant/types";
import type { MacroTargets } from "@domain/profile/types";
import type { User } from "@domain/user/types";
import type {
  NutritionCoachAnalysis,
  NutritionCoachInsightCode,
} from "@domain/meal/nutritionCoach";
import type { DailyContext } from "@domain/meal/dailyContext";

export type AssistantChatMessage = AssistantConversationMessage;
export type AssistantScene = "home" | "meals" | "progress" | "profile" | "celebration";
export type AssistantStatus = "idle" | "transition" | "reacting";
export type AssistantAnimation = "none" | "smoke_in" | "bounce" | "nod" | "celebrate";
export type AssistantProp = "none" | "plate" | "water" | "scale" | "sparkles";
export type AssistantMood = "neutral" | "happy" | "focused" | "concerned";
export type AssistantUserStyle = "child" | "teen" | "adult";
export type AssistantAction = string;

export interface UserContext {
  age?: number | null;
}

export interface AssistantRule {
  scene: AssistantScene;
  prop: AssistantProp;
  mood: AssistantMood;
  animation: AssistantAnimation;
  reaction?: AssistantAnimation;
}

export const normalizeUserContext = (user: Partial<UserContext>): UserContext => ({
  age: typeof user.age === "number" ? user.age : null,
});

export const getUserStyle = (age?: number | null): AssistantUserStyle => {
  if (typeof age !== "number") return "adult";
  if (age < 13) return "child";
  if (age < 18) return "teen";
  return "adult";
};

export interface AssistantContextSource {
  language: AssistantRuntimeContext["language"];
  screen?: AssistantRuntimeContext["screen"];
  currentPath?: AssistantRuntimeContext["currentPath"];
  promptContext?: AssistantPromptContext;
  user: User | null;
  profile: Pick<
    ProfileState,
    | "goal"
    | "dietStyle"
    | "dailyCalories"
    | "motivation"
    | "assistant"
    | "personalDetails"
    | "womenHealth"
    | "weightHistory"
    | "weeklyCheckIn"
  >;
  water: Pick<WaterState, "consumedMl" | "dailyWaterGoal" | "lastLoggedOn">;
  todayTotals: Pick<
    AssistantRuntimeContext,
    "caloriesConsumed" | "fatConsumed" | "carbsConsumed" | "proteinConsumed"
  >;
  todayMealEntriesCount: number;
  macroTargets: Pick<MacroTargets, "protein">;
  coach: NutritionCoachAnalysis;
  coachPrimaryInsight?: NutritionCoachInsightCode;
  dailyContext: DailyContext;
}
