/**
 * State Layer - Thin Redux Slice
 * 
 * Only UI state, NO business logic here!
 * Business logic lives in domain/ and used by features/
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { MealEntry } from '@domain/meal';

export interface MealState {
  items: MealEntry[];
  loading: boolean;
  error: string | null;
  selectedMealId: string | null;
}

const initialState: MealState = {
  items: [],
  loading: false,
  error: null,
  selectedMealId: null,
};

export const mealSlice = createSlice({
  name: 'meal',
  initialState,
  reducers: {
    // UI state mutations only
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },

    setMeals(state, action: PayloadAction<MealEntry[]>) {
      state.items = action.payload;
    },

    addMealOptimistically(state, action: PayloadAction<MealEntry>) {
      state.items.unshift(action.payload);
    },

    removeMealOptimistically(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },

    updateMealOptimistically(
      state,
      action: PayloadAction<{ id: string; updates: Partial<MealEntry> }>
    ) {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload.updates };
      }
    },

    selectMeal(state, action: PayloadAction<string | null>) {
      state.selectedMealId = action.payload;
    },

    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setMeals,
  addMealOptimistically,
  removeMealOptimistically,
  updateMealOptimistically,
  selectMeal,
  clearError,
} = mealSlice.actions;

export default mealSlice.reducer;
