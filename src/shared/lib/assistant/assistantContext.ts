import type { AssistantRuntimeContext } from "../../types/assistant";
import type { AssistantContextSource } from "./assistantTypes";

const getTodayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
};

const getDaysSince = (value: string | null | undefined) => {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
};

export const createAssistantRuntimeContext = ({
  language,
  user,
  profile,
  water,
  todayTotals,
  todayMealEntriesCount,
  macroTargets,
  coach,
  coachPrimaryInsight,
}: AssistantContextSource): AssistantRuntimeContext => {
  const latestWeight = profile.weightHistory.at(-1)?.weight ?? user?.weight ?? 0;
  const firstWeight = profile.weightHistory[0]?.weight ?? latestWeight;
  const waterConsumedMl = water.lastLoggedOn === getTodayKey() ? water.consumedMl : 0;

  return {
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
    waterConsumedMl,
    waterTargetMl: water.dailyTargetMl,
    latestWeight,
    weightChangeKg: latestWeight - firstWeight,
    weeklyCheckInDue:
      profile.weeklyCheckIn.enabled &&
      getDaysSince(profile.weeklyCheckIn.lastRecordedAt) >=
        profile.weeklyCheckIn.remindIntervalDays,
    assistantName: profile.assistant.name,
    assistantRole: profile.assistant.role,
    assistantTone: profile.assistant.tone,
    humorEnabled: profile.assistant.humorEnabled,
    motivation: profile.motivation,
    coach,
    coachPrimaryInsight: coachPrimaryInsight ?? coach.insights[0]?.code ?? "on_track",
  };
};
