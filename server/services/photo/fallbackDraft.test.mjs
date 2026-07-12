import { describe, expect, it } from "vitest";
import { createFallbackPhotoAnalysis } from "./fallbackDraft.mjs";

const image = {
  width: 2,
  height: 2,
  originalFormat: "png",
  normalizedFormat: "jpeg",
  normalizedBytes: 128,
};

describe("fallbackDraft", () => {
  it("builds an honest low-confidence review draft with portion ranges", () => {
    const result = createFallbackPhotoAnalysis({
      mealType: "breakfast",
      dietStyle: "balanced",
      blockedTokens: [],
      mealState: {},
      image,
    });

    expect(result).toMatchObject({
      dishName: "Breakfast photo draft",
      image,
      manualReviewRequired: true,
      summary: expect.stringContaining("Please check ingredients and portions before saving"),
      hiddenIngredientQuestions: expect.arrayContaining([expect.stringContaining("sauces")]),
    });
    expect(result.summary).not.toContain("AI estimate");
    expect(result.cautions.join(" ")).not.toContain("AI estimate");
    expect(result.interpretations.map((item) => item.title).join(" ")).not.toMatch(
      /candidate|alternative/i
    );
    expect(result.interpretations.map((item) => item.reason).join(" ")).not.toMatch(
      /candidate|alternative/i
    );
    expect(result.confidence).toBeLessThan(0.7);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0]).toMatchObject({
      uncertain: true,
      portionRangeGrams: {
        min: expect.any(Number),
        max: expect.any(Number),
      },
    });
    expect(result.items[0].portionRangeGrams.max).toBeGreaterThan(
      result.items[0].portionRangeGrams.min
    );
  });

  it("filters blocked ingredients from the primary fallback candidates", () => {
    const result = createFallbackPhotoAnalysis({
      mealType: "breakfast",
      dietStyle: "balanced",
      blockedTokens: ["dairy", "gluten"],
      mealState: {},
      image,
    });

    const primaryNames = result.interpretations[0].items.map((item) => item.name);

    expect(primaryNames).not.toContain("Greek yogurt");
    expect(primaryNames).not.toContain("Oats");
    expect(primaryNames).toContain("Banana");
  });

  it("prioritizes previously confirmed photo corrections without making them certain", () => {
    const result = createFallbackPhotoAnalysis({
      mealType: "lunch",
      dietStyle: "balanced",
      blockedTokens: [],
      image,
      mealState: {
        items: [
          {
            quantity: 140,
            product: {
              name: "Turkey wrap",
              facts: {
                extraCompounds: ["photo-feedback:user-confirmed"],
              },
              nutrients: {
                calories: 210,
                protein: 16,
                fat: 8,
                carbs: 22,
              },
            },
          },
        ],
      },
    });

    expect(result.interpretations[0]).toMatchObject({
      id: "user-confirmed-history",
      title: "Previously confirmed by you",
    });
    expect(result.items[0]).toMatchObject({
      name: "Turkey wrap",
      reason: expect.stringContaining("Previously confirmed"),
      estimatedNutritionPer100g: {
        calories: 210,
        protein: 16,
        fat: 8,
        carbs: 22,
      },
    });
    expect(result.confidence).toBeLessThan(0.7);
  });
});
