import type { PhotoMealAnalysis, PhotoMealSuggestion, PhotoPortionSize } from "../types/photo";

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
