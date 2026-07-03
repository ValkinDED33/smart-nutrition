import { describe, expect, it } from "vitest";
import type { Product } from "@domain/products/types";
import { createEmptyNutrients } from "@domain/meal/nutrients";
import {
  buildQuickMealEntryDrafts,
  createQuickMealComposerRow,
  resolveQuickMealSaveNotice,
  hasValidComposerMealRows,
} from "./quickMealComposerModel";

const createProduct = (): Product => ({
  id: "product-1",
  name: "Greek yogurt",
  unit: "g",
  source: "Manual",
  nutrients: createEmptyNutrients(),
});

describe("quickMealComposerModel", () => {
  it("creates an empty quantity row so mobile users can type immediately", () => {
    const row = createQuickMealComposerRow(null, "row-1");

    expect(row).toMatchObject({
      id: "row-1",
      product: null,
      productQuery: "",
      quantity: "",
    });
  });

  it("requires both a selected product and a positive quantity before save", () => {
    const product = createProduct();

    expect(hasValidComposerMealRows([createQuickMealComposerRow(product, "row-1")])).toBe(false);
    expect(
      hasValidComposerMealRows([
        { ...createQuickMealComposerRow(product, "row-1"), quantity: 100 },
      ])
    ).toBe(true);
  });

  it("builds meal entries only for selected products with positive quantities", () => {
    const product = createProduct();
    const entries = buildQuickMealEntryDrafts(
      [
        { ...createQuickMealComposerRow(product, "row-1"), quantity: 120 },
        { ...createQuickMealComposerRow(null, "row-2"), quantity: 80 },
        { ...createQuickMealComposerRow(product, "row-3"), quantity: "" },
      ],
      "lunch",
      ({ product: entryProduct, quantity, mealType, origin }) => ({
        id: `entry-${quantity}`,
        product: entryProduct,
        quantity,
        mealType,
        origin,
        eatenAt: "2026-07-03T08:00:00.000Z",
      })
    );

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      id: "entry-120",
      product,
      quantity: 120,
      mealType: "lunch",
      origin: "manual",
    });
  });

  it("resolves confirmed and retryable save notices without pretending failed saves worked", () => {
    const product = createProduct();
    const copy = {
      saving: "Saving",
      saved: "Saved {count}",
      failed: "Failed",
      retry: "Retry",
    };

    expect(resolveQuickMealSaveNotice({ status: "idle" }, copy)).toBeNull();
    expect(
      resolveQuickMealSaveNotice({ status: "saving", entries: [] }, copy)
    ).toEqual({ severity: "info", text: "Saving" });
    expect(
      resolveQuickMealSaveNotice({ status: "saved", entryCount: 2 }, copy)
    ).toEqual({ severity: "success", text: "Saved 2" });
    expect(
      resolveQuickMealSaveNotice(
        {
          status: "failed",
          message: "Backend unavailable",
          entries: [
            {
              id: "entry-1",
              product,
              quantity: 100,
              mealType: "snack",
              origin: "manual",
              eatenAt: "2026-07-03T08:00:00.000Z",
            },
          ],
        },
        copy
      )
    ).toEqual({
      severity: "warning",
      text: "Failed Backend unavailable",
      retryable: true,
    });
  });
});
