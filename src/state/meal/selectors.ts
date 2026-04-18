/**
 * State Layer - Selectors
 * 
 * Use domain functions here for powerful selectors
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@app/store';
import {
  calculateMealTotalNutrients,
  groupEntriesByMealType,
  filterEntriesByDate,
} from '@domain/meal';

const selectMealItems = (state: RootState) => state.meal?.items || [];
const selectMealLoading = (state: RootState) => state.meal?.loading || false;
const selectMealError = (state: RootState) => state.meal?.error || null;

/**
 * Select meals by date
 */
export const selectMealsByDate = (dateKey: string) =>
  createSelector([selectMealItems], (items) => filterEntriesByDate(items, dateKey));

/**
 * Select today's meals
 */
export const selectTodayMeals = createSelector([selectMealItems], (items) => {
  const today = new Date().toISOString().split('T')[0];
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
