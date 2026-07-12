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

  it("preserves restored product facts needed for scanner product cards", () => {
    const state = normalizeMealState({
      items: [
        {
          id: "meal-1",
          quantity: 330,
          mealType: "snack",
          eatenAt: "2026-05-03T10:00:00.000Z",
          origin: "barcode",
          product: {
            id: "cola",
            name: "Coca-Cola",
            unit: "ml",
            source: "OpenFoodFacts",
            nutrients: {
              calories: 42,
              carbs: 10.6,
            },
            facts: {
              foodGroup: "beverages",
              ingredientsText: "Woda gazowana, cukier, barwnik E150d.",
              ingredientsTextByLanguage: {
                pl: "Woda gazowana, cukier.",
                en: "Carbonated water, sugar.",
                ru: "must not restore",
              },
              additivesText: "E150D sulphite ammonia caramel",
              allergens: ["milk", "gluten"],
              traces: ["nuts"],
              servingSize: "330 ml",
              servingQuantity: 330,
              servingUnit: "ml",
            },
          },
        },
      ],
    });

    expect(state.items[0]?.product.facts).toMatchObject({
      foodGroup: "beverages",
      ingredientsText: "Woda gazowana, cukier, barwnik E150d.",
      ingredientsTextByLanguage: {
        pl: "Woda gazowana, cukier.",
        en: "Carbonated water, sugar.",
      },
      additivesText: "E150D sulphite ammonia caramel",
      allergens: ["milk", "gluten"],
      traces: ["nuts"],
      servingSize: "330 ml",
      servingQuantity: 330,
      servingUnit: "ml",
    });
    expect(state.items[0]?.product.facts?.ingredientsTextByLanguage).not.toHaveProperty("ru");
  });
});
