import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Goal } from "../../shared/types/user";
import {
  createDefaultNutritionPreferences,
  createDefaultNotificationPreferences,
} from "../../shared/lib/preferences";
import {
  calculatePaidDayOffCost,
  canUseFreeDay,
  canUsePaidDay,
  completeMotivationTaskState,
  createDefaultAssistantCustomization,
  createDefaultMotivationState,
  refreshMotivationState,
  resetMotivationState,
  updateAchievements,
  applyFreeDayState,
  applyPaidDayState,
} from "../../shared/lib/motivation";
import type {
  AdaptiveMode,
  AssistantCustomization,
  AssistantRole,
  AssistantTone,
  AchievementProgress,
  DietStyle,
  MotivationHistoryItem,
  MotivationState,
  MotivationTask,
  MotivationTaskCategory,
  ReminderTimes,
} from "../../shared/types/profile";
import type { AppLanguage } from "../../shared/types/i18n";

interface WeightHistoryItem {
  date: string;
  weight: number;
}

export interface ProfileState {
  dailyCalories: number;
  goal: Goal;
  weightHistory: WeightHistoryItem[];
  maintenanceCalories: number;
  adaptiveCalories: number | null;
  targetWeight: number | null;
  targetWeightStart: number | null;
  dietStyle: DietStyle;
  allergies: string[];
  excludedIngredients: string[];
  adaptiveMode: AdaptiveMode;
  notificationsEnabled: boolean;
  mealRemindersEnabled: boolean;
  calorieAlertsEnabled: boolean;
  reminderTimes: ReminderTimes;
  languagePreference: AppLanguage;
  motivation: MotivationState;
  assistant: AssistantCustomization;
}

interface ProfileTargetsPayload {
  goal: Goal;
  weight: number;
  maintenanceCalories: number;
  targetCalories: number;
  targetWeight: number | null;
  dietStyle: DietStyle;
  allergies: string[];
  excludedIngredients: string[];
  adaptiveMode: AdaptiveMode;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isGoal = (value: unknown): value is Goal =>
  value === "cut" || value === "maintain" || value === "bulk";

const toNumber = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const toNullableNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;

const isDietStyle = (value: unknown): value is DietStyle =>
  value === "balanced" ||
  value === "vegetarian" ||
  value === "vegan" ||
  value === "pescatarian" ||
  value === "low_carb" ||
  value === "gluten_free";

const isAdaptiveMode = (value: unknown): value is AdaptiveMode =>
  value === "automatic" || value === "manual";
const isAppLanguage = (value: unknown): value is AppLanguage => value === "uk" || value === "pl";
const isAssistantRole = (value: unknown): value is AssistantRole =>
  value === "friend" || value === "assistant" || value === "coach";
const isAssistantTone = (value: unknown): value is AssistantTone =>
  value === "gentle" || value === "playful" || value === "focused";
const isTaskCategory = (value: unknown): value is MotivationTaskCategory =>
  value === "nutrition" || value === "consistency" || value === "reflection";

const isReminderTime = (value: unknown): value is string =>
  typeof value === "string" && /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim());
const isIsoDate = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Date.parse(value));
const toNullableIsoDate = (value: unknown): string | null =>
  value === null ? null : isIsoDate(value) ? value : null;

const normalizeStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

const normalizeReminderTimes = (
  value: unknown,
  fallback: ReminderTimes
): ReminderTimes => {
  const record = isRecord(value) ? value : {};

  return {
    breakfast: isReminderTime(record.breakfast) ? record.breakfast : fallback.breakfast,
    lunch: isReminderTime(record.lunch) ? record.lunch : fallback.lunch,
    dinner: isReminderTime(record.dinner) ? record.dinner : fallback.dinner,
    snack: isReminderTime(record.snack) ? record.snack : fallback.snack,
  };
};

const normalizeWeightHistory = (value: unknown): WeightHistoryItem[] =>
  Array.isArray(value)
    ? value
        .map((item) => {
          if (!isRecord(item)) return null;

          return {
            date:
              typeof item.date === "string" && item.date.trim().length > 0
                ? item.date
                : new Date().toISOString(),
            weight: toNumber(item.weight),
          };
        })
        .filter((item): item is WeightHistoryItem => item !== null)
    : [];

