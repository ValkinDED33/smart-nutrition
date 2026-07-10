import { describe, expect, it } from "vitest";
import {
  chooseBestPhotoProductMatch,
  getPhotoPortionMultiplier,
  createBlankPhotoSuggestion,
  requiresPhotoMealConfirmation,
  rescalePhotoMealAnalysis,
  scalePhotoMealAnalysis,
  shouldStartWithSuggestionsOnly,
} from "./photoDraft";
import type { PhotoMealAnalysis } from "../types/photo";
import { createEmptyNutrients } from "@domain/meal/nutrients";
import type { Product } from "@domain/products/types";

const CHICKEN_BREAST_NAME = "Chicken breast";

const baseAnalysis: PhotoMealAnalysis = {
  dishName: "Lunch photo draft",
  summary: "Draft summary",
  confidence: 0.2,
  estimatedPortions: 1,
  cautions: [],
  manualReviewRequired: true,
  items: [
    {
      name: CHICKEN_BREAST_NAME,
      quantityGrams: 160,
      portionRangeGrams: { min: 120, max: 200 },
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
    expect(scaled.items[0]?.portionRangeGrams).toEqual({ min: 150, max: 250 });
  });

  it("rescales an already created draft between presets", () => {
    const rescaled = rescalePhotoMealAnalysis(baseAnalysis, "regular", "light");

    expect(rescaled.estimatedPortions).toBe(0.8);
    expect(rescaled.items[0]?.quantityGrams).toBe(130);
  });

  it("keeps low-confidence photo analysis behind confirmation gates", () => {
    expect(requiresPhotoMealConfirmation(baseAnalysis)).toBe(true);
    expect(shouldStartWithSuggestionsOnly(baseAnalysis)).toBe(true);
  });

  it("creates a blank user correction suggestion", () => {
    expect(createBlankPhotoSuggestion()).toMatchObject({
      name: "",
      confidence: 0,
      portionRangeGrams: { min: 75, max: 125 },
      reason: expect.stringContaining("correction"),
    });
  });

  it("chooses only useful strict product matches for confirmed photo ingredients", () => {
    const nutrients = createEmptyNutrients();
    nutrients.calories = 165;
    nutrients.protein = 31;

    const products: Product[] = [
      {
        id: "apple",
        name: "Apple juice",
        unit: "g",
        source: "OpenFoodFacts",
        nutrients: createEmptyNutrients(),
      },
      {
        id: "chicken",
        name: CHICKEN_BREAST_NAME,
        unit: "g",
        source: "OpenFoodFacts",
        nutrients,
      },
    ];

    expect(chooseBestPhotoProductMatch(products, { name: CHICKEN_BREAST_NAME })?.id).toBe(
      "chicken"
    );
    expect(chooseBestPhotoProductMatch(products, { name: "Chocolate cake" })).toBeNull();
    expect(
      chooseBestPhotoProductMatch([{ ...products[1]!, nutrients: createEmptyNutrients() }], {
        name: CHICKEN_BREAST_NAME,
      })
    ).toBeNull();
  });
});
