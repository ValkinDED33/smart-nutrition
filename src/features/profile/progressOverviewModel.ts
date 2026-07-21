import type { MealState } from "../meal/mealSlice";
import type { WaterState } from "../water/waterModel";
import type { ProfileState } from "./model/store";

export type ProgressTone = "good" | "watch" | "missing";

export type ProgressDomain =
  | "calories"
  | "protein"
  | "water"
  | "meals"
  | "weight"
  | "checkIn";

export interface ProgressOverviewItem {
  domain: ProgressDomain;
  value: number | null;
  detail: string;
  color: string;
  tone: ProgressTone;
}

interface CreateProgressOverviewItemsInput {
  profile: ProfileState;
  meal: MealState;
  water: WaterState;
  now?: Date;
  labels: {
    calories: string;
    protein: string;
    water: string;
    meals: string;
    weightGoal: string;
    checkIn: string;
    noTarget: string;
    mealsDetail: (count: number) => string;
    checkInDetail: (count: number) => string;
  };
}

export const clampProgressPercent = (value: number) =>
  Math.max(0, Math.min(100, Math.round(value)));

export const getProgressTone = (value: number | null, target = 80): ProgressTone => {
  if (value === null) {
    return "missing";
  }

  return value >= target ? "good" : "watch";
};

export const getProgressToneColor = (tone: ProgressTone, color: string) => {
  if (tone === "missing") {
    return "rgba(148, 163, 184, 0.72)";
  }

  if (tone === "watch") {
    return "#f59e0b";
  }

  return color;
};

export const formatProgressPercent = (value: number | null) =>
  value === null ? "-" : `${value}%`;

const isSameLocalDate = (value: string, now: Date) => {
  const date = new Date(value);

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

export const createProgressOverviewItems = ({
  profile,
  meal,
  water,
  now = new Date(),
  labels,
}: CreateProgressOverviewItemsInput) => {
  const latestWeight = profile.weightHistory.at(-1)?.weight ?? 0;
  const todayMealCount = meal.items.filter((item) =>
    isSameLocalDate(item.eatenAt, now)
  ).length;
  const caloriesProgress = profile.dailyCalories
    ? clampProgressPercent((meal.totalNutrients.calories / profile.dailyCalories) * 100)
    : null;
  const proteinTarget = profile.dailyCalories
    ? Math.max(60, Math.round(profile.dailyCalories * 0.075))
    : 0;
  const proteinProgress = proteinTarget
    ? clampProgressPercent((meal.totalNutrients.protein / proteinTarget) * 100)
    : null;
  const waterProgress = water.dailyWaterGoal
    ? clampProgressPercent((water.consumedMl / water.dailyWaterGoal) * 100)
    : null;
  const mealsProgress = clampProgressPercent((todayMealCount / 4) * 100);
  const weightProgress =
    latestWeight && profile.targetWeight
      ? clampProgressPercent(
          (1 -
            Math.abs(latestWeight - profile.targetWeight) /
              Math.max(
                Math.abs((profile.targetWeightStart ?? latestWeight) - profile.targetWeight),
                1
              )) *
            100
        )
      : null;
  const checkInProgress = clampProgressPercent(
    Math.min(profile.measurementHistory.length, 4) * 25
  );

  return [
    {
      domain: "calories",
      label: labels.calories,
      value: caloriesProgress,
      detail: `${Math.round(meal.totalNutrients.calories)} / ${profile.dailyCalories || 0} kcal`,
      color: "#14b8a6",
      tone: getProgressTone(caloriesProgress),
    },
    {
      domain: "protein",
      label: labels.protein,
      value: proteinProgress,
      detail: `${Math.round(meal.totalNutrients.protein)} / ${proteinTarget || 0} g`,
      color: "#8b5cf6",
      tone: getProgressTone(proteinProgress),
    },
    {
      domain: "water",
      label: labels.water,
      value: waterProgress,
      detail: `${water.consumedMl} / ${water.dailyWaterGoal} ml`,
      color: "#0ea5e9",
      tone: getProgressTone(waterProgress),
    },
    {
      domain: "meals",
      label: labels.meals,
      value: mealsProgress,
      detail: labels.mealsDetail(todayMealCount),
      color: "#22c55e",
      tone: getProgressTone(mealsProgress, 50),
    },
    {
      domain: "weight",
      label: labels.weightGoal,
      value: weightProgress,
      detail: profile.targetWeight
        ? `${latestWeight.toFixed(1)} / ${profile.targetWeight.toFixed(1)} kg`
        : labels.noTarget,
      color: "#f97316",
      tone: getProgressTone(weightProgress),
    },
    {
      domain: "checkIn",
      label: labels.checkIn,
      value: checkInProgress,
      detail: labels.checkInDetail(profile.measurementHistory.length),
      color: "#ec4899",
      tone: getProgressTone(checkInProgress, 50),
    },
  ] satisfies Array<ProgressOverviewItem & { label: string }>;
};
