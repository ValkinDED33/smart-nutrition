/**
 * Meal Domain Calculations
 * 
 * Pure functions for calculating nutrients and aggregations
 * No side effects, no dependencies on framework
 */

import type { MealEntry, Nutrients, MacroProgress, MealTypeValue } from "./types";
import {
  createEmptyNutrients,
  getNutrientValue,
  nutrientKeys,
  setNutrientValue,
} from "./nutrients";

const toDateKey = (value: Date) => value.toISOString().slice(0, 10);

/**
 * Calculate total nutrients from meal entries
 */
export function calculateMealTotalNutrients(items: MealEntry[]): Nutrients {
  const totals = createEmptyNutrients();

  items.forEach((item) => {
    const factor = item.quantity / 100; // Nutrients are per 100g
    const n = item.product.nutrients;

    nutrientKeys.forEach((key) => {
      setNutrientValue(
        totals,
        key,
        getNutrientValue(totals, key) + getNutrientValue(n, key) * factor
      );
    });
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
    switch (item.mealType) {
      case "breakfast":
        grouped.breakfast.push(item);
        break;
      case "lunch":
        grouped.lunch.push(item);
        break;
      case "dinner":
        grouped.dinner.push(item);
        break;
      case "snack":
      default:
        grouped.snack.push(item);
        break;
    }
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
  const summaries: Array<[string, Nutrients]> = [];

  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    const dateKey = toDateKey(current);
    const dayEntries = filterEntriesByDate(items, dateKey);
    summaries.push([dateKey, calculateMealTotalNutrients(dayEntries)]);
    current.setDate(current.getDate() + 1);
  }

  return Object.fromEntries(summaries);
}
