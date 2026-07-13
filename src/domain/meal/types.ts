import type { Product } from "../products/types";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
type MealOrigin = "manual" | "barcode" | "recipe";

export interface MealEntry {
  id: string;
  product: Product;
  quantity: number;
  mealType: MealType;
  eatenAt: string;
  origin: MealOrigin;
}

export interface MealTemplateItem {
  product: Product;
  quantity: number;
}

export interface MealTemplate {
  id: string;
  name: string;
  mealType: MealType;
  items: MealTemplateItem[];
  createdAt: string;
}

interface RecipeIngredient {
  product: Product;
  quantity: number;
}

export interface Recipe {
  id: string;
  title: string;
  mealType: MealType;
  description: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}
