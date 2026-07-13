export type PhotoPortionSize = "light" | "regular" | "large";
type PhotoRecognitionStatus = "recognized" | "needs_review" | "needs_better_photo";

export interface PhotoMealSuggestion {
  name: string;
  originalName?: string;
  quantityGrams: number;
  portionRangeGrams?: {
    min: number;
    max: number;
  };
  confidence: number;
  reason: string;
  uncertain?: boolean;
  estimatedNutritionPer100g: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

interface PhotoMealInterpretation {
  id: string;
  title: string;
  confidence: number;
  reason: string;
  items: PhotoMealSuggestion[];
}

export interface PhotoMealAnalysis {
  dishName: string;
  summary: string;
  recognitionStatus?: PhotoRecognitionStatus;
  confidence: number;
  estimatedPortions: number;
  cautions: string[];
  uncertainIngredients?: string[];
  hiddenIngredientQuestions?: string[];
  interpretations?: PhotoMealInterpretation[];
  manualReviewRequired: boolean;
  items: PhotoMealSuggestion[];
}