const normalizeMotivationTasks = (value: unknown): MotivationTask[] =>
  Array.isArray(value)
    ? value
        .map((item) => {
          if (!isRecord(item)) return null;

          return {
            id:
              typeof item.id === "string"
                ? item.id
                : `task-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
            title: typeof item.title === "string" ? item.title : "Task",
            description: typeof item.description === "string" ? item.description : "",
            points: toNumber(item.points, 0),
            category: isTaskCategory(item.category) ? item.category : "consistency",
            createdAt: isIsoDate(item.createdAt) ? item.createdAt : new Date().toISOString(),
            completedAt: toNullableIsoDate(item.completedAt),
            skippedWithDayOffAt: toNullableIsoDate(item.skippedWithDayOffAt),
          };
        })
        .filter((item): item is MotivationTask => item !== null)
    : [];

const normalizeMotivationHistory = (value: unknown): MotivationHistoryItem[] =>
  Array.isArray(value)
    ? value
        .map((item) => {
          if (!isRecord(item) || !isIsoDate(item.completedAt)) return null;

          return {
            taskId: typeof item.taskId === "string" ? item.taskId : "task",
            title: typeof item.title === "string" ? item.title : "Task",
            pointsEarned: toNumber(item.pointsEarned, 0),
            completedAt: item.completedAt,
            skipped: Boolean(item.skipped),
            usedDayOff:
              item.usedDayOff === "free" || item.usedDayOff === "paid" ? item.usedDayOff : null,
          };
        })
        .filter((item): item is MotivationHistoryItem => item !== null)
    : [];

const normalizeAchievements = (value: unknown): AchievementProgress[] => {
  const fallback = createDefaultMotivationState().achievements;

  if (!Array.isArray(value)) {
    return fallback;
  }

  return fallback.map((achievement) => {
    const match = value.find(
      (item) => isRecord(item) && typeof item.id === "string" && item.id === achievement.id
    );

    if (!isRecord(match)) {
      return achievement;
    }

    return {
      ...achievement,
      progress: toNumber(match.progress, 0),
      unlockedAt: toNullableIsoDate(match.unlockedAt),
    };
  });
};

const normalizeMotivationState = (value: unknown, goal: Goal): MotivationState => {
  const fallback = createDefaultMotivationState(goal);

  if (!isRecord(value)) {
    return fallback;
  }

  const points = toNumber(value.points, 0);
  const completedTasks = toNumber(value.completedTasks, 0);
  const activeTasks = normalizeMotivationTasks(value.activeTasks);
  const history = normalizeMotivationHistory(value.history);
  const achievements = updateAchievements(
    normalizeAchievements(value.achievements),
    points,
    completedTasks,
    new Date().toISOString()
  );

  return {
    points,
    level: Math.max(toNumber(value.level, 1), 1),
    completedTasks,
    activeTasks: activeTasks.length > 0 ? activeTasks : fallback.activeTasks,
    history,
    achievements,
    lastTaskRefreshDate: isIsoDate(value.lastTaskRefreshDate) ? value.lastTaskRefreshDate.slice(0, 10) : fallback.lastTaskRefreshDate,
    freeDayLastUsedAt: toNullableIsoDate(value.freeDayLastUsedAt),
    paidDayLastUsedAt: toNullableIsoDate(value.paidDayLastUsedAt),
    paidDayLastUsedMonth:
      typeof value.paidDayLastUsedMonth === "string" && /^\d{4}-\d{2}$/.test(value.paidDayLastUsedMonth)
        ? value.paidDayLastUsedMonth
        : null,
  };
};

const normalizeAssistantCustomization = (value: unknown): AssistantCustomization => {
  const fallback = createDefaultAssistantCustomization();

  if (!isRecord(value)) {
    return fallback;
  }

  return {
    name:
      typeof value.name === "string" && value.name.trim().length > 0
        ? value.name.trim().slice(0, 32)
        : fallback.name,
    role: isAssistantRole(value.role) ? value.role : fallback.role,
    tone: isAssistantTone(value.tone) ? value.tone : fallback.tone,
    humorEnabled:
      typeof value.humorEnabled === "boolean" ? value.humorEnabled : fallback.humorEnabled,
  };
};

export const createInitialProfileState = (): ProfileState => ({
  dailyCalories: 0,
  goal: "maintain",
  weightHistory: [],
  maintenanceCalories: 0,
  adaptiveCalories: null,
  targetWeight: null,
  targetWeightStart: null,
  ...createDefaultNutritionPreferences(),
  ...createDefaultNotificationPreferences(),
  languagePreference: "uk",
  motivation: createDefaultMotivationState(),
  assistant: createDefaultAssistantCustomization(),
});

export const normalizeProfileState = (value: unknown): ProfileState => {
  const fallback = createInitialProfileState();

  if (!isRecord(value)) {
    return fallback;
  }

  return {
    dailyCalories: toNumber(value.dailyCalories),
    goal: isGoal(value.goal) ? value.goal : "maintain",
    weightHistory: normalizeWeightHistory(value.weightHistory),
    maintenanceCalories: toNumber(value.maintenanceCalories),
    adaptiveCalories: toNullableNumber(value.adaptiveCalories),
    targetWeight: toNullableNumber(value.targetWeight),
    targetWeightStart: toNullableNumber(value.targetWeightStart),
    dietStyle: isDietStyle(value.dietStyle) ? value.dietStyle : "balanced",
    allergies: normalizeStringArray(value.allergies),
    excludedIngredients: normalizeStringArray(value.excludedIngredients),
    adaptiveMode: isAdaptiveMode(value.adaptiveMode) ? value.adaptiveMode : "automatic",
    notificationsEnabled:
      typeof value.notificationsEnabled === "boolean"
        ? value.notificationsEnabled
        : fallback.notificationsEnabled,
    mealRemindersEnabled:
      typeof value.mealRemindersEnabled === "boolean"
        ? value.mealRemindersEnabled
        : fallback.mealRemindersEnabled,
    calorieAlertsEnabled:
      typeof value.calorieAlertsEnabled === "boolean"
        ? value.calorieAlertsEnabled
        : fallback.calorieAlertsEnabled,
    reminderTimes: normalizeReminderTimes(value.reminderTimes, fallback.reminderTimes),
    languagePreference: isAppLanguage(value.languagePreference)
      ? value.languagePreference
      : fallback.languagePreference,
    motivation: normalizeMotivationState(
      value.motivation,
      isGoal(value.goal) ? value.goal : "maintain"
    ),
    assistant: normalizeAssistantCustomization(value.assistant),
  };
};

const initialState: ProfileState = createInitialProfileState();

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    replaceProfileState(_, action: PayloadAction<unknown>) {
      return normalizeProfileState(action.payload);
    },

    setDailyCalories(state, action: PayloadAction<number>) {
      state.dailyCalories = action.payload;
    },

    setMaintenanceCalories(state, action: PayloadAction<number>) {
      state.maintenanceCalories = action.payload;
    },

    setAdaptiveCalories(state, action: PayloadAction<number | null>) {
      state.adaptiveCalories = action.payload;
      if (action.payload !== null) {
        state.dailyCalories = action.payload;
      }
    },

    setGoal(state, action: PayloadAction<Goal>) {
      state.goal = action.payload;
      state.motivation.lastTaskRefreshDate = null;
      state.motivation = refreshMotivationState(state.motivation, action.payload);
    },

    updateWeight(state, action: PayloadAction<number>) {
      state.weightHistory.push({
        date: new Date().toISOString(),
        weight: action.payload,
      });
    },

    applyProfileTargets(state, action: PayloadAction<ProfileTargetsPayload>) {
      state.goal = action.payload.goal;
      state.maintenanceCalories = action.payload.maintenanceCalories;
      state.adaptiveCalories = action.payload.targetCalories;
      state.dailyCalories = action.payload.targetCalories;
      state.dietStyle = action.payload.dietStyle;
      state.allergies = action.payload.allergies;
      state.excludedIngredients = action.payload.excludedIngredients;
      state.adaptiveMode = action.payload.adaptiveMode;
      state.motivation.lastTaskRefreshDate = null;
      state.motivation = refreshMotivationState(state.motivation, action.payload.goal);
      if (action.payload.targetWeight === null) {
        state.targetWeight = null;
        state.targetWeightStart = null;
      } else {
        const targetChanged = state.targetWeight !== action.payload.targetWeight;
        state.targetWeight = action.payload.targetWeight;

        if (state.targetWeightStart === null || targetChanged) {
          state.targetWeightStart = action.payload.weight;
        }
      }
      state.weightHistory.push({
        date: new Date().toISOString(),
        weight: action.payload.weight,
      });
    },

    updateNotificationPreferences(
      state,
      action: PayloadAction<{
        notificationsEnabled?: boolean;
        mealRemindersEnabled?: boolean;
        calorieAlertsEnabled?: boolean;
        reminderTimes?: Partial<ReminderTimes>;
      }>
    ) {
      if (typeof action.payload.notificationsEnabled === "boolean") {
        state.notificationsEnabled = action.payload.notificationsEnabled;
      }

      if (typeof action.payload.mealRemindersEnabled === "boolean") {
        state.mealRemindersEnabled = action.payload.mealRemindersEnabled;
      }

      if (typeof action.payload.calorieAlertsEnabled === "boolean") {
        state.calorieAlertsEnabled = action.payload.calorieAlertsEnabled;
      }

      if (action.payload.reminderTimes) {
        state.reminderTimes = normalizeReminderTimes(action.payload.reminderTimes, state.reminderTimes);
      }
    },

    setProfileLanguage(state, action: PayloadAction<AppLanguage>) {
      state.languagePreference = action.payload;
    },

    setAssistantCustomization(
      state,
      action: PayloadAction<Partial<AssistantCustomization>>
    ) {
      state.assistant = normalizeAssistantCustomization({
        ...state.assistant,
        ...action.payload,
      });
    },

    refreshMotivationTasks(state, action: PayloadAction<string | undefined>) {
      state.motivation = refreshMotivationState(
        state.motivation,
        state.goal,
        action.payload ?? new Date().toISOString()
      );
    },

    completeMotivationTask(
      state,
      action: PayloadAction<{ taskId: string; completedAt?: string }>
    ) {
      state.motivation = completeMotivationTaskState(
        state.motivation,
        action.payload.taskId,
        action.payload.completedAt
      );
    },

    activateWeeklyDayOff(state, action: PayloadAction<{ usedAt?: string } | undefined>) {
      const usedAt = action.payload?.usedAt ?? new Date().toISOString();

      if (!canUseFreeDay(state.motivation.freeDayLastUsedAt, usedAt)) {
        return;
      }

      state.motivation = applyFreeDayState(state.motivation, usedAt);
    },

    buyMonthlyDayOff(state, action: PayloadAction<{ usedAt?: string } | undefined>) {
      const usedAt = action.payload?.usedAt ?? new Date().toISOString();

      if (!canUsePaidDay(state.motivation.paidDayLastUsedMonth, usedAt)) {
        return;
      }

      const cost = calculatePaidDayOffCost(state.motivation.history, usedAt);

      if (state.motivation.points < cost) {
        return;
      }

      state.motivation = applyPaidDayState(state.motivation, cost, usedAt);
    },

    resetMotivationProgress(state) {
      state.motivation = resetMotivationState(state.goal);
    },

    resetProfile(state) {
      state.dailyCalories = 0;
      state.goal = "maintain";
      state.weightHistory = [];
      state.maintenanceCalories = 0;
      state.adaptiveCalories = null;
      state.targetWeight = null;
      state.targetWeightStart = null;
      state.dietStyle = "balanced";
      state.allergies = [];
      state.excludedIngredients = [];
      state.adaptiveMode = "automatic";
      state.notificationsEnabled = false;
      state.mealRemindersEnabled = true;
      state.calorieAlertsEnabled = true;
      state.reminderTimes = createDefaultNotificationPreferences().reminderTimes;
      state.languagePreference = "uk";
      state.motivation = createDefaultMotivationState();
      state.assistant = createDefaultAssistantCustomization();
    },
  },
});

export const {
  replaceProfileState,
  setDailyCalories,
  setMaintenanceCalories,
  setAdaptiveCalories,
  setGoal,
  updateWeight,
  applyProfileTargets,
  updateNotificationPreferences,
  setProfileLanguage,
  setAssistantCustomization,
  refreshMotivationTasks,
  completeMotivationTask,
  activateWeeklyDayOff,
  buyMonthlyDayOff,
  resetMotivationProgress,
  resetProfile,
} = profileSlice.actions;

export default profileSlice.reducer;
