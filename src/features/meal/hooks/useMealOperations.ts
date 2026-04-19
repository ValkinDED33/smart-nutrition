/**
 * Features Layer - Custom Hook for Meal Operations
 * 
 * Connects UI to use cases and Redux state
 */

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@app/store";
import {
  setLoading,
  setError,
  addMealOptimistically,
  clearError,
} from "@state/meal/slice";
import { selectTodayMeals } from "@state/meal/selectors";
import { AddMealUseCase } from "../usecases/addMeal";
import type { Product } from "@domain/meal";

export function useMealOperations() {
  const dispatch = useDispatch<AppDispatch>();
  const currentMeals = useSelector(selectTodayMeals);
  const profile = useSelector((state: RootState) => state.profile);
  const loading = useSelector(
    (state: RootState) =>
      ((state.meal as unknown as { loading?: boolean }).loading ?? false)
  );
  const error = useSelector(
    (state: RootState) =>
      ((state.meal as unknown as { error?: string | null }).error ?? null)
  );

  const addMeal = useCallback(
    async (
      product: Product,
      quantity: number,
      mealType: "breakfast" | "lunch" | "dinner" | "snack"
    ) => {
      dispatch(clearError());
      dispatch(setLoading(true));

      try {
        const useCase = new AddMealUseCase(
          undefined,
          () => crypto.randomUUID?.() || `meal-${Date.now()}`
        );
        
        const result = await useCase.execute({
          product,
          quantity,
          mealType,
          profile: {
            dailyCalories: profile.dailyCalories,
            macroGoals: {
              calories: profile.dailyCalories,
              protein: (profile.dailyCalories * 0.25) / 4,
              fat: profile.dailyCalories * 0.3 / 9,
              carbs: profile.dailyCalories * 0.45 / 4,
            },
            allergies: profile.allergies ?? [],
            excludedIngredients: profile.excludedIngredients ?? [],
            dietStyle:
              profile.dietStyle === "low_carb"
                ? "low_carb"
                : profile.dietStyle === "balanced"
                  ? "balanced"
                  : "high_protein",
          },
          currentMeals,
        });

        if (result.isOk && result.value) {
          dispatch(addMealOptimistically(result.value));
        } else {
          dispatch(setError(result.errors?.[0] || "Failed to add meal"));
        }
      } catch (err) {
        dispatch(setError(err instanceof Error ? err.message : "Unknown error"));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, currentMeals, profile]
  );

  return {
    addMeal,
    loading,
    error,
    clearError: () => dispatch(clearError()),
  };
}
