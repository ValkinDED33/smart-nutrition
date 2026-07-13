import type { ProfileState } from "@features/profile/profileSlice";
import type { WaterState } from "@features/water/waterSlice";
import type {
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
