import type { Product, Nutrients } from "../products/types";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type MealTypeValue = MealType;
export type ProductUnit = "g" | "ml" | "piece";
export type ProductSource = "USDA" | "OpenFoodFacts" | "Manual" | "Recipe";
export type MealOrigin = "manual" | "barcode" | "recipe";

export type { Nutrients, Product };

export interface UserProfile {
  dailyCalories: number;
  macroGoals?: MacroGoals;
  allergies: string[];
  excludedIngredients: string[];
  dietStyle?: "balanced" | "low_carb" | "high_protein";
}

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

export interface RecipeIngredient {
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

export interface MacroGoals {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface MacroProgress {
  current: number;
  target: number;
  progress: number;
}

export interface DailyNutrition {
  date: string;
  nutrients: Nutrients;
  mealCount: number;
  calorieProgress: MacroProgress;
  macroProgress: {
    protein: MacroProgress;
    fat: MacroProgress;
    carbs: MacroProgress;
  };
}
