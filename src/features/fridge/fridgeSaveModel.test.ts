import { describe, expect, it } from "vitest";
import { createEmptyNutrients } from "@domain/meal/nutrients";
import type { Product } from "@domain/products/types";
import { normalizeFridgeState } from "./fridgeSlice";
import {
  buildFridgeStateAfterConsumeItems,
  buildFridgeStateAfterRemoveItem,
  buildFridgeStateAfterUpdateQuantity,
  buildFridgeStateAfterUpsertItem,
} from "./fridgeSaveModel";

const createProduct = (id: string): Product => ({
  id,
  name: `Product ${id}`,
  unit: "g",
  source: "Manual",
  nutrients: createEmptyNutrients(),
});

describe("fridgeSaveModel", () => {
  it("adds a new fridge item", () => {
    const next = buildFridgeStateAfterUpsertItem(
      normalizeFridgeState({}),
      { product: createProduct("one"), quantity: 120 },
      "2026-06-30T10:00:00.000Z"
    );

    expect(next.items).toHaveLength(1);
    expect(next.items[0]).toMatchObject({
      product: { id: "one" },
      quantity: 120,
      createdAt: "2026-06-30T10:00:00.000Z",
    });
  });

  it("increments an existing product instead of duplicating it", () => {
    const initial = buildFridgeStateAfterUpsertItem(
      normalizeFridgeState({}),
      { product: createProduct("one"), quantity: 100 }
    );
    const next = buildFridgeStateAfterUpsertItem(initial, {
      product: createProduct("one"),
      quantity: 50,
    });

    expect(next.items).toHaveLength(1);
    expect(next.items[0]?.quantity).toBe(150);
  });

  it("updates quantity and removes items", () => {
    const initial = buildFridgeStateAfterUpsertItem(
      normalizeFridgeState({}),
      { product: createProduct("one"), quantity: 100 }
    );
    const itemId = initial.items[0]?.id ?? "";
    const updated = buildFridgeStateAfterUpdateQuantity(initial, {
      itemId,
      quantity: 15,
    });
    const removed = buildFridgeStateAfterRemoveItem(updated, itemId);

    expect(updated.items[0]?.quantity).toBe(15);
    expect(removed.items).toHaveLength(0);
  });

  it("consumes matching recipe ingredients from fridge without negative stock", () => {
    const initial = buildFridgeStateAfterUpsertItem(
      buildFridgeStateAfterUpsertItem(
        normalizeFridgeState({}),
        { product: createProduct("rice"), quantity: 200 }
      ),
      { product: createProduct("egg"), quantity: 80 }
    );

    const next = buildFridgeStateAfterConsumeItems(initial, [
      { product: createProduct("rice"), quantity: 75 },
      { product: createProduct("egg"), quantity: 120 },
      { product: createProduct("missing"), quantity: 50 },
    ]);

    expect(next.items.find((item) => item.product.id === "rice")?.quantity).toBe(125);
    expect(next.items.some((item) => item.product.id === "egg")).toBe(false);
    expect(next.items.some((item) => item.product.id === "missing")).toBe(false);
  });

  it("matches consumed ingredients by product name when ids differ", () => {
    const initial = buildFridgeStateAfterUpsertItem(
      normalizeFridgeState({}),
      { product: { ...createProduct("custom-chicken"), name: "Chicken breast" }, quantity: 180 }
    );

    const next = buildFridgeStateAfterConsumeItems(initial, [
      { product: { ...createProduct("recipe-chicken"), name: "Chicken breast" }, quantity: 100 },
    ]);

    expect(next.items[0]?.quantity).toBe(80);
  });
});
