// src/features/meal/mealSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Product, Nutrients } from "../../shared/types/product";

// MealItem хранит только продукт и количество
export interface MealItem {
  product: Product;
  quantity: number; // грамм / мл
}

interface MealState {
  items: MealItem[];
  totalNutrients: Nutrients;
}

// Функция создания пустых нутриентов
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

const initialState: MealState = {
  items: [],
  totalNutrients: createEmptyNutrients(),
};

const mealSlice = createSlice({
  name: "meal",
  initialState,
  reducers: {
    addProduct(
      state,
      action: PayloadAction<{ product: Product; quantity: number }>
    ) {
      const { product, quantity } = action.payload;

      const existing = state.items.find(
        (item) => item.product.id === product.id
      );

      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({ product, quantity });
      }

      recalcTotalNutrients(state);
    },

    removeProduct(state, action: PayloadAction<string>) {
      state.items = state.items.filter(
        (item) => item.product.id !== action.payload
      );

      recalcTotalNutrients(state);
    },

    clearMeal(state) {
      state.items = [];
      state.totalNutrients = createEmptyNutrients();
    },

    setMeal(state, action: PayloadAction<MealItem[]>) {
      state.items = action.payload;
      recalcTotalNutrients(state);
    },
  },
});

// Пересчёт суммарных нутриентов
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

export const { addProduct, removeProduct, clearMeal, setMeal } =
  mealSlice.actions;

export default mealSlice.reducer;
