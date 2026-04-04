export type PhotoPortionSize = "light" | "regular" | "large";

export interface PhotoMealSuggestion {
  name: string;
  quantityGrams: number;
  confidence: number;
  reason: string;
  estimatedNutritionPer100g: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

export interface PhotoMealAnalysis {
  dishName: string;
  summary: string;
  confidence: number;
  estimatedPortions: number;
  cautions: string[];
  manualReviewRequired: boolean;
  items: PhotoMealSuggestion[];
}
