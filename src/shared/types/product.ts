// src/shared/types/product.ts

export interface Nutrients {
  calories: number;
  protein: number;
  fat: number;
  saturatedFat: number;
  polyunsaturatedFat: number;
  transFat: number;
  cholesterol: number;
  carbs: number;
  sugars: number;
  fiber: number;
  sodium: number;
  potassium: number;
  vitaminA: number;
  vitaminB: number;
  vitaminC: number;
  vitaminD: number;
  vitaminE: number;
  vitaminK: number;
  calcium: number;
  iron: number;
  magnesium: number;
  zinc: number;
  phosphorus: number;

  // важно для безопасного перебора ключей
  [key: string]: number;
}

export type NutrientKey = keyof Nutrients;

export type ProductSource = "USDA" | "OpenFoodFacts" | "Manual" | "Recipe";

export interface Product {
  id: string;
  name: string;
  unit: "g" | "ml" | "piece";
  source: ProductSource;
  nutrients: Nutrients;
}
