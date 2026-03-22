import type { RootState } from "../../app/store";
import {
  calculateMealTotalNutrients,
} from "./mealSlice";

const EMPTY_ITEMS: RootState["meal"]["items"] = [];
const EMPTY_TEMPLATES: RootState["meal"]["templates"] = [];

export const selectMealItems = (state: RootState) =>
  state.meal?.items ?? EMPTY_ITEMS;

export const selectMealTemplates = (state: RootState) =>
  state.meal?.templates ?? EMPTY_TEMPLATES;

export const selectMealTotalNutrients = (state: RootState) =>
  state.meal?.totalNutrients ?? calculateMealTotalNutrients(selectMealItems(state));
