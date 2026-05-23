import type { AssistantRuntimeContext } from "../../types/assistant";
import type { AssistantContextSource } from "./assistantTypes";

const personalityByTone = {
  gentle: {
    warmth: 0.9,
    humor: 0.36,
    strictness: 0.18,
    motivation: 0.78,
  },
  playful: {
    warmth: 0.86,
    humor: 0.72,
    strictness: 0.22,
    motivation: 0.9,
  },
  focused: {
    warmth: 0.55,
    humor: 0.15,
    strictness: 0.75,
    motivation: 0.82,
  },
} as const;

const communicationStyleByTone = {
  gentle: "supportive",
  playful: "energetic",
  focused: "strict",
} as const;

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
  const assistantPersonality = personalityByTone[profile.assistant.tone];
  const communicationStyle = communicationStyleByTone[profile.assistant.tone];

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
    waterTargetMl: water.dailyWaterGoal,
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
    assistantPersonality,
    communicationStyle,
    personalDetails: profile.personalDetails,
    motivation: profile.motivation,
    coach,
    coachPrimaryInsight: coachPrimaryInsight ?? coach.insights[0]?.code ?? "on_track",
    profile: {
      goal: profile.goal,
      dietStyle: profile.dietStyle,
      latestWeight,
      weeklyCheckInDue:
        profile.weeklyCheckIn.enabled &&
        getDaysSince(profile.weeklyCheckIn.lastRecordedAt) >=
          profile.weeklyCheckIn.remindIntervalDays,
    },
    nutritionState: {
      dailyCalories: profile.dailyCalories,
      caloriesConsumed: todayTotals.caloriesConsumed,
      caloriesRemaining: profile.dailyCalories - todayTotals.caloriesConsumed,
      proteinConsumed: todayTotals.proteinConsumed,
      proteinTarget: macroTargets.protein,
      fatConsumed: todayTotals.fatConsumed,
      carbsConsumed: todayTotals.carbsConsumed,
      waterConsumedMl,
      waterTargetMl: water.dailyWaterGoal,
    },
    behavior: {
      mealEntriesToday: todayMealEntriesCount,
      waterLoggedToday: waterConsumedMl > 0,
      openMotivationTasks: profile.motivation.activeTasks.filter(
        (task) => !task.completedAt && !task.skippedWithDayOffAt
      ).length,
      completedMotivationTasks: profile.motivation.completedTasks,
    },
    memory: null,
  };
};
