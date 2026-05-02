import { addDays, getLocalDateKey } from "./date";
import { calculateMacroTargets } from "./macroTargets";
import type { MealEntry, MealType } from "../types/meal";
import type { DietStyle } from "../types/profile";
import type { Goal } from "../types/user";

const COACH_WINDOW_DAYS = 7;
const FIBER_TARGET = 25;

export type NutritionCoachSeverity = "success" | "warning" | "info";
export type NutritionCoachStatus = "strong" | "steady" | "attention";
export type NutritionCoachInsightCode =
  | "logging_low"
  | "protein_low"
  | "water_low"
  | "breakfast_skipped"
  | "fiber_low"
  | "calories_high"
  | "calories_low"
  | "meal_pattern"
  | "weight_trend"
  | "on_track";

export interface NutritionCoachInsight {
  code: NutritionCoachInsightCode;
  severity: NutritionCoachSeverity;
  priority: number;
}

export interface NutritionCoachAnalysis {
  score: number;
  status: NutritionCoachStatus;
  daysLogged: number;
  averageCalories: number;
  averageProtein: number;
  averageFiber: number;
  averageWater: number;
  averageMeals: number;
  breakfastSkippedDays: number;
  calorieTarget: number;
  proteinTarget: number;
  waterTarget: number;
  fiberTarget: number;
  weightChange: number;
  insights: NutritionCoachInsight[];
}

type WeightHistoryPoint = {
  date: string;
  weight: number;
};

type NutritionCoachInput = {
  items: MealEntry[];
  dailyCalories: number;
  goal: Goal;
  dietStyle: DietStyle;
  weight: number;
  weightHistory: WeightHistoryPoint[];
  waterHistory?: Array<{
    date: string;
    consumedMl: number;
    targetMl: number;
  }>;
};

type DayStats = {
  calories: number;
  protein: number;
  fiber: number;
  mealTypes: Set<MealType>;
  entries: number;
};

const buildCoachWindowKeys = () => {
  const today = new Date();
  return Array.from({ length: COACH_WINDOW_DAYS }, (_, index) =>
    getLocalDateKey(addDays(today, -index))
  );
};

const createEmptyDayStats = (): DayStats => ({
  calories: 0,
  protein: 0,
  fiber: 0,
  mealTypes: new Set<MealType>(),
  entries: 0,
});

const calculateAverage = (values: number[]) =>
  values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const calculateWeightChange = (weightHistory: WeightHistoryPoint[]) => {
  if (weightHistory.length < 2) {
    return 0;
  }

  const sortedHistory = [...weightHistory].sort((left, right) =>
    left.date.localeCompare(right.date)
  );
  const first = sortedHistory[0]?.weight ?? 0;
  const last = sortedHistory.at(-1)?.weight ?? first;
  return last - first;
};

const buildInsights = ({
  daysLogged,
  averageCalories,
  averageProtein,
  averageFiber,
  averageMeals,
  calorieTarget,
  proteinTarget,
  goal,
  weightChange,
  averageWater,
  waterTarget,
  breakfastSkippedDays,
}: Omit<NutritionCoachAnalysis, "score" | "status" | "fiberTarget" | "insights"> & {
  goal: Goal;
}) => {
  const next: NutritionCoachInsight[] = [];

  if (daysLogged < 4) {
    next.push({ code: "logging_low", severity: "warning", priority: 100 });
  }

  if (daysLogged >= 2 && averageProtein < proteinTarget * 0.85) {
    next.push({ code: "protein_low", severity: "warning", priority: 95 });
  }

  if (waterTarget > 0 && averageWater < waterTarget * 0.72) {
    next.push({ code: "water_low", severity: "info", priority: 84 });
  }

  if (daysLogged >= 3 && breakfastSkippedDays >= 2) {
    next.push({ code: "breakfast_skipped", severity: "info", priority: 78 });
  }

  if (daysLogged >= 2 && averageFiber < FIBER_TARGET * 0.72) {
    next.push({ code: "fiber_low", severity: "info", priority: 80 });
  }

  if (daysLogged >= 3 && calorieTarget > 0) {
    const calorieTolerance = goal === "maintain" ? 220 : 150;

    if (averageCalories > calorieTarget + calorieTolerance) {
      next.push({ code: "calories_high", severity: "warning", priority: 92 });
    } else if (averageCalories < calorieTarget - calorieTolerance) {
      next.push({
        code: "calories_low",
        severity: goal === "bulk" ? "warning" : "info",
        priority: goal === "bulk" ? 90 : 72,
      });
    }
  }

  if (daysLogged >= 3 && averageMeals < 2.4) {
    next.push({ code: "meal_pattern", severity: "info", priority: 65 });
  }

  if (
    (goal === "cut" && weightChange >= 0.3) ||
    (goal === "bulk" && weightChange <= 0.1) ||
    (goal === "maintain" && Math.abs(weightChange) >= 0.8)
  ) {
    next.push({
      code: "weight_trend",
      severity: goal === "cut" ? "warning" : "info",
      priority: goal === "cut" ? 88 : 68,
    });
  }

  if (next.length === 0) {
    next.push({ code: "on_track", severity: "success", priority: 10 });
  }

  return next.sort((left, right) => right.priority - left.priority).slice(0, 4);
};

