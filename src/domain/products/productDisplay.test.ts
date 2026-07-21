import { describe, expect, it } from "vitest";
import {
  getProductDisplayName,
  getProductSourceLabel,
} from "./productDisplay";
import type { Product } from "./types";

const createProduct = (id: string, name: string): Product => ({
  id,
  name,
  unit: "g",
  source: "Manual",
  nutrients: {
    calories: 100,
    protein: 10,
    fat: 2,
    saturatedFat: 0,
    monounsaturatedFat: 0,
    polyunsaturatedFat: 0,
    transFat: 0,
    omega3: 0,
    omega6: 0,
    omega9: 0,
    cholesterol: 0,
    carbs: 12,
    sugars: 0,
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

describe("productDisplay", () => {
  it("localizes known starter product names", () => {
    const product = createProduct("manual-greek-yogurt", "Greek yogurt");

    expect(getProductDisplayName(product, "uk")).toBe("Грецький йогурт");
    expect(getProductDisplayName(product, "pl")).toBe("Jogurt grecki");
    expect(getProductDisplayName(product, "en")).toBe("Greek yogurt");
  });

  it("turns provider source ids into human product copy", () => {
    expect(getProductSourceLabel("OpenFoodFacts", "uk")).toBe("Онлайн-каталог");
    expect(getProductSourceLabel("OpenFoodFacts", "pl")).toBe("Katalog online");
    expect(getProductSourceLabel("OpenFoodFacts", "en")).toBe("Online catalog");
    expect(getProductSourceLabel("Manual", "uk")).toBe("Власний продукт");
    expect(getProductSourceLabel("USDA", "pl")).toBe("Baza żywieniowa");
  });
});
