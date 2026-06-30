import type { AppDispatch } from "@app/store";
import { createRemoteMealEntries } from "@shared/api/auth";
import type { MealEntry, MealState } from "./mealSlice";
import { replaceMealState } from "./mealSlice";
import { buildMealStateAfterAddEntries } from "./mealSaveModel";

export const addMealEntriesToCloud = async (
  dispatch: AppDispatch,
  meal: MealState,
  entries: MealEntry[]
) => {
  const nextMeal = buildMealStateAfterAddEntries(meal, entries);
  const result = await createRemoteMealEntries(entries);

  if (!result.ok) {
    throw new Error(
      result.message || result.code || "Could not save meal to cloud."
    );
  }

  dispatch(replaceMealState(nextMeal));
  return nextMeal;
};
