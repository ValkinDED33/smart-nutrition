import { describe, expect, it } from "vitest";
import { getProductCategoryKey, getProductCategoryLabel } from "./productCategory";
import type { Product } from "./types";

const createProduct = (category: string): Product => ({
  id: "test-product",
  name: "Coca-Cola",
  unit: "ml",
  source: "OpenFoodFacts",
  category,
  nutrients: {
    calories: 42,
    protein: 0,
    fat: 0,
    saturatedFat: 0,
    monounsaturatedFat: 0,
    polyunsaturatedFat: 0,
    transFat: 0,
    omega3: 0,
    omega6: 0,
    omega9: 0,
    cholesterol: 0,
    carbs: 10.6,
    sugars: 10.6,
    fiber: 0,
    starch: 0,
    glucose: 0,
    fructose: 0,
    sucrose: 0,
    lactose: 0,
    water: 0,
    sodium: 0,
    potassium: 0,
    vitaminA: 0,
    vitaminB: 0,
    vitaminB1: 0,
    vitaminB2: 0,
    vitaminB3: 0,
    vitaminB5: 0,
    vitaminB6: 0,
    vitaminB7: 0,
    vitaminB9: 0,
    vitaminB12: 0,
    vitaminC: 0,
    vitaminD: 0,
    vitaminE: 0,
    vitaminK: 0,
    calcium: 0,
    iron: 0,
    magnesium: 0,
    zinc: 0,
    phosphorus: 0,
    iodine: 0,
    selenium: 0,
    copper: 0,
  },
});

describe("productCategory", () => {
  it("normalizes OpenFoodFacts beverage taxonomy into localized app categories", () => {
    const categoryKey = getProductCategoryKey(createProduct("en:carbonated-drinks"));

    expect(categoryKey).toBe("beverage");
    expect(getProductCategoryLabel(categoryKey, "uk")).toBe("Напої");
    expect(getProductCategoryLabel(categoryKey, "pl")).toBe("Napoje");
    expect(getProductCategoryLabel(categoryKey, "en")).toBe("Beverages");
  });

  it("normalizes broad OpenFoodFacts beverage preparation categories", () => {
    const categoryKey = getProductCategoryKey(
      createProduct("en:beverages-and-beverages-preparations")
    );

    expect(categoryKey).toBe("beverage");
    expect(getProductCategoryLabel(categoryKey, "uk")).toBe("Напої");
  });

  it("normalizes human-spaced OpenFoodFacts category labels from product cards", () => {
    const categoryKey = getProductCategoryKey(
      createProduct("Beverages And Beverages Preparations")
    );

    expect(categoryKey).toBe("beverage");
    expect(getProductCategoryLabel(categoryKey, "uk")).toBe("Напої");
    expect(getProductCategoryLabel(categoryKey, "pl")).toBe("Napoje");
    expect(
      getProductCategoryLabel("Beverages And Beverages Preparations", "uk")
    ).toBe("Напої");
  });
});
