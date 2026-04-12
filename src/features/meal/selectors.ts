import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import {
  calculateMealTotalNutrients,
} from "./mealSlice";
import { getLocalDateKey } from "../../shared/lib/date";

const EMPTY_ITEMS: RootState["meal"]["items"] = [];
const EMPTY_TEMPLATES: RootState["meal"]["templates"] = [];
const EMPTY_PRODUCTS: RootState["meal"]["savedProducts"] = [];

export const selectMealItems = (state: RootState) =>
  state.meal?.items ?? EMPTY_ITEMS;

export const selectMealTemplates = (state: RootState) =>
  state.meal?.templates ?? EMPTY_TEMPLATES;

export const selectMealTotalNutrients = (state: RootState) =>
  state.meal?.totalNutrients ?? calculateMealTotalNutrients(selectMealItems(state));

export const selectTodayMealItems = createSelector([selectMealItems], (items) => {
  const todayKey = getLocalDateKey(new Date());
  return items.filter((item) => getLocalDateKey(item.eatenAt) === todayKey);
});

export const selectTodayMealTotalNutrients = createSelector(
  [selectTodayMealItems],
  (items) => calculateMealTotalNutrients(items)
);

export const selectAvailableMealDays = createSelector([selectMealItems], (items) => {
  const uniqueKeys = [...new Set(items.map((item) => getLocalDateKey(item.eatenAt)))];
  return uniqueKeys.sort((a, b) => b.localeCompare(a));
});

export const selectSavedProducts = (state: RootState) =>
  state.meal?.savedProducts ?? EMPTY_PRODUCTS;

export const selectRecentProducts = (state: RootState) =>
  state.meal?.recentProducts ?? EMPTY_PRODUCTS;

export const selectPersonalBarcodeProducts = (state: RootState) =>
  state.meal?.personalBarcodeProducts ?? EMPTY_PRODUCTS;

const createProductKey = (product: { name: string; brand?: string; barcode?: string }) =>
  product.barcode?.trim() ||
  `${product.name.trim().toLowerCase()}-${product.brand?.trim().toLowerCase() ?? ""}`;

export const selectFavoriteProductIds = createSelector([selectSavedProducts], (products) => {
  return new Set(products.map(createProductKey));
});

export const selectIsProductFavorited = (product: { name: string; brand?: string; barcode?: string }) =>
  createSelector([selectFavoriteProductIds], (favorites) => {
    return favorites.has(createProductKey(product));
  });

export const selectMealsByDate = (dateKey: string) =>
  createSelector([selectMealItems], (items) => {
    return items.filter((item) => getLocalDateKey(item.eatenAt) === dateKey);
  });
