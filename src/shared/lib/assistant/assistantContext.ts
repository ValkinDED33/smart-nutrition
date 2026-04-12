import type { AssistantRuntimeContext } from "../../types/assistant";
import type { AssistantContextSource } from "./assistantTypes";

export const createAssistantRuntimeContext = ({
  language,
  user,
  profile,
  todayTotals,
  todayMealEntriesCount,
  macroTargets,
  coach,
  coachPrimaryInsight,
}: AssistantContextSource): AssistantRuntimeContext => ({
  language,
  userName: user?.name ?? "",
  goal: profile.goal,
  dietStyle: profile.dietStyle,
  dailyCalories: profile.dailyCalories,
  caloriesConsumed: todayTotals.caloriesConsumed,
  caloriesRemaining: profile.dailyCalories - todayTotals.caloriesConsumed,
  proteinConsumed: todayTotals.proteinConsumed,
  proteinTarget: macroTargets.protein,
  fatConsumed: todayTotals.fatConsumed,
  carbsConsumed: todayTotals.carbsConsumed,
  mealEntriesToday: todayMealEntriesCount,
  assistantName: profile.assistant.name,
  assistantRole: profile.assistant.role,
  assistantTone: profile.assistant.tone,
  humorEnabled: profile.assistant.humorEnabled,
  motivation: profile.motivation,
  coach,
  coachPrimaryInsight: coachPrimaryInsight ?? coach.insights[0]?.code ?? "on_track",
});
