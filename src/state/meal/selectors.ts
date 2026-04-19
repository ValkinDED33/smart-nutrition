/**
 * State Layer - Selectors
 * 
 * Use domain functions here for powerful selectors
 */

import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@app/store";
import {
  calculateMealTotalNutrients,
  groupEntriesByMealType,
  filterEntriesByDate,
} from "@domain/meal";
import type { MealEntry } from "@domain/meal";

type ExperimentalMealSlice = {
  items?: MealEntry[];
  loading?: boolean;
  error?: string | null;
};

const selectMealSlice = (state: RootState): ExperimentalMealSlice =>
  state.meal as unknown as ExperimentalMealSlice;
const selectMealItems = (state: RootState) => selectMealSlice(state).items ?? [];
const selectMealLoading = (state: RootState) => selectMealSlice(state).loading ?? false;
const selectMealError = (state: RootState) => selectMealSlice(state).error ?? null;

/**
 * Select meals by date
 */
export const selectMealsByDate = (dateKey: string) =>
  createSelector([selectMealItems], (items) => filterEntriesByDate(items, dateKey));

/**
 * Select today's meals
 */
export const selectTodayMeals = createSelector([selectMealItems], (items) => {
  const today = new Date().toISOString().slice(0, 10);
  return filterEntriesByDate(items, today);
});

/**
 * Select meals grouped by type for today
 */
export const selectTodayMealsByType = createSelector(
  [selectTodayMeals],
  (meals) => groupEntriesByMealType(meals)
);

/**
 * Select today's nutrients (using domain function!)
 */
export const selectTodayNutrients = createSelector(
  [selectTodayMeals],
  (meals) => calculateMealTotalNutrients(meals)
);

/**
 * Select meal by ID
 */
export const selectMealById = (id: string) =>
  createSelector([selectMealItems], (items) => items.find((m) => m.id === id) || null);

export const selectMealUIState = createSelector(
  [selectMealLoading, selectMealError],
  (loading, error) => ({ loading, error })
);
