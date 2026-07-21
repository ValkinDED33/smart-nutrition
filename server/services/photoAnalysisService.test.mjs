import { describe, expect, it } from "vitest";
import { createPhotoAnalysisService } from "./photoAnalysisService.mjs";

const tinyPng =
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADklEQVR4nGP4DwYMEAoAU7oL9ZisIGcAAAAASUVORK5CYII=";

describe("photoAnalysisService", () => {
  it("accepts only bounded raster photo data URLs", async () => {
    const service = createPhotoAnalysisService();

    await expect(
      service.analyzePhoto({}, { imageDataUrl: "data:image/svg+xml;base64,PHN2Zy8+" })
    ).rejects.toMatchObject({
      code: "INVALID_PHOTO_PAYLOAD",
    });

    await expect(
      service.analyzePhoto(
        {},
        { imageDataUrl: `data:image/png;base64,${"a".repeat(1_700_000)}` }
      )
    ).rejects.toMatchObject({
      code: "INVALID_PHOTO_PAYLOAD",
    });

    await expect(
      service.analyzePhoto({}, { imageDataUrl: `data:image/jpeg;base64,${tinyPng}` })
    ).rejects.toMatchObject({
      code: "INVALID_PHOTO_PAYLOAD",
    });

    await expect(
      service.analyzePhoto(
        { dietStyle: "balanced" },
        { imageDataUrl: `data:image/png;base64,${tinyPng}`, mealType: "breakfast" }
      )
    ).resolves.toMatchObject({
      image: {
        width: 2,
        height: 2,
        originalFormat: "png",
        normalizedFormat: "jpeg",
      },
      manualReviewRequired: true,
      summary: expect.stringContaining("could not confidently identify"),
      items: [],
      interpretations: [],
      hiddenIngredientQuestions: expect.arrayContaining([
        expect.stringContaining("sauces"),
      ]),
    });
    const result = await service.analyzePhoto(
      { dietStyle: "balanced" },
      { imageDataUrl: `data:image/png;base64,${tinyPng}`, mealType: "breakfast" }
    );
    expect(result.summary).not.toContain("AI estimate");
    expect(result.cautions.join(" ")).not.toContain("AI estimate");
  });

  it("does not reuse previous confirmed photo corrections as visual recognition", async () => {
    const service = createPhotoAnalysisService();
    const result = await service.analyzePhoto(
      { dietStyle: "balanced" },
      { imageDataUrl: `data:image/png;base64,${tinyPng}`, mealType: "lunch" },
      {
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
      }
    );

    expect(result.recognitionStatus).toBe("needs_better_photo");
    expect(result.confidence).toBe(0);
    expect(result.items).toEqual([]);
    expect(result.interpretations).toEqual([]);
    expect(result.summary).toContain("better light");
  });

  it("uses a configured vision provider without trusting fake certainty", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      dishName: "Chicken wrap",
                      summary: "Looks like a wrap with visible protein.",
                      confidence: 0.99,
                      uncertainIngredients: ["sauce"],
                      hiddenIngredientQuestions: ["Is there sauce inside the wrap?"],
                      interpretations: [
                        {
                          id: "wrap",
                          title: "Chicken wrap",
                          confidence: 0.99,
                          reason: "Visible tortilla and sliced filling.",
                          items: [
                            {
                              name: "Tortilla wrap",
                              portionRangeGrams: { min: 60, max: 90 },
                              confidence: 0.99,
                              reason: "Visible wrap bread.",
                              uncertain: false,
                              estimatedNutritionPer100g: {
                                calories: 310,
                                protein: 8,
                                fat: 8,
                                carbs: 52,
                              },
                            },
                          ],
                        },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );

    try {
      const service = createPhotoAnalysisService({
        config: {
          assistantProviders: [
            {
              id: "google",
              apiKey: "test-key",
              model: "gemini-test",
              baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
              timeoutMs: 1_000,
            },
          ],
        },
      });
      const result = await service.analyzePhoto(
        { dietStyle: "balanced" },
        { imageDataUrl: `data:image/png;base64,${tinyPng}`, mealType: "lunch" }
      );

      expect(result.summary).toContain("Please check ingredients and portions before saving");
      expect(result.summary).not.toContain("AI estimate");
      expect(result.manualReviewRequired).toBe(true);
      expect(result.recognitionStatus).toBe("recognized");
      expect(result.confidence).toBeLessThan(0.9);
      expect(result.items[0]).toMatchObject({
        name: "Tortilla wrap",
        portionRangeGrams: { min: 60, max: 90 },
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("tries the next real vision provider instead of returning a template when the first one fails", async () => {
    const originalFetch = globalThis.fetch;
    const calls = [];

    globalThis.fetch = async (url) => {
      calls.push(String(url));

      if (calls.length === 1) {
        return new Response(JSON.stringify({ error: "model does not support images" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      dishName: "Cinnamon roll",
                      summary: "A spiral pastry is visible on the plate.",
                      imageQuality: "unclear",
                      confidence: 0.68,
                      uncertainIngredients: ["filling"],
                      hiddenIngredientQuestions: ["Is there glaze or extra butter?"],
                      interpretations: [
                        {
                          id: "cinnamon-roll",
                          title: "Cinnamon roll",
                          confidence: 0.68,
                          reason: "Visible spiral pastry shape.",
                          items: [
                            {
                              name: "Cinnamon roll",
                              portionRangeGrams: { min: 80, max: 140 },
                              confidence: 0.68,
                              reason: "Visible baked spiral pastry.",
                              uncertain: true,
                              estimatedNutritionPer100g: {
                                calories: 380,
                                protein: 6,
                                fat: 14,
                                carbs: 58,
                              },
                            },
                          ],
                        },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    try {
      const service = createPhotoAnalysisService({
        config: {
          assistantProviders: [
            {
              id: "openrouter",
              apiKey: "openrouter-key",
              model: "text-only-test",
              baseUrl: "https://openrouter.ai/api/v1",
              apiPath: "/chat/completions",
              timeoutMs: 1_000,
            },
            {
              id: "groq",
              apiKey: "groq-key",
              model: "llama-text-test",
              baseUrl: "https://api.groq.com/openai/v1",
              apiPath: "/chat/completions",
              timeoutMs: 1_000,
            },
            {
              id: "google",
              apiKey: "google-key",
              model: "gemini-test",
              baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
              timeoutMs: 1_000,
            },
          ],
        },
      });
      const result = await service.analyzePhoto(
        { dietStyle: "balanced" },
        { imageDataUrl: `data:image/png;base64,${tinyPng}`, mealType: "breakfast" }
      );

      expect(calls).toHaveLength(2);
      expect(calls[0]).toContain("openrouter.ai");
      expect(calls[1]).toContain("generativelanguage.googleapis.com");
      expect(calls.join(" ")).not.toContain("groq.com");
      expect(result.items).toHaveLength(1);
      expect(result.recognitionStatus).toBe("needs_better_photo");
      expect(result.items[0]).toMatchObject({
        name: "Cinnamon roll",
        portionRangeGrams: { min: 80, max: 140 },
      });
      expect(result.items.map((item) => item.name)).not.toEqual([
        "Greek yogurt",
        "Oats",
        "Banana",
      ]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
