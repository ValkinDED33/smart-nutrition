import { describe, expect, it } from "vitest";
import { buildVisionPrompt, normalizeVisionAnalysis } from "./visionAnalysis.mjs";

const templateBreakfastPayload = {
  dishName: "Breakfast photo draft",
  confidence: 0.28,
  imageQuality: "clear",
  interpretations: [
    {
      id: "candidate-1",
      title: "Breakfast photo draft",
      confidence: 0.28,
      reason: "Generic breakfast guess",
      items: [
        {
          name: "Greek yogurt",
          portionRangeGrams: { min: 120, max: 180 },
          confidence: 0.28,
          reason: "Template item",
          estimatedNutritionPer100g: {
            calories: 80,
            protein: 10,
            fat: 2,
            carbs: 4,
          },
        },
        {
          name: "Oats",
          portionRangeGrams: { min: 40, max: 70 },
          confidence: 0.26,
          reason: "Template item",
          estimatedNutritionPer100g: {
            calories: 380,
            protein: 13,
            fat: 7,
            carbs: 60,
          },
        },
        {
          name: "Banana",
          portionRangeGrams: { min: 80, max: 120 },
          confidence: 0.24,
          reason: "Template item",
          estimatedNutritionPer100g: {
            calories: 89,
            protein: 1,
            fat: 0,
            carbs: 23,
          },
        },
      ],
    },
  ],
};

describe("visionAnalysis", () => {
  it("asks the provider to recognize visible food in the user's language", () => {
    const prompt = buildVisionPrompt({
      mealType: "lunch",
      dietStyle: "balanced",
      blockedTokens: ["dairy"],
      language: "uk",
    });

    expect(prompt).toContain("recognition first");
    expect(prompt).toContain("language: uk");
    expect(prompt).toContain("Use uk for user-facing");
    expect(prompt).toContain("Never return a generic template breakfast");
    expect(prompt).toContain("Greek yogurt, oats, banana");
  });

  it("rejects generic breakfast template hallucinations instead of saving fake foods", () => {
    expect(normalizeVisionAnalysis(templateBreakfastPayload)).toBeNull();
  });

  it("rejects the same generic breakfast template even when the provider claims high confidence", () => {
    expect(
      normalizeVisionAnalysis({
        ...templateBreakfastPayload,
        confidence: 0.99,
        interpretations: templateBreakfastPayload.interpretations.map((interpretation) => ({
          ...interpretation,
          confidence: 0.99,
          items: interpretation.items.map((item) => ({ ...item, confidence: 0.99 })),
        })),
      })
    ).toBeNull();
  });

  it("keeps specific visible meal candidates for user review", () => {
    const result = normalizeVisionAnalysis({
      dishName: "Chicken rice bowl",
      confidence: 0.62,
      imageQuality: "clear",
      interpretations: [
        {
          id: "candidate-1",
          title: "Chicken rice bowl",
          confidence: 0.62,
          reason: "Visible rice and chicken pieces",
          items: [
            {
              name: "Rice cooked",
              portionRangeGrams: { min: 120, max: 200 },
              confidence: 0.65,
              reason: "Visible grain base",
              estimatedNutritionPer100g: {
                calories: 130,
                protein: 2.7,
                fat: 0.3,
                carbs: 28,
              },
            },
            {
              name: "Chicken breast",
              portionRangeGrams: { min: 100, max: 160 },
              confidence: 0.58,
              reason: "Visible sliced protein",
              estimatedNutritionPer100g: {
                calories: 165,
                protein: 31,
                fat: 3.6,
                carbs: 0,
              },
            },
          ],
        },
      ],
    });

    expect(result).toMatchObject({
      dishName: "Chicken rice bowl",
      recognitionStatus: "needs_review",
      manualReviewRequired: true,
      items: [
        { name: "Rice cooked" },
        { name: "Chicken breast" },
      ],
    });
  });
});
