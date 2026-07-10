import { describe, expect, it } from "vitest";
import type { Product } from "@domain/products/types";
import { createEmptyNutrients } from "@domain/meal/nutrients";
import { getProductSuggestions } from "./productSuggestionModel";

const createProduct = (id: string, name: string, barcode?: string): Product => ({
  id,
  name,
  barcode,
  unit: "g",
  source: "Manual",
  nutrients: createEmptyNutrients(),
});

const CHICKEN_QUERY = "chicken";
const RICE_PRODUCT_NAME = "Rice cooked";

describe("productSuggestionModel", () => {
  it("prefers online products and removes duplicates across sources", () => {
    const onlineProduct = createProduct("online-rice", RICE_PRODUCT_NAME);
    const duplicateSavedProduct = createProduct("saved-rice", RICE_PRODUCT_NAME);

    const suggestions = getProductSuggestions({
      query: "rice",
      onlineProducts: [onlineProduct],
      savedProducts: [duplicateSavedProduct],
    });

    expect(suggestions[0]).toBe(onlineProduct);
    expect(suggestions.filter((product) => product.name === RICE_PRODUCT_NAME)).toHaveLength(1);
  });

  it("uses saved and recent products before catalog fallback", () => {
    const savedProduct = createProduct("saved-yogurt", "Protein yogurt");
    const recentProduct = createProduct("recent-yogurt", "Greek yogurt");

    const suggestions = getProductSuggestions({
      query: "yogurt",
      savedProducts: [savedProduct],
      recentProducts: [recentProduct],
      limit: 4,
    });

    expect(suggestions.map((product) => product.id)).toContain(savedProduct.id);
    expect(suggestions.map((product) => product.id)).toContain(recentProduct.id);
  });

  it("returns starter catalog suggestions when online source is empty", () => {
    const suggestions = getProductSuggestions({ query: CHICKEN_QUERY, limit: 5 });

    expect(suggestions.length).toBeGreaterThan(0);
    expect(
      suggestions.some((product) => product.name.toLowerCase().includes(CHICKEN_QUERY))
    ).toBe(true);
  });

  it("can keep starter catalog out of typed backend search results", () => {
    const suggestions = getProductSuggestions({
      query: CHICKEN_QUERY,
      onlineProducts: [],
      savedProducts: [],
      recentProducts: [],
      personalBarcodeProducts: [],
      includeStarterCatalog: false,
      limit: 5,
    });

    expect(suggestions).toEqual([]);
  });
});
