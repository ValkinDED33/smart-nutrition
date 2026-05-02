import type { ProfileState } from "../../../features/profile/profileSlice";
import type { WaterState } from "../../../features/water/waterSlice";
import type {
  AssistantConversationMessage,
  AssistantRuntimeContext,
} from "../../types/assistant";
import type { MacroTargets } from "../../types/profile";
import type { User } from "../../types/user";
import type {
  NutritionCoachAnalysis,
  NutritionCoachInsightCode,
} from "../nutritionCoach";

export type AssistantChatMessage = AssistantConversationMessage;

export interface AssistantContextSource {
  language: AssistantRuntimeContext["language"];
  user: User | null;
  profile: Pick<
    ProfileState,
    | "goal"
    | "dietStyle"
    | "dailyCalories"
    | "motivation"
    | "assistant"
    | "personalDetails"
    | "weightHistory"
    | "weeklyCheckIn"
  >;
  water: Pick<WaterState, "consumedMl" | "dailyTargetMl" | "lastLoggedOn">;
  todayTotals: Pick<
    AssistantRuntimeContext,
    "caloriesConsumed" | "fatConsumed" | "carbsConsumed" | "proteinConsumed"
  >;
  todayMealEntriesCount: number;
  macroTargets: Pick<MacroTargets, "protein">;
  coach: NutritionCoachAnalysis;
  coachPrimaryInsight?: NutritionCoachInsightCode;
}
