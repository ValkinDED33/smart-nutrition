import { describe, expect, it } from "vitest";
import { normalizeMealState } from "./mealSlice";

describe("mealSlice normalization", () => {
  it("bounds synced products, quantities, nutrients, and image URLs", () => {
    const state = normalizeMealState({
      items: [
        {
          id: "meal-1",
          quantity: 999999999,
          mealType: "lunch",
          eatenAt: "2026-05-03T10:00:00.000Z",
          origin: "manual",
          product: {
            id: "product-1",
            name: "A".repeat(300),
            unit: "g",
            source: "Manual",
            imageUrl: "javascript:alert(1)",
            nutrients: {
              calories: -25,
              protein: 999999999,
              fat: 10,
              carbs: 20,
            },
          },
        },
      ],
    });

    const entry = state.items[0];

    expect(entry?.quantity).toBe(100000);
    expect(entry?.product.name).toHaveLength(160);
    expect(entry?.product.imageUrl).toBeUndefined();
    expect(entry?.product.nutrients.calories).toBe(0);
    expect(entry?.product.nutrients.protein).toBe(100000);
  });
});
