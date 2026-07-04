import type { PhotoMealAnalysis, PhotoMealSuggestion, PhotoPortionSize } from "../types/photo";
import type { Product } from "@domain/products/types";

const portionMultipliers: Record<PhotoPortionSize, number> = {
  light: 0.8,
  regular: 1,
  large: 1.25,
};

const roundToNearestFive = (value: number) => {
  const rounded = Math.round(value / 5) * 5;
  return Math.max(rounded, 5);
};

const roundPortions = (value: number) => Math.max(Math.round(value * 10) / 10, 0.5);

export const getPhotoPortionMultiplier = (size: PhotoPortionSize) =>
  portionMultipliers[size];

export const scalePhotoSuggestion = (
  suggestion: PhotoMealSuggestion,
  ratio: number
): PhotoMealSuggestion => ({
  ...suggestion,
  quantityGrams: roundToNearestFive(suggestion.quantityGrams * ratio),
  portionRangeGrams: suggestion.portionRangeGrams
    ? {
        min: roundToNearestFive(suggestion.portionRangeGrams.min * ratio),
        max: roundToNearestFive(suggestion.portionRangeGrams.max * ratio),
      }
    : undefined,
});

export const scalePhotoMealAnalysis = (
  analysis: PhotoMealAnalysis,
  size: PhotoPortionSize
): PhotoMealAnalysis => {
  const ratio = getPhotoPortionMultiplier(size);

  return {
    ...analysis,
    estimatedPortions: roundPortions(analysis.estimatedPortions * ratio),
    items: analysis.items.map((item) => scalePhotoSuggestion(item, ratio)),
  };
};

export const requiresPhotoMealConfirmation = (analysis: PhotoMealAnalysis) =>
  analysis.confidence < 0.7 || analysis.manualReviewRequired;

export const shouldStartWithSuggestionsOnly = (analysis: PhotoMealAnalysis) =>
  analysis.confidence < 0.35;

export const createBlankPhotoSuggestion = (): PhotoMealSuggestion => ({
  name: "",
  originalName: "",
  quantityGrams: 100,
  portionRangeGrams: { min: 75, max: 125 },
  confidence: 0,
  reason: "Added manually by the user as a correction to the AI photo estimate.",
  uncertain: false,
  estimatedNutritionPer100g: {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  },
});

const normalizeLookupText = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-zа-яієїґąęłńóśźż0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const isUsefulNutritionMatch = (product: Product) =>
  product.nutrients.calories > 0 ||
  product.nutrients.protein > 0 ||
  product.nutrients.fat > 0 ||
  product.nutrients.carbs > 0;

export const chooseBestPhotoProductMatch = (
  products: Product[],
  suggestion: Pick<PhotoMealSuggestion, "name">
): Product | null => {
  const query = normalizeLookupText(suggestion.name);

  if (query.length < 3) {
    return null;
  }

  const scored = products
    .map((product) => {
      const name = normalizeLookupText(product.name);
      const brand = normalizeLookupText(product.brand ?? "");
      const text = [name, brand].filter(Boolean).join(" ");

      if (!name || !isUsefulNutritionMatch(product)) {
        return { product, score: 0 };
      }

      if (name === query) {
        return { product, score: 100 };
      }

      if (text === query) {
        return { product, score: 96 };
      }

      if (name.includes(query) || query.includes(name)) {
        const lengthRatio = Math.min(name.length, query.length) / Math.max(name.length, query.length);
        return { product, score: Math.round(88 * lengthRatio) };
      }

      const queryTokens = new Set(query.split(" ").filter((token) => token.length > 2));
      const nameTokens = new Set(text.split(" ").filter((token) => token.length > 2));
      const matchedTokens = [...queryTokens].filter((token) => nameTokens.has(token)).length;
      const tokenScore = queryTokens.size > 0 ? matchedTokens / queryTokens.size : 0;

      return { product, score: Math.round(tokenScore * 72) };
    })
    .sort((left, right) => right.score - left.score);

  const best = scored[0];

  return best && best.score >= 72 ? best.product : null;
};

export const rescalePhotoMealAnalysis = (
  analysis: PhotoMealAnalysis,
  fromSize: PhotoPortionSize,
  toSize: PhotoPortionSize
): PhotoMealAnalysis => {
  const ratio = getPhotoPortionMultiplier(toSize) / getPhotoPortionMultiplier(fromSize);

  return {
    ...analysis,
    estimatedPortions: roundPortions(analysis.estimatedPortions * ratio),
    items: analysis.items.map((item) => scalePhotoSuggestion(item, ratio)),
  };
};
