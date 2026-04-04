import { describe, expect, it } from "vitest";
import { mockProducts } from "./mockProducts";
import {
  createDefaultNutritionPreferences,
  productMatchesPreferences,
  recipeMatchesPreferences,
} from "./preferences";

describe("preferences filters", () => {
  it("blocks products that violate vegan preferences", () => {
    const preferences = {
      ...createDefaultNutritionPreferences(),
      dietStyle: "vegan" as const,
    };
    const greekYogurt = mockProducts.find((product) => product.id === "manual-greek-yogurt");
    const tofu = mockProducts.find((product) => product.id === "manual-tofu");

    expect(greekYogurt).toBeDefined();
    expect(tofu).toBeDefined();
    expect(productMatchesPreferences(greekYogurt!, preferences)).toBe(false);
    expect(productMatchesPreferences(tofu!, preferences)).toBe(true);
  });

  it("blocks products matching excluded ingredients", () => {
    const preferences = {
      ...createDefaultNutritionPreferences(),
      excludedIngredients: ["banana"],
    };
    const banana = mockProducts.find((product) => product.id === "manual-banana");

    expect(productMatchesPreferences(banana!, preferences)).toBe(false);
  });

  it("filters recipes through ingredient preferences", () => {
    const preferences = {
      ...createDefaultNutritionPreferences(),
      dietStyle: "vegetarian" as const,
    };
    const vegetarianRecipe = {
      ingredients: [
        {
          product: mockProducts.find((product) => product.id === "manual-tofu")!,
          quantity: 150,
        },
      ],
    };
    const nonVegetarianRecipe = {
      ingredients: [
        {
          product: mockProducts.find((product) => product.id === "manual-chicken-breast")!,
          quantity: 150,
        },
      ],
    };

    expect(recipeMatchesPreferences(vegetarianRecipe as never, preferences)).toBe(true);
    expect(recipeMatchesPreferences(nonVegetarianRecipe as never, preferences)).toBe(false);
  });
});
