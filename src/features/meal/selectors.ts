import type { RootState } from "../../app/store";
import {
  calculateMealTotalNutrients,
} from "./mealSlice";

const EMPTY_ITEMS: RootState["meal"]["items"] = [];
const EMPTY_TEMPLATES: RootState["meal"]["templates"] = [];
const EMPTY_PRODUCTS: RootState["meal"]["savedProducts"] = [];

export const selectMealItems = (state: RootState) =>
  state.meal?.items ?? EMPTY_ITEMS;

export const selectMealTemplates = (state: RootState) =>
  state.meal?.templates ?? EMPTY_TEMPLATES;

export const selectMealTotalNutrients = (state: RootState) =>
  state.meal?.totalNutrients ?? calculateMealTotalNutrients(selectMealItems(state));

export const selectSavedProducts = (state: RootState) =>
  state.meal?.savedProducts ?? EMPTY_PRODUCTS;

export const selectRecentProducts = (state: RootState) =>
  state.meal?.recentProducts ?? EMPTY_PRODUCTS;
