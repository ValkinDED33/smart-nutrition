import type { MealEntry } from "@domain/meal/types";
import type { Product } from "@domain/products/types";
import type { MealState } from "./mealSlice";
import { normalizeMealState } from "./mealSlice";
import { createProductKey, normalizeBarcode } from "./productIdentity";

const createId = (prefix: string) =>
  globalThis.crypto?.randomUUID?.() ??
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const createMealEntryDraft = ({
  product,
  quantity,
  mealType = "snack",
  origin = "manual",
  eatenAt,
}: {
  product: Product;
  quantity: number;
  mealType?: MealEntry["mealType"];
  origin?: MealEntry["origin"];
  eatenAt?: string;
}): MealEntry => ({
  id: createId("meal"),
  product,
  quantity,
  mealType,
  origin,
  eatenAt: eatenAt ?? new Date().toISOString(),
});

export const createTemplateEntries = (
  template: MealState["templates"][number],
  eatenAt = new Date().toISOString()
): MealEntry[] =>
  template.items.map((item) =>
    createMealEntryDraft({
      product: item.product,
      quantity: item.quantity,
      mealType: template.mealType,
      origin: "recipe",
      eatenAt,
    })
  );

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

export const buildMealStateAfterRemoveEntry = (
  meal: MealState,
  entryId: string
): MealState =>
  normalizeMealState({
    ...meal,
    items: meal.items.filter((item) => item.id !== entryId),
  });

export const buildMealStateAfterUpdateEntry = (
  meal: MealState,
  update: {
    id: string;
    product: Product;
    quantity: number;
    mealType: MealEntry["mealType"];
  }
): MealState =>
  normalizeMealState({
    ...meal,
    items: meal.items.map((item) =>
      item.id === update.id
        ? {
            ...item,
            product: update.product,
            quantity: update.quantity,
            mealType: update.mealType,
          }
        : item
    ),
    recentProducts: rememberProduct(meal.recentProducts, update.product, 16),
    personalBarcodeProducts: rememberBarcodeProduct(
      meal.personalBarcodeProducts,
      update.product,
      240
    ),
  });

export const buildMealStateAfterSaveTemplate = (
  meal: MealState,
  template: MealState["templates"][number]
): MealState =>
  normalizeMealState({
    ...meal,
    templates: [
      template,
      ...meal.templates.filter((item) => item.id !== template.id),
    ],
  });

export const buildMealStateAfterDeleteTemplate = (
  meal: MealState,
  templateId: string
): MealState =>
  normalizeMealState({
    ...meal,
    templates: meal.templates.filter((template) => template.id !== templateId),
  });

export const buildMealStateAfterApplyTemplate = (
  meal: MealState,
  templateId: string,
  entries: MealEntry[]
): MealState => {
  const template = meal.templates.find((item) => item.id === templateId);

  if (!template || entries.length === 0) {
    return normalizeMealState(meal);
  }

  return buildMealStateAfterAddEntries(meal, entries);
};

export const buildMealStateAfterSaveProduct = (
  meal: MealState,
  product: Product
): MealState =>
  normalizeMealState({
    ...meal,
    savedProducts: rememberProduct(meal.savedProducts, product, 24),
    personalBarcodeProducts: rememberBarcodeProduct(
      meal.personalBarcodeProducts,
      product,
      240
    ),
  });

export const buildMealStateAfterRemoveSavedProduct = (
  meal: MealState,
  productKey: string
): MealState =>
  normalizeMealState({
    ...meal,
    savedProducts: meal.savedProducts.filter(
      (product) => createProductKey(product) !== productKey
    ),
  });

export const buildMealStateAfterRememberRecentProduct = (
  meal: MealState,
  product: Product
): MealState =>
  normalizeMealState({
    ...meal,
    recentProducts: rememberProduct(meal.recentProducts, product, 16),
    personalBarcodeProducts: rememberBarcodeProduct(
      meal.personalBarcodeProducts,
      product,
      240
    ),
  });
