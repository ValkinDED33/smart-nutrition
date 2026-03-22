import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Nutrients, Product } from "../../shared/types/product";
import type {
  MealEntry,
  MealTemplate,
  MealTemplateItem,
  MealType,
} from "../../shared/types/meal";

export interface MealState {
  items: MealEntry[];
  templates: MealTemplate[];
  totalNutrients: Nutrients;
}

export const createEmptyNutrients = (): Nutrients => ({
  calories: 0,
  protein: 0,
  fat: 0,
  saturatedFat: 0,
  polyunsaturatedFat: 0,
  transFat: 0,
  cholesterol: 0,
  carbs: 0,
  sugars: 0,
  fiber: 0,
  sodium: 0,
  potassium: 0,
  vitaminA: 0,
  vitaminB: 0,
  vitaminC: 0,
  vitaminD: 0,
  vitaminE: 0,
  vitaminK: 0,
  calcium: 0,
  iron: 0,
  magnesium: 0,
  zinc: 0,
  phosphorus: 0,
});

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

  return {
    calories: toNumber(record.calories),
    protein: toNumber(record.protein),
    fat: toNumber(record.fat),
    saturatedFat: toNumber(record.saturatedFat),
    polyunsaturatedFat: toNumber(record.polyunsaturatedFat),
    transFat: toNumber(record.transFat),
    cholesterol: toNumber(record.cholesterol),
    carbs: toNumber(record.carbs),
    sugars: toNumber(record.sugars),
    fiber: toNumber(record.fiber),
    sodium: toNumber(record.sodium),
    potassium: toNumber(record.potassium),
    vitaminA: toNumber(record.vitaminA),
    vitaminB: toNumber(record.vitaminB),
    vitaminC: toNumber(record.vitaminC),
    vitaminD: toNumber(record.vitaminD),
    vitaminE: toNumber(record.vitaminE),
    vitaminK: toNumber(record.vitaminK),
    calcium: toNumber(record.calcium),
    iron: toNumber(record.iron),
    magnesium: toNumber(record.magnesium),
    zinc: toNumber(record.zinc),
    phosphorus: toNumber(record.phosphorus),
  };
};

const normalizeProduct = (value: unknown): Product => {
  const record = isRecord(value) ? value : {};

  return {
    id: toString(record.id, createId("product")),
    name: toString(record.name, "Unknown product"),
    unit: isUnit(record.unit) ? record.unit : "g",
    source: isSource(record.source) ? record.source : "Manual",
    nutrients: normalizeNutrients(record.nutrients),
  };
};

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

    totals.calories += n.calories * factor;
    totals.protein += n.protein * factor;
    totals.fat += n.fat * factor;
    totals.saturatedFat += n.saturatedFat * factor;
    totals.polyunsaturatedFat += n.polyunsaturatedFat * factor;
    totals.transFat += n.transFat * factor;
    totals.cholesterol += n.cholesterol * factor;
    totals.carbs += n.carbs * factor;
    totals.sugars += n.sugars * factor;
    totals.fiber += n.fiber * factor;
    totals.sodium += n.sodium * factor;
    totals.potassium += n.potassium * factor;
    totals.vitaminA += n.vitaminA * factor;
    totals.vitaminB += n.vitaminB * factor;
    totals.vitaminC += n.vitaminC * factor;
    totals.vitaminD += n.vitaminD * factor;
    totals.vitaminE += n.vitaminE * factor;
    totals.vitaminK += n.vitaminK * factor;
    totals.calcium += n.calcium * factor;
    totals.iron += n.iron * factor;
    totals.magnesium += n.magnesium * factor;
    totals.zinc += n.zinc * factor;
    totals.phosphorus += n.phosphorus * factor;
  });

  return totals;
};

export const createInitialMealState = (): MealState => ({
  items: [],
  templates: [],
  totalNutrients: createEmptyNutrients(),
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

  return {
    items,
    templates,
    totalNutrients: calculateMealTotalNutrients(items),
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
      recalcTotalNutrients(state);
    },

    addMealEntries(state, action: PayloadAction<MealEntry[]>) {
      state.items = [...action.payload, ...state.items];
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

    removeProduct(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
      recalcTotalNutrients(state);
    },

    clearMeal(state) {
      state.items = [];
      state.templates = [];
      state.totalNutrients = createEmptyNutrients();
    },
  },
});

const recalcTotalNutrients = (state: MealState) => {
  state.totalNutrients = calculateMealTotalNutrients(state.items);
};

export const {
  addProduct,
  addMealEntries,
  saveMealTemplate,
  applyMealTemplate,
  deleteMealTemplate,
  removeProduct,
  clearMeal,
} = mealSlice.actions;

export default mealSlice.reducer;
