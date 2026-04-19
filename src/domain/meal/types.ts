/**
 * Meal Domain Types
 * 
 * Pure domain model - independent from any framework or database
 */

export type MealTypeValue = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type ProductUnit = 'g' | 'ml' | 'piece';
export type ProductSource = 'USDA' | 'OpenFoodFacts' | 'Manual' | 'Recipe';
export type MealOrigin = 'manual' | 'barcode' | 'recipe';

/**
 * Nutrients per 100g
 */
export interface Nutrients {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sugar: number;
  sodium: number;
  calcium: number;
  iron: number;
}

/**
 * Product - represents a food item in the catalog
 */
export interface Product {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  unit: ProductUnit;
  source: ProductSource;
  nutrients: Nutrients;
  imageUrl?: string;
  facts?: {
    foodGroup?: string;
    carbohydrateTypes?: string[];
    proteinTypes?: string[];
    fatTypes?: string[];
    extraCompounds?: string[];
  };
}

/**
 * Meal Entry - represents a logged meal
 */
export interface MealEntry {
  id: string;
  product: Product;
  quantity: number; // in grams/ml/pieces depending on product.unit
  mealType: MealTypeValue;
  eatenAt: Date;
  origin: MealOrigin;
}

/**
 * Macro goals per day
 */
export interface MacroGoals {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

/**
 * Macro progress tracking
 */
export interface MacroProgress {
  current: number;
  target: number;
  progress: number; // 0-100
}

/**
 * Daily nutrition snapshot
 */
export interface DailyNutrition {
  date: string; // YYYY-MM-DD
  nutrients: Nutrients;
  mealCount: number;
  calorieProgress: MacroProgress;
  macroProgress: {
    protein: MacroProgress;
    fat: MacroProgress;
    carbs: MacroProgress;
  };
}

/**
 * User profile - for meal calculations
 */
export interface UserProfile {
  dailyCalories: number;
  macroGoals: MacroGoals;
  allergies: string[];
  excludedIngredients: string[];
  dietStyle: 'balanced' | 'low_carb' | 'low_fat' | 'high_protein';
}
