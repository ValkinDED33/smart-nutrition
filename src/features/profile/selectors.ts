import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { calculateMacroTargets } from "../../shared/lib/macroTargets";
import { selectTodayMealTotalNutrients } from "../meal/selectors";

export const selectDailyMacroTargets = createSelector(
  [
    (state: RootState) => state.profile.dailyCalories,
    (state: RootState) => state.profile.goal,
    (state: RootState) => state.profile.dietStyle,
    (state: RootState) => state.auth.user?.weight ?? 0,
  ],
  (dailyCalories, goal, dietStyle, weight) =>
    calculateMacroTargets({
      calories: dailyCalories,
      weight,
      goal,
      dietStyle,
    })
);

export const selectDailyMacroProgress = createSelector(
  [
    selectTodayMealTotalNutrients,
    selectDailyMacroTargets,
  ],
  (totalNutrients, targets) => ({
    protein: {
      current: totalNutrients.protein,
      target: targets.protein,
      progress: targets.protein > 0 ? Math.min((totalNutrients.protein / targets.protein) * 100, 100) : 0,
    },
    fat: {
      current: totalNutrients.fat,
      target: targets.fat,
      progress: targets.fat > 0 ? Math.min((totalNutrients.fat / targets.fat) * 100, 100) : 0,
    },
    carbs: {
      current: totalNutrients.carbs,
      target: targets.carbs,
      progress: targets.carbs > 0 ? Math.min((totalNutrients.carbs / targets.carbs) * 100, 100) : 0,
    },
  })
);
