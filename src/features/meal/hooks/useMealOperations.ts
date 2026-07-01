/**
 * Features Layer - Custom Hook for Meal Operations
 * 
 * Connects UI to use cases and Redux state
 */

import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@app/store";
import { AddMealUseCase } from "../usecases/addMeal";
import type { Product } from "@domain/meal";
import { trackRuntimeEvent } from "@integration/runtime/analyticsEvent";
import { createCompanionRewardAnalyticsPayload } from "@features/companion";
import { getLocalDateKey } from "@shared/lib/date";
import { addMealEntriesToCloud } from "../mealCloudSync";
import { applyCompanionRewardInCloud } from "@features/companion/companionCloudSync";

export function useMealOperations() {
  const dispatch = useDispatch<AppDispatch>();
  const meal = useSelector((state: RootState) => state.meal);
  const companion = useSelector((state: RootState) => state.companion);
  const currentMeals = useSelector((state: RootState) => {
    const todayKey = getLocalDateKey(new Date());
    return state.meal.items.filter(
      (item) => getLocalDateKey(item.eatenAt) === todayKey
    );
  });
  const profile = useSelector((state: RootState) => state.profile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMeal = useCallback(
    async (
      product: Product,
      quantity: number,
      mealType: "breakfast" | "lunch" | "dinner" | "snack"
    ) => {
      setError(null);
      setLoading(true);

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
          const mealEntry = result.value;
          await addMealEntriesToCloud(dispatch, meal, [mealEntry]);
          let companionRewardPayload = {};

          try {
            await applyCompanionRewardInCloud(
              dispatch,
              { companion },
              "meal_added"
            );
            companionRewardPayload =
              createCompanionRewardAnalyticsPayload("meal_added");
          } catch (rewardError) {
            setError(
              rewardError instanceof Error
                ? `Meal saved, but companion progress could not sync: ${rewardError.message}`
                : "Meal saved, but companion progress could not sync."
            );
          }

          trackRuntimeEvent("meal_added", {
            mealType: mealEntry.mealType,
            productId: mealEntry.product.id,
            productName: mealEntry.product.name,
            productSource: mealEntry.product.source,
            quantity: mealEntry.quantity,
            unit: mealEntry.product.unit,
            calories: Math.round(
              (mealEntry.product.nutrients.calories * mealEntry.quantity) / 100
            ),
            ...companionRewardPayload,
          });
        } else {
          setError(result.errors?.[0] || "Failed to add meal");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [companion, currentMeals, dispatch, meal, profile]
  );

  return {
    addMeal,
    loading,
    error,
    clearError: () => setError(null),
  };
}
