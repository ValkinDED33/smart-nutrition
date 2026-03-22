import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Nutrients, Product } from "../../shared/types/product";
import type {
  MealEntry,
  MealTemplate,
  MealTemplateItem,
  MealType,
} from "../../shared/types/meal";
import {
  createEmptyNutrients,
  nutrientKeys,
} from "../../shared/lib/nutrients";

export interface MealState {
  items: MealEntry[];
  templates: MealTemplate[];
  totalNutrients: Nutrients;
  savedProducts: Product[];
  recentProducts: Product[];
}

const createId = (prefix: string) =>
  globalThis.crypto?.randomUUID?.() ??
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isMealType = (value: unknown): value is MealType =>
  value === "breakfast" ||
  value === "lunch" ||
  value === "dinner" ||
  value === "snack";

const isOrigin = (value: unknown): value is MealEntry["origin"] =>
  value === "manual" || value === "barcode" || value === "recipe";

const isUnit = (value: unknown): value is Product["unit"] =>
  value === "g" || value === "ml" || value === "piece";

const isSource = (value: unknown): value is Product["source"] =>
  value === "USDA" ||
  value === "OpenFoodFacts" ||
  value === "Manual" ||
  value === "Recipe";

const toNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const toPositiveNumber = (value: unknown, fallback: number) => {
  const next = toNumber(value);
  return next > 0 ? next : fallback;
};

const toString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const normalizeNutrients = (value: unknown): Nutrients => {
  const record = isRecord(value) ? value : {};

  return nutrientKeys.reduce((accumulator, key) => {
    accumulator[key] = toNumber(record[key]);
    return accumulator;
  }, createEmptyNutrients());
};

const normalizeStringArray = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const normalizeProduct = (value: unknown): Product => {
  const record = isRecord(value) ? value : {};

  return {
    id: toString(record.id, createId("product")),
    name: toString(record.name, "Unknown product"),
    unit: isUnit(record.unit) ? record.unit : "g",
    source: isSource(record.source) ? record.source : "Manual",
    brand: toString(record.brand) || undefined,
    barcode: toString(record.barcode) || undefined,
    imageUrl: toString(record.imageUrl) || undefined,
    facts: isRecord(record.facts)
      ? {
          foodGroup: toString(record.facts.foodGroup) || undefined,
          carbohydrateTypes: normalizeStringArray(record.facts.carbohydrateTypes),
          proteinTypes: normalizeStringArray(record.facts.proteinTypes),
          fatTypes: normalizeStringArray(record.facts.fatTypes),
          extraCompounds: normalizeStringArray(record.facts.extraCompounds),
        }
      : undefined,
    nutrients: normalizeNutrients(record.nutrients),
  };
};

const normalizeProductCollection = (value: unknown): Product[] =>
  Array.isArray(value) ? value.map((item) => normalizeProduct(item)) : [];

const normalizeMealTemplateItem = (value: unknown): MealTemplateItem | null => {
  if (!isRecord(value)) return null;

  return {
    product: normalizeProduct(value.product),
    quantity: toPositiveNumber(value.quantity, 100),
  };
};

const normalizeMealEntry = (value: unknown): MealEntry | null => {
  if (!isRecord(value)) return null;

  return {
    id: toString(value.id, createId("meal")),
    product: normalizeProduct(value.product),
    quantity: toPositiveNumber(value.quantity, 100),
    mealType: isMealType(value.mealType) ? value.mealType : "snack",
    eatenAt: toString(value.eatenAt, new Date().toISOString()),
    origin: isOrigin(value.origin) ? value.origin : "manual",
  };
};

const normalizeMealTemplate = (value: unknown): MealTemplate | null => {
  if (!isRecord(value)) return null;

  return {
    id: toString(value.id, createId("template")),
    name: toString(value.name, "Meal template"),
    mealType: isMealType(value.mealType) ? value.mealType : "snack",
    createdAt: toString(value.createdAt, new Date().toISOString()),
    items: Array.isArray(value.items)
      ? value.items
          .map((item) => normalizeMealTemplateItem(item))
          .filter((item): item is MealTemplateItem => item !== null)
      : [],
  };
};

