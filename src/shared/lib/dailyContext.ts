import { addDays, getLocalDateKey } from "./date";
import { createEmptyNutrients, nutrientKeys } from "./nutrients";
import type { MealEntry, MealType } from "../types/meal";
import type { MacroTargets } from "../types/profile";
import type { Nutrients } from "../types/product";

const DEFAULT_FIBER_TARGET = 25;
const CONTEXT_WINDOW_DAYS = 7;

export type DailyContextFocus =
  | "log_first_meal"
  | "complete_day"
  | "protein"
  | "water"
  | "fiber"
  | "calories_high"
  | "calories_low"
  | "steady";

export type DailyContextPatternCode =
  | "light_logging"
  | "breakfast_gap"
  | "late_snacking"
  | "low_protein_repeat"
  | "water_low_repeat"
  | "calorie_overshoot"
  | "steady_streak";

export type DailyContextNudgeTone = "gentle" | "direct" | "celebratory";

export interface DailyContextDay {
  dateKey: string;
  entries: number;
  mealTypes: MealType[];
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

export interface DailyContext {
  today: DailyContextDay;
  yesterday: DailyContextDay;
  week: {
    daysLogged: number;
    averageCalories: number;
    averageProtein: number;
    averageFiber: number;
    averageEntries: number;
  };
  targets: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
    waterMl: number;
  };
  gaps: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
    waterMl: number;
  };
  progress: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
    water: number;
  };
  primaryFocus: DailyContextFocus;
  suggestedMealType: MealType;
  patterns: DailyContextPatternCode[];
  nudgeTone: DailyContextNudgeTone;
}

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const clampPercent = (value: number) =>
  Number.isFinite(value) ? Math.max(0, Math.min(value, 120)) : 0;

const calculateProgress = (current: number, target: number) =>
  target > 0 ? clampPercent((current / target) * 100) : 0;

const calculateAverage = (values: number[]) =>
  values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const calculateEntryNutrients = (entry: MealEntry) => {
  const factor = entry.quantity / 100;
  const nutrients = createEmptyNutrients();

  nutrientKeys.forEach((key) => {
    nutrients[key] = (entry.product.nutrients[key] ?? 0) * factor;
  });

  return nutrients;
};

const addNutrients = (target: Nutrients, source: Nutrients) => {
  nutrientKeys.forEach((key) => {
    target[key] = (target[key] ?? 0) + (source[key] ?? 0);
  });
};

const summarizeDay = (dateKey: string, entries: MealEntry[]): DailyContextDay => {
  const nutrients = createEmptyNutrients();
  const mealTypeSet = new Set<MealType>();

  entries.forEach((entry) => {
    addNutrients(nutrients, calculateEntryNutrients(entry));
    mealTypeSet.add(entry.mealType);
  });

  return {
    dateKey,
    entries: entries.length,
    mealTypes: mealTypes.filter((mealType) => mealTypeSet.has(mealType)),
    calories: nutrients.calories,
    protein: nutrients.protein,
    fat: nutrients.fat,
    carbs: nutrients.carbs,
    fiber: nutrients.fiber,
  };
};

const getSuggestedMealType = (now: Date, today: DailyContextDay): MealType => {
  const hour = now.getHours();
  const expectedByTime: MealType =
    hour < 11 ? "breakfast" : hour < 16 ? "lunch" : hour < 21 ? "dinner" : "snack";

  if (!today.mealTypes.includes(expectedByTime)) {
    return expectedByTime;
  }

  return mealTypes.find((mealType) => !today.mealTypes.includes(mealType)) ?? expectedByTime;
};

const hasLateSnack = (entry: MealEntry) => {
  if (entry.mealType !== "snack") {
    return false;
  }

  const hour = new Date(entry.eatenAt).getHours();
  return hour >= 20 || hour < 4;
};

const buildPatterns = ({
  items,
  weekDays,
  today,
  yesterday,
  targets,
  waterProgress,
}: {
  items: MealEntry[];
  weekDays: DailyContextDay[];
  today: DailyContextDay;
  yesterday: DailyContextDay;
  targets: DailyContext["targets"];
  waterProgress: number;
}): DailyContextPatternCode[] => {
  const patterns = new Set<DailyContextPatternCode>();
  const loggedDays = weekDays.filter((day) => day.entries > 0);
  const recentLoggedDays = weekDays.slice(0, 4).filter((day) => day.entries > 0);

  if (loggedDays.length < 4 || today.entries <= 1) {
    patterns.add("light_logging");
  }

  const skippedBreakfastDays = recentLoggedDays.filter(
    (day) => !day.mealTypes.includes("breakfast")
  ).length;

  if (recentLoggedDays.length >= 2 && skippedBreakfastDays >= 2) {
    patterns.add("breakfast_gap");
  }

  const weekKeys = new Set(weekDays.map((day) => day.dateKey));
  const lateSnackDays = new Set(
    items
      .filter((entry) => weekKeys.has(getLocalDateKey(entry.eatenAt)))
      .filter(hasLateSnack)
      .map((entry) => getLocalDateKey(entry.eatenAt))
  );

  if (lateSnackDays.size >= 2) {
    patterns.add("late_snacking");
  }

  if (
    targets.protein > 0 &&
    today.protein < targets.protein * 0.65 &&
    yesterday.entries > 0 &&
    yesterday.protein < targets.protein * 0.75
  ) {
    patterns.add("low_protein_repeat");
  }

  if (targets.waterMl > 0 && waterProgress < 55) {
    patterns.add("water_low_repeat");
  }

  if (
    targets.calories > 0 &&
    (today.calories > targets.calories * 1.08 || yesterday.calories > targets.calories * 1.08)
  ) {
    patterns.add("calorie_overshoot");
  }

  const steadyDays = loggedDays.filter(
    (day) =>
      targets.calories > 0 &&
      targets.protein > 0 &&
      day.calories >= targets.calories * 0.75 &&
      day.calories <= targets.calories * 1.08 &&
      day.protein >= targets.protein * 0.75
  ).length;

  if (loggedDays.length >= 4 && steadyDays >= 4) {
    patterns.add("steady_streak");
  }

  return [...patterns];
};

