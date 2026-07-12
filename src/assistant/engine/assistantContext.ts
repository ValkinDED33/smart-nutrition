import type { AssistantRuntimeContext } from "@domain/assistant/types";
import type { AssistantContextSource } from "./assistantRuntimeTypes";
import { buildAssistantCoreSnapshot } from "@core/assistant";
import { createDefaultWomenHealthState } from "@domain/profile/womenHealth";
import { resolveAssistantPromptContext } from "@features/assistant/assistantPromptContext";

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
  screen = "unknown",
  currentPath = "/",
  user,
  profile,
  water,
  todayTotals,
  todayMealEntriesCount,
  macroTargets,
  coach,
  coachPrimaryInsight,
  dailyContext,
  promptContext,
}: AssistantContextSource): AssistantRuntimeContext => {
  const latestWeight = profile.weightHistory.at(-1)?.weight ?? user?.weight ?? 0;
  const firstWeight = profile.weightHistory[0]?.weight ?? latestWeight;
  const waterConsumedMl = water.lastLoggedOn === getTodayKey() ? water.consumedMl : 0;
  const weeklyCheckInDue =
    profile.weeklyCheckIn.enabled &&
    getDaysSince(profile.weeklyCheckIn.lastRecordedAt) >=
      profile.weeklyCheckIn.remindIntervalDays;
  const openMotivationTasks = profile.motivation.activeTasks.filter(
    (task) => !task.completedAt && !task.skippedWithDayOffAt
  ).length;
  const assistantCore = buildAssistantCoreSnapshot({
    userId: user?.id,
    userName: user?.name ?? "",
    goal: profile.goal,
    assistant: profile.assistant,
    signals: {
      mealEntriesToday: todayMealEntriesCount,
      caloriesConsumed: todayTotals.caloriesConsumed,
      dailyCalories: profile.dailyCalories,
      proteinConsumed: todayTotals.proteinConsumed,
      proteinTarget: macroTargets.protein,
      waterConsumedMl,
      waterTargetMl: water.dailyWaterGoal,
      completedMotivationTasks: profile.motivation.completedTasks,
      openMotivationTasks,
      weeklyCheckInDue,
    },
  });
  const assistantPersonality = assistantCore.personality;
  const communicationStyle = assistantCore.speechStyle.communicationStyle;
  const resolvedPromptContext =
    promptContext ?? resolveAssistantPromptContext(currentPath);

  return {
    language,
    screen,
    currentPath,
    userName: user?.name ?? "",
    gender: user?.gender ?? null,
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
    weeklyCheckInDue,
    assistantName: assistantCore.identity.name,
    assistantRole: assistantCore.identity.role,
    assistantTone: assistantCore.identity.tone,
    humorEnabled: profile.assistant.humorEnabled,
    assistantPersonality,
    communicationStyle,
    personalDetails: profile.personalDetails,
    womenHealth:
      user?.gender === "female"
        ? profile.womenHealth
        : createDefaultWomenHealthState(),
    motivation: profile.motivation,
    coach,
    coachPrimaryInsight: coachPrimaryInsight ?? coach.insights[0]?.code ?? "on_track",
    dailyContext,
    profile: {
      goal: profile.goal,
      dietStyle: profile.dietStyle,
      latestWeight,
      weeklyCheckInDue,
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
      openMotivationTasks,
      completedMotivationTasks: profile.motivation.completedTasks,
    },
    onboarding: assistantCore.onboarding,
    memory: assistantCore.memory,
    promptContext: resolvedPromptContext,
  };
};