const calculateCoachScore = ({
  daysLogged,
  averageCalories,
  averageProtein,
  averageFiber,
  averageMeals,
  calorieTarget,
  proteinTarget,
  goal,
  weightChange,
  averageWater,
  waterTarget,
}: Omit<NutritionCoachAnalysis, "score" | "status" | "fiberTarget" | "insights"> & {
  goal: Goal;
}) => {
  const loggingScore = Math.min((daysLogged / COACH_WINDOW_DAYS) * 25, 25);
  const proteinScore =
    proteinTarget > 0 ? Math.min((averageProtein / proteinTarget) * 30, 30) : 0;
  const fiberScore = Math.min((averageFiber / FIBER_TARGET) * 15, 15);
  const calorieScore =
    calorieTarget > 0 && daysLogged > 0
      ? Math.max(
          0,
          1 - Math.abs(averageCalories - calorieTarget) / Math.max(calorieTarget * 0.28, 280)
        ) * 20
      : 0;
  const mealScore = Math.min((averageMeals / 3) * 10, 10);
  const waterScore =
    waterTarget > 0 ? Math.min((averageWater / waterTarget) * 10, 10) : 0;

  const trendScore =
    goal === "cut"
      ? weightChange < 0
        ? 10
        : 3
      : goal === "bulk"
        ? weightChange > 0
          ? 10
          : 4
        : Math.abs(weightChange) <= 0.8
          ? 10
          : 5;

  return Math.min(
    Math.round(
      loggingScore +
        proteinScore +
        fiberScore +
        calorieScore +
        mealScore +
        waterScore +
        trendScore
    ),
    100
  );
};

export const generateNutritionCoachAnalysis = ({
  items,
  dailyCalories,
  goal,
  dietStyle,
  weight,
  weightHistory,
  waterHistory = [],
}: NutritionCoachInput): NutritionCoachAnalysis => {
  const dayKeys = buildCoachWindowKeys();
  const dayStats = new Map<string, DayStats>(
    dayKeys.map((dayKey) => [dayKey, createEmptyDayStats()])
  );

  items.forEach((item) => {
    const dayKey = getLocalDateKey(item.eatenAt);
    const stats = dayStats.get(dayKey);

    if (!stats) {
      return;
    }

    const factor = item.quantity / 100;
    stats.calories += item.product.nutrients.calories * factor;
    stats.protein += item.product.nutrients.protein * factor;
    stats.fiber += item.product.nutrients.fiber * factor;
    stats.mealTypes.add(item.mealType);
    stats.entries += 1;
  });

  const filledDays = [...dayStats.values()].filter((stats) => stats.entries > 0);
  const daysLogged = filledDays.length;
  const averageCalories = calculateAverage(filledDays.map((stats) => stats.calories));
  const averageProtein = calculateAverage(filledDays.map((stats) => stats.protein));
  const averageFiber = calculateAverage(filledDays.map((stats) => stats.fiber));
  const averageMeals = calculateAverage(filledDays.map((stats) => stats.mealTypes.size));
  const breakfastSkippedDays = filledDays.filter(
    (stats) => !stats.mealTypes.has("breakfast")
  ).length;
  const waterWindow = waterHistory.filter((entry) => dayStats.has(entry.date));
  const averageWater = calculateAverage(waterWindow.map((entry) => entry.consumedMl));
  const waterTarget = calculateAverage(
    waterWindow.filter((entry) => entry.targetMl > 0).map((entry) => entry.targetMl)
  );
  const weightChange = calculateWeightChange(weightHistory);
  const calorieTarget = Math.max(dailyCalories, 0);
  const proteinTarget = calculateMacroTargets({
    calories: calorieTarget,
    weight,
    goal,
    dietStyle,
  }).protein;

  const score = calculateCoachScore({
    daysLogged,
    averageCalories,
    averageProtein,
    averageFiber,
    averageWater,
    averageMeals,
    breakfastSkippedDays,
    calorieTarget,
    proteinTarget,
    waterTarget,
    goal,
    weightChange,
  });

  return {
    score,
    status: score >= 80 ? "strong" : score >= 60 ? "steady" : "attention",
    daysLogged,
    averageCalories,
    averageProtein,
    averageFiber,
    averageWater,
    averageMeals,
    breakfastSkippedDays,
    calorieTarget,
    proteinTarget,
    waterTarget,
    fiberTarget: FIBER_TARGET,
    weightChange,
    insights: buildInsights({
      daysLogged,
      averageCalories,
      averageProtein,
      averageFiber,
      averageWater,
      averageMeals,
      breakfastSkippedDays,
      calorieTarget,
      proteinTarget,
      waterTarget,
      goal,
      weightChange,
    }),
  };
};
