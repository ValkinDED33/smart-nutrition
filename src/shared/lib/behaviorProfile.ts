import { addDays, getLocalDateKey } from "./date";
import type { MealEntry, MealType } from "../types/meal";
import type { ReminderTimes } from "../types/profile";

const ANALYSIS_WINDOW_DAYS = 14;
const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export type BehaviorProfileStatus = "strong" | "steady" | "fragile";

export interface MealHabitInsight {
  mealType: MealType;
  loggedDays: number;
  consistency: number;
  averageLogMinutes: number | null;
  averageLogTime: string | null;
  suggestedReminderTime: string;
  hasSuggestion: boolean;
}

export interface BehaviorProfileAnalysis {
  consistencyScore: number;
  status: BehaviorProfileStatus;
  activeDays: number;
  currentStreak: number;
  bestStreak: number;
  strongestMealType: MealType | null;
  weakestMealType: MealType | null;
  mealHabits: Record<MealType, MealHabitInsight>;
  suggestedReminderTimes: ReminderTimes;
}

const toMinutes = (value: string) => {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const formatMinutes = (value: number) => {
  const normalized = Math.max(0, Math.min(value, 23 * 60 + 59));
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const calculateMedianMinutes = (values: number[]) => {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    const lower = sorted[middle - 1];
    const upper = sorted[middle];

    if (lower === undefined || upper === undefined) {
      return null;
    }

    return Math.round((lower + upper) / 2);
  }

  return sorted[middle] ?? null;
};

const buildWindowKeys = () =>
  Array.from({ length: ANALYSIS_WINDOW_DAYS }, (_, index) =>
    getLocalDateKey(addDays(new Date(), -index))
  );

const countCurrentStreak = (activeDaySet: Set<string>, dayKeys: string[]) => {
  let streak = 0;

  for (const dayKey of dayKeys) {
    if (!activeDaySet.has(dayKey)) {
      break;
    }

    streak += 1;
  }

  return streak;
};

const countBestStreak = (activeDaySet: Set<string>, dayKeysAscending: string[]) => {
  let best = 0;
  let current = 0;

  dayKeysAscending.forEach((dayKey) => {
    if (activeDaySet.has(dayKey)) {
      current += 1;
      best = Math.max(best, current);
      return;
    }

    current = 0;
  });

  return best;
};

const determineStrongestMealType = (mealHabits: Record<MealType, MealHabitInsight>) =>
  [...MEAL_TYPES].sort((left, right) => {
    const leftInsight = mealHabits[left];
    const rightInsight = mealHabits[right];

    return (
      rightInsight.consistency - leftInsight.consistency ||
      rightInsight.loggedDays - leftInsight.loggedDays
    );
  })[0] ?? null;

const determineWeakestMealType = (mealHabits: Record<MealType, MealHabitInsight>) =>
  [...MEAL_TYPES].sort((left, right) => {
    const leftInsight = mealHabits[left];
    const rightInsight = mealHabits[right];

    return (
      leftInsight.consistency - rightInsight.consistency ||
      leftInsight.loggedDays - rightInsight.loggedDays
    );
  })[0] ?? null;

export const generateBehaviorProfileAnalysis = ({
  items,
  reminderTimes,
}: {
  items: MealEntry[];
  reminderTimes: ReminderTimes;
}): BehaviorProfileAnalysis => {
  const dayKeys = buildWindowKeys();
  const activeDaySet = new Set<string>();
  const mealTimeBuckets: Record<MealType, number[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };
  const mealDayBuckets: Record<MealType, Set<string>> = {
    breakfast: new Set<string>(),
    lunch: new Set<string>(),
    dinner: new Set<string>(),
    snack: new Set<string>(),
  };

  items.forEach((item) => {
    const dayKey = getLocalDateKey(item.eatenAt);

    if (!dayKeys.includes(dayKey)) {
      return;
    }

    activeDaySet.add(dayKey);
    mealDayBuckets[item.mealType].add(dayKey);

    const date = new Date(item.eatenAt);
    const minutes = date.getHours() * 60 + date.getMinutes();
    mealTimeBuckets[item.mealType].push(minutes);
  });

  const activeDays = activeDaySet.size;
  const currentStreak = countCurrentStreak(activeDaySet, dayKeys);
  const bestStreak = countBestStreak(activeDaySet, [...dayKeys].reverse());

  const mealHabits = MEAL_TYPES.reduce<Record<MealType, MealHabitInsight>>((accumulator, mealType) => {
    const medianMinutes = calculateMedianMinutes(mealTimeBuckets[mealType]);
    const loggedDays = mealDayBuckets[mealType].size;
    const hasSuggestion = loggedDays >= 2 && medianMinutes !== null;
    const suggestedReminderTime = hasSuggestion
      ? formatMinutes(Math.max(medianMinutes - 20, 6 * 60))
      : reminderTimes[mealType];

    accumulator[mealType] = {
      mealType,
      loggedDays,
      consistency: activeDays > 0 ? loggedDays / activeDays : 0,
      averageLogMinutes: medianMinutes,
      averageLogTime: medianMinutes === null ? null : formatMinutes(medianMinutes),
      suggestedReminderTime,
      hasSuggestion,
    };

    return accumulator;
  }, {
    breakfast: {
      mealType: "breakfast",
      loggedDays: 0,
      consistency: 0,
      averageLogMinutes: null,
      averageLogTime: null,
      suggestedReminderTime: reminderTimes.breakfast,
      hasSuggestion: false,
    },
    lunch: {
      mealType: "lunch",
      loggedDays: 0,
      consistency: 0,
      averageLogMinutes: null,
      averageLogTime: null,
      suggestedReminderTime: reminderTimes.lunch,
      hasSuggestion: false,
    },
    dinner: {
      mealType: "dinner",
      loggedDays: 0,
      consistency: 0,
      averageLogMinutes: null,
      averageLogTime: null,
      suggestedReminderTime: reminderTimes.dinner,
      hasSuggestion: false,
    },
    snack: {
      mealType: "snack",
      loggedDays: 0,
      consistency: 0,
      averageLogMinutes: null,
      averageLogTime: null,
      suggestedReminderTime: reminderTimes.snack,
      hasSuggestion: false,
    },
  });

  const averageMealConsistency =
    MEAL_TYPES.reduce((sum, mealType) => sum + mealHabits[mealType].consistency, 0) /
    MEAL_TYPES.length;
  const activeDayScore = Math.min((activeDays / ANALYSIS_WINDOW_DAYS) * 40, 40);
  const streakScore = Math.min((currentStreak / 5) * 20, 20);
  const mealConsistencyScore = averageMealConsistency * 25;
  const bestStreakScore = Math.min((bestStreak / 7) * 15, 15);
  const consistencyScore = Math.round(
    activeDayScore + streakScore + mealConsistencyScore + bestStreakScore
  );

  const suggestedReminderTimes: ReminderTimes = {
    breakfast: mealHabits.breakfast.suggestedReminderTime,
    lunch: mealHabits.lunch.suggestedReminderTime,
    dinner: mealHabits.dinner.suggestedReminderTime,
    snack: mealHabits.snack.suggestedReminderTime,
  };

  return {
    consistencyScore,
    status: consistencyScore >= 80 ? "strong" : consistencyScore >= 60 ? "steady" : "fragile",
    activeDays,
    currentStreak,
    bestStreak,
    strongestMealType: determineStrongestMealType(mealHabits),
    weakestMealType: determineWeakestMealType(mealHabits),
    mealHabits,
    suggestedReminderTimes,
  };
};

export const hasBehaviorReminderSuggestion = (
  currentReminderTimes: ReminderTimes,
  analysis: BehaviorProfileAnalysis
) =>
  MEAL_TYPES.some(
    (mealType) =>
      analysis.mealHabits[mealType].hasSuggestion &&
      currentReminderTimes[mealType] !== analysis.suggestedReminderTimes[mealType]
  );

export const getReminderShiftMinutes = (current: string, suggested: string) =>
  toMinutes(suggested) - toMinutes(current);