const createMealEntry = ({
  product,
  quantity,
  mealType = "snack",
  origin = "manual",
  eatenAt,
}: {
  product: Product;
  quantity: number;
  mealType?: MealType;
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

export const calculateMealTotalNutrients = (items: MealEntry[]): Nutrients => {
  const totals = createEmptyNutrients();

  items.forEach((item) => {
    const factor = item.quantity / 100;
    const n = item.product.nutrients;

    nutrientKeys.forEach((key) => {
      totals[key] = (totals[key] ?? 0) + (n[key] ?? 0) * factor;
    });
  });

  return totals;
};

export const createInitialMealState = (): MealState => ({
  items: [],
  templates: [],
  totalNutrients: createEmptyNutrients(),
  savedProducts: [],
  recentProducts: [],
});

export const normalizeMealState = (value: unknown): MealState => {
  if (!isRecord(value)) {
    return createInitialMealState();
  }

  const items = Array.isArray(value.items)
    ? value.items
        .map((item) => normalizeMealEntry(item))
        .filter((item): item is MealEntry => item !== null)
    : [];

  const templates = Array.isArray(value.templates)
    ? value.templates
        .map((template) => normalizeMealTemplate(template))
        .filter((template): template is MealTemplate => template !== null)
    : [];
  const savedProducts = normalizeProductCollection(value.savedProducts);
  const recentProducts = normalizeProductCollection(value.recentProducts);

  return {
    items,
    templates,
    totalNutrients: calculateMealTotalNutrients(items),
    savedProducts,
    recentProducts,
  };
};

const initialState: MealState = createInitialMealState();

const mealSlice = createSlice({
  name: "meal",
  initialState,
  reducers: {
    addProduct(
      state,
      action: PayloadAction<{
        product: Product;
        quantity: number;
        mealType?: MealType;
        origin?: MealEntry["origin"];
        eatenAt?: string;
      }>
    ) {
      state.items.unshift(createMealEntry(action.payload));
      rememberProduct(state.recentProducts, action.payload.product, 16);
      recalcTotalNutrients(state);
    },

    addMealEntries(state, action: PayloadAction<MealEntry[]>) {
      state.items = [...action.payload, ...state.items];
      action.payload.forEach((entry) =>
        rememberProduct(state.recentProducts, entry.product, 16)
      );
      recalcTotalNutrients(state);
    },

    saveMealTemplate(
      state,
      action: PayloadAction<{
        name: string;
        mealType: MealType;
        items: MealTemplateItem[];
      }>
    ) {
      state.templates.unshift({
        id: createId("template"),
        name: action.payload.name,
        mealType: action.payload.mealType,
        items: action.payload.items,
        createdAt: new Date().toISOString(),
      });
    },

    applyMealTemplate(state, action: PayloadAction<string>) {
      const template = state.templates.find((item) => item.id === action.payload);
      if (!template) return;

      const eatenAt = new Date().toISOString();
      const entries = template.items.map((item) =>
        createMealEntry({
          product: item.product,
          quantity: item.quantity,
          mealType: template.mealType,
          origin: "recipe",
          eatenAt,
        })
      );

      state.items = [...entries, ...state.items];
      recalcTotalNutrients(state);
    },

    deleteMealTemplate(state, action: PayloadAction<string>) {
      state.templates = state.templates.filter(
        (template) => template.id !== action.payload
      );
    },

    saveProduct(state, action: PayloadAction<Product>) {
      rememberProduct(state.savedProducts, action.payload, 24);
    },

    removeSavedProduct(state, action: PayloadAction<string>) {
      state.savedProducts = state.savedProducts.filter(
        (product) => createProductKey(product) !== action.payload
      );
    },

    rememberRecentProduct(state, action: PayloadAction<Product>) {
      rememberProduct(state.recentProducts, action.payload, 16);
    },

    removeProduct(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
      recalcTotalNutrients(state);
    },

    clearMeal(state) {
      state.items = [];
      state.templates = [];
      state.totalNutrients = createEmptyNutrients();
      state.savedProducts = [];
      state.recentProducts = [];
    },
  },
});

const createProductKey = (product: Product) =>
  product.barcode?.trim() ||
  `${product.name.trim().toLowerCase()}-${product.brand?.trim().toLowerCase() ?? ""}`;

const rememberProduct = (list: Product[], product: Product, limit: number) => {
  const key = createProductKey(product);
  const next = [product, ...list.filter((item) => createProductKey(item) !== key)];
  list.splice(0, list.length, ...next.slice(0, limit));
};

const recalcTotalNutrients = (state: MealState) => {
  state.totalNutrients = calculateMealTotalNutrients(state.items);
};

export const {
  addProduct,
  addMealEntries,
  saveMealTemplate,
  applyMealTemplate,
  deleteMealTemplate,
  saveProduct,
  removeSavedProduct,
  rememberRecentProduct,
  removeProduct,
  clearMeal,
} = mealSlice.actions;

export default mealSlice.reducer;
