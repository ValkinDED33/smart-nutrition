import { describe, expect, it } from "vitest";
import type { MealEntry } from "./mealSlice";
import { createInitialMealState } from "./mealSlice";
import { buildMealStateAfterAddEntries } from "./mealSaveModel";

const createEntry = (id: string, barcode?: string): MealEntry => ({
  id,
  product: {
    id: `product-${id}`,
    name: `Product ${id}`,
    unit: "g",
    source: "Manual",
    barcode,
    nutrients: {
      calories: 100,
      protein: 10,
      carbs: 12,
      fat: 3,
      fiber: 1,
      sugar: 1,
      sodium: 5,
      potassium: 5,
      calcium: 5,
      magnesium: 5,
      iron: 1,
      zinc: 1,
      vitaminA: 1,
      vitaminC: 1,
      vitaminD: 1,
      vitaminE: 1,
      vitaminK: 1,
      omega3: 1,
      omega6: 1,
      cholesterol: 1,
    },
  },
  quantity: 100,
  mealType: "breakfast",
  eatenAt: "2026-06-30T08:00:00.000Z",
  origin: "manual",
});

describe("buildMealStateAfterAddEntries", () => {
  it("adds entries and recalculates nutrients", () => {
    const next = buildMealStateAfterAddEntries(createInitialMealState(), [
      createEntry("one"),
    ]);

    expect(next.items).toHaveLength(1);
    expect(next.totalNutrients.calories).toBe(100);
    expect(next.recentProducts).toHaveLength(1);
  });

  it("deduplicates recent and barcode products", () => {
    const initial = buildMealStateAfterAddEntries(createInitialMealState(), [
      createEntry("one", "123"),
    ]);
    const next = buildMealStateAfterAddEntries(initial, [
      createEntry("two", "123"),
    ]);

    expect(next.items).toHaveLength(2);
    expect(next.personalBarcodeProducts).toHaveLength(1);
    expect(next.personalBarcodeProducts[0]?.id).toBe("product-two");
  });
});