const derivePrimaryFocus = ({
  today,
  targets,
  gaps,
  progress,
}: Pick<DailyContext, "today" | "targets" | "gaps" | "progress">): DailyContextFocus => {
  if (today.entries === 0) {
    return "log_first_meal";
  }

  if (today.entries <= 1 && progress.calories < 45) {
    return "complete_day";
  }

  if (targets.calories > 0 && today.calories > targets.calories * 1.08) {
    return "calories_high";
  }

  if (targets.protein > 0 && progress.protein < 65) {
    return "protein";
  }

  if (targets.waterMl > 0 && progress.water < 55) {
    return "water";
  }

  if (targets.fiber > 0 && progress.fiber < 60) {
    return "fiber";
  }

  if (targets.calories > 0 && gaps.calories > Math.max(targets.calories * 0.38, 450)) {
    return "calories_low";
  }

  return "steady";
};

const deriveNudgeTone = (
  primaryFocus: DailyContextFocus,
  patterns: DailyContextPatternCode[]
): DailyContextNudgeTone => {
  if (primaryFocus === "steady" && patterns.includes("steady_streak")) {
    return "celebratory";
  }

  if (
    primaryFocus === "calories_high" ||
    patterns.includes("calorie_overshoot") ||
    patterns.includes("low_protein_repeat")
  ) {
    return "direct";
  }

  return "gentle";
};

export const buildDailyContext = ({
  items,
  dailyCalories,
  macroTargets,
  waterConsumedMl,
  waterTargetMl,
  now = new Date(),
  fiberTarget = DEFAULT_FIBER_TARGET,
}: {
  items: MealEntry[];
  dailyCalories: number;
  macroTargets: MacroTargets;
  waterConsumedMl: number;
  waterTargetMl: number;
  now?: Date;
  fiberTarget?: number;
}): DailyContext => {
  const dayKeys = Array.from({ length: CONTEXT_WINDOW_DAYS }, (_, index) =>
    getLocalDateKey(addDays(now, -index))
  );
  const entriesByDay = new Map<string, MealEntry[]>(
    dayKeys.map((dayKey) => [dayKey, []])
  );

  items.forEach((entry) => {
    const dayKey = getLocalDateKey(entry.eatenAt);
    const bucket = entriesByDay.get(dayKey);

    if (bucket) {
      bucket.push(entry);
    }
  });

  const weekDays = dayKeys.map((dayKey) => summarizeDay(dayKey, entriesByDay.get(dayKey) ?? []));
  const today = weekDays[0] ?? summarizeDay(getLocalDateKey(now), []);
  const yesterday =
    weekDays[1] ?? summarizeDay(getLocalDateKey(addDays(now, -1)), []);
  const loggedDays = weekDays.filter((day) => day.entries > 0);
  const targets: DailyContext["targets"] = {
    calories: Math.max(dailyCalories, 0),
    protein: Math.max(macroTargets.protein, 0),
    fat: Math.max(macroTargets.fat, 0),
    carbs: Math.max(macroTargets.carbs, 0),
    fiber: Math.max(fiberTarget, 0),
    waterMl: Math.max(waterTargetMl, 0),
  };
  const gaps: DailyContext["gaps"] = {
    calories: Math.max(targets.calories - today.calories, 0),
    protein: Math.max(targets.protein - today.protein, 0),
    fat: Math.max(targets.fat - today.fat, 0),
    carbs: Math.max(targets.carbs - today.carbs, 0),
    fiber: Math.max(targets.fiber - today.fiber, 0),
    waterMl: Math.max(targets.waterMl - waterConsumedMl, 0),
  };
  const progress: DailyContext["progress"] = {
    calories: calculateProgress(today.calories, targets.calories),
    protein: calculateProgress(today.protein, targets.protein),
    fat: calculateProgress(today.fat, targets.fat),
    carbs: calculateProgress(today.carbs, targets.carbs),
    fiber: calculateProgress(today.fiber, targets.fiber),
    water: calculateProgress(waterConsumedMl, targets.waterMl),
  };
  const patterns = buildPatterns({
    items,
    weekDays,
    today,
    yesterday,
    targets,
    waterProgress: progress.water,
  });
  const primaryFocus = derivePrimaryFocus({ today, targets, gaps, progress });

  return {
    today,
    yesterday,
    week: {
      daysLogged: loggedDays.length,
      averageCalories: calculateAverage(loggedDays.map((day) => day.calories)),
      averageProtein: calculateAverage(loggedDays.map((day) => day.protein)),
      averageFiber: calculateAverage(loggedDays.map((day) => day.fiber)),
      averageEntries: calculateAverage(loggedDays.map((day) => day.entries)),
    },
    targets,
    gaps,
    progress,
    primaryFocus,
    suggestedMealType: getSuggestedMealType(now, today),
    patterns,
    nudgeTone: deriveNudgeTone(primaryFocus, patterns),
  };
};
