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
  it("builds an honest empty review draft instead of fake template foods", () => {
    const result = createFallbackPhotoAnalysis({
      mealType: "breakfast",
      dietStyle: "balanced",
      blockedTokens: [],
      mealState: {},
      image,
    });

    expect(result).toMatchObject({
      dishName: "Photo needs checking",
      image,
      manualReviewRequired: true,
      recognitionStatus: "needs_better_photo",
      summary: expect.stringContaining("could not confidently identify"),
      hiddenIngredientQuestions: expect.arrayContaining([
        expect.stringContaining("brighter light"),
        expect.stringContaining("without blur"),
        expect.stringContaining("sauces"),
      ]),
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
    expect(result.items).toEqual([]);
    expect(result.interpretations).toEqual([]);
  });

  it("does not use meal type templates as fake photo recognition results", () => {
    const result = createFallbackPhotoAnalysis({
      mealType: "breakfast",
      dietStyle: "balanced",
      blockedTokens: ["dairy", "gluten"],
      mealState: {},
      image,
    });

    expect(result.items.map((item) => item.name)).not.toEqual(
      expect.arrayContaining(["Greek yogurt", "Oats", "Banana"])
    );
    expect(result.uncertainIngredients).toEqual([]);
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
    expect(result.recognitionStatus).toBe("needs_review");
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
