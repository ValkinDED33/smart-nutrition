import type { MealEntry, MealState } from "./mealSlice";
import { normalizeMealState } from "./mealSlice";
import { createProductKey, normalizeBarcode } from "./productIdentity";

const rememberProduct = <T extends { name: string; brand?: string; barcode?: string }>(
  list: T[],
  product: T,
  limit: number
) => {
  const key = createProductKey(product);
  return [product, ...list.filter((item) => createProductKey(item) !== key)].slice(
    0,
    limit
  );
};

const rememberBarcodeProduct = <T extends { barcode?: string }>(
  list: T[],
  product: T,
  limit: number
) => {
  const barcodeKey = normalizeBarcode(product.barcode ?? "");

  if (!barcodeKey) {
    return list;
  }

  return [
    product,
    ...list.filter((item) => normalizeBarcode(item.barcode ?? "") !== barcodeKey),
  ].slice(0, limit);
};

export const buildMealStateAfterAddEntries = (
  meal: MealState,
  entries: MealEntry[]
): MealState => {
  if (entries.length === 0) {
    return normalizeMealState(meal);
  }

  const nextMeal = normalizeMealState({
    ...meal,
    items: [...entries, ...meal.items],
  });

  entries.forEach((entry) => {
    nextMeal.recentProducts = rememberProduct(
      nextMeal.recentProducts,
      entry.product,
      16
    );
    nextMeal.personalBarcodeProducts = rememberBarcodeProduct(
      nextMeal.personalBarcodeProducts,
      entry.product,
      240
    );
  });

  return normalizeMealState(nextMeal);
};
