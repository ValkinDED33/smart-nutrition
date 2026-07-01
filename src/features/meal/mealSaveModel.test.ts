import { describe, expect, it } from "vitest";
import type { MealEntry } from "@domain/meal/types";
import { createEmptyNutrients } from "@domain/meal/nutrients";
import { createInitialMealState } from "./mealSlice";
import {
  buildMealStateAfterAddEntries,
  buildMealStateAfterRemoveEntry,
  buildMealStateAfterRemoveSavedProduct,
  buildMealStateAfterSaveProduct,
  buildMealStateAfterSaveTemplate,
  buildMealStateAfterUpdateEntry,
} from "./mealSaveModel";

const createEntry = (id: string, barcode?: string): MealEntry => ({
  id,
  product: {
    id: `product-${id}`,
    name: `Product ${id}`,
    unit: "g",
    source: "Manual",
    barcode,
    nutrients: {
      ...createEmptyNutrients(),
      calories: 100,
      protein: 10,
      carbs: 12,
      fat: 3,
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

describe("meal save model state transitions", () => {
  it("removes entries and recalculates nutrients", () => {
    const initial = buildMealStateAfterAddEntries(createInitialMealState(), [
      createEntry("one"),
      createEntry("two"),
    ]);
    const next = buildMealStateAfterRemoveEntry(initial, "one");

    expect(next.items.map((item) => item.id)).toEqual(["two"]);
    expect(next.totalNutrients.calories).toBe(100);
  });

  it("updates an entry and remembers the replacement product", () => {
    const initial = buildMealStateAfterAddEntries(createInitialMealState(), [
      createEntry("one"),
    ]);
    const replacement = createEntry("replacement", "456").product;
    const next = buildMealStateAfterUpdateEntry(initial, {
      id: "one",
      product: replacement,
      quantity: 150,
      mealType: "dinner",
    });

    expect(next.items[0]?.product.id).toBe("product-replacement");
    expect(next.items[0]?.quantity).toBe(150);
    expect(next.items[0]?.mealType).toBe("dinner");
    expect(next.recentProducts[0]?.id).toBe("product-replacement");
  });

  it("saves templates idempotently by id", () => {
    const template = {
      id: "template-one",
      name: "Lunch",
      mealType: "lunch" as const,
      items: [{ product: createEntry("one").product, quantity: 120 }],
      createdAt: "2026-06-30T10:00:00.000Z",
    };
    const initial = buildMealStateAfterSaveTemplate(createInitialMealState(), template);
    const next = buildMealStateAfterSaveTemplate(initial, {
      ...template,
      name: "Updated lunch",
    });

    expect(next.templates).toHaveLength(1);
    expect(next.templates[0]?.name).toBe("Updated lunch");
  });

  it("saves and removes favorite products by identity", () => {
    const product = createEntry("one", "789").product;
    const initial = buildMealStateAfterSaveProduct(createInitialMealState(), product);
    const next = buildMealStateAfterRemoveSavedProduct(initial, "789");

    expect(initial.savedProducts).toHaveLength(1);
    expect(next.savedProducts).toHaveLength(0);
  });
});
