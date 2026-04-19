/**
 * Meal Domain Calculations
 * 
 * Pure functions for calculating nutrients and aggregations
 * No side effects, no dependencies on framework
 */

import type { MealEntry, Nutrients, MacroProgress, MealTypeValue } from "./types";

const toDateKey = (value: Date) => value.toISOString().slice(0, 10);

/**
 * Calculate total nutrients from meal entries
 */
export function calculateMealTotalNutrients(items: MealEntry[]): Nutrients {
  const totals: Nutrients = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    calcium: 0,
    iron: 0,
  };

  items.forEach((item) => {
    const factor = item.quantity / 100; // Nutrients are per 100g
    const n = item.product.nutrients;

    totals.calories += (n.calories ?? 0) * factor;
    totals.protein += (n.protein ?? 0) * factor;
    totals.fat += (n.fat ?? 0) * factor;
    totals.carbs += (n.carbs ?? 0) * factor;
    totals.fiber += (n.fiber ?? 0) * factor;
    totals.sugar += (n.sugar ?? 0) * factor;
    totals.sodium += (n.sodium ?? 0) * factor;
    totals.calcium += (n.calcium ?? 0) * factor;
    totals.iron += (n.iron ?? 0) * factor;
  });

  return totals;
}

/**
 * Group meal entries by type
 */
export function groupEntriesByMealType(
  items: MealEntry[]
): Record<MealTypeValue, MealEntry[]> {
  const grouped: Record<MealTypeValue, MealEntry[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };

  items.forEach((item) => {
    grouped[item.mealType].push(item);
  });

  return grouped;
}

/**
 * Calculate macro progress
 */
export function calculateMacroProgress(
  consumed: number,
  target: number
): MacroProgress {
  return {
    current: consumed,
    target,
    progress: target > 0 ? Math.min((consumed / target) * 100, 100) : 0,
  };
}

/**
 * Calculate total calories for a day
 */
export function calculateTotalCalories(items: MealEntry[]): number {
  const nutrients = calculateMealTotalNutrients(items);
  return nutrients.calories;
}

/**
 * Calculate remaining calories
 */
export function calculateRemainingCalories(
  totalConsumed: number,
  dailyGoal: number
): number {
  return Math.max(dailyGoal - totalConsumed, 0);
}

/**
 * Calculate calorie percentage of goal
 */
export function calculateCaloriePercentage(
  consumed: number,
  dailyGoal: number
): number {
  return dailyGoal > 0 ? Math.min((consumed / dailyGoal) * 100, 100) : 0;
}

/**
 * Filter entries by date key (YYYY-MM-DD)
 */
export function filterEntriesByDate(
  items: MealEntry[],
  dateKey: string
): MealEntry[] {
  return items.filter((item) => {
    const entryDate = new Date(item.eatenAt);
    const entryDateKey = toDateKey(entryDate);
    return entryDateKey === dateKey;
  });
}

/**
 * Calculate daily summaries for a range
 */
export function calculateDailySummaries(
  items: MealEntry[],
  startDate: Date,
  endDate: Date
): Record<string, Nutrients> {
  const summaries: Record<string, Nutrients> = {};

  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    const dateKey = toDateKey(current);
    const dayEntries = filterEntriesByDate(items, dateKey);
    summaries[dateKey] = calculateMealTotalNutrients(dayEntries);
    current.setDate(current.getDate() + 1);
  }

  return summaries;
}
