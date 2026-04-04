import { describe, expect, it } from "vitest";
import {
  getPhotoPortionMultiplier,
  rescalePhotoMealAnalysis,
  scalePhotoMealAnalysis,
} from "./photoDraft";
import type { PhotoMealAnalysis } from "../types/photo";

const baseAnalysis: PhotoMealAnalysis = {
  dishName: "Lunch photo draft",
  summary: "Draft summary",
  confidence: 0.2,
  estimatedPortions: 1,
  cautions: [],
  manualReviewRequired: true,
  items: [
    {
      name: "Chicken breast",
      quantityGrams: 160,
      confidence: 0.2,
      reason: "Draft item",
      estimatedNutritionPer100g: {
        calories: 165,
        protein: 31,
        fat: 3.6,
        carbs: 0,
      },
    },
  ],
};

describe("photoDraft helpers", () => {
  it("returns stable multipliers for portion presets", () => {
    expect(getPhotoPortionMultiplier("light")).toBe(0.8);
    expect(getPhotoPortionMultiplier("regular")).toBe(1);
    expect(getPhotoPortionMultiplier("large")).toBe(1.25);
  });

  it("scales analysis quantities for a large portion", () => {
    const scaled = scalePhotoMealAnalysis(baseAnalysis, "large");

    expect(scaled.estimatedPortions).toBe(1.3);
    expect(scaled.items[0]?.quantityGrams).toBe(200);
  });

  it("rescales an already created draft between presets", () => {
    const rescaled = rescalePhotoMealAnalysis(baseAnalysis, "regular", "light");

    expect(rescaled.estimatedPortions).toBe(0.8);
    expect(rescaled.items[0]?.quantityGrams).toBe(130);
  });
});
