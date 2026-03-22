import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Nutrients, Product } from "../../shared/types/product";
import type {
  MealEntry,
  MealTemplate,
  MealTemplateItem,
  MealType,
} from "../../shared/types/meal";

interface MealState {
  items: MealEntry[];
  templates: MealTemplate[];
  totalNutrients: Nutrients;
}

const createEmptyNutrients = (): Nutrients => ({
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

const initialState: MealState = {
  items: [],
  templates: [],
  totalNutrients: createEmptyNutrients(),
};

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
  const totals = createEmptyNutrients();

  state.items.forEach((item) => {
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

  state.totalNutrients = totals;
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
