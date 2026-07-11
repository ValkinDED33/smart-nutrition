import { describe, expect, it } from "vitest";
import type { Product } from "./types";
import {
  formatProductBaseAmount,
  getDefaultProductQuantity,
  getProductPortionPresets,
} from "./productPortions";

const createProduct = (unit: Product["unit"], facts: Product["facts"] = {}): Product => ({
  id: "test-product",
  name: "Test product",
  unit,
  source: "OpenFoodFacts",
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
  facts,
});

describe("productPortions", () => {
  it("uses beverage-friendly presets and the confirmed serving quantity for ml products", () => {
    const product = createProduct("ml", {
      servingQuantity: 330,
      servingUnit: "ml",
      servingSize: "330 ml",
    });

    expect(getDefaultProductQuantity(product)).toBe(330);
    expect(getProductPortionPresets(product)).toEqual([100, 250, 330, 500]);
    expect(formatProductBaseAmount(product.unit)).toBe("100 ml");
  });

  it("keeps gram products on food portions", () => {
    const product = createProduct("g");

    expect(getDefaultProductQuantity(product)).toBe(100);
    expect(getProductPortionPresets(product)).toEqual([50, 100, 150, 200]);
    expect(formatProductBaseAmount(product.unit)).toBe("100 g");
  });
});
