import { describe, expect, it } from "vitest";
import {
  buildCatalogContributionPayload,
  canSubmitCatalogContribution,
  createCatalogContributionFormFromProduct,
  createInitialCatalogContributionForm,
  resolveCatalogContributionNotice,
} from "./catalogContributionModel";
import type { Product } from "@domain/products/types";

const CATALOG_PRODUCT_NAME = "Quinoa bowl";

describe("catalogContributionModel", () => {
  it("creates an initial form with an optional trimmed product name", () => {
    expect(createInitialCatalogContributionForm("  quinoa bowl  ")).toMatchObject({
      name: "quinoa bowl",
      calories: "",
      protein: "",
      fat: "",
      carbs: "",
    });
  });

  it("validates required nutrition fields before allowing submission", () => {
    const invalidForm = createInitialCatalogContributionForm(CATALOG_PRODUCT_NAME);
    const validForm = {
      ...invalidForm,
      calories: "120",
      protein: "4",
      fat: "2",
      carbs: "20",
    };

    expect(canSubmitCatalogContribution(invalidForm)).toBe(false);
    expect(canSubmitCatalogContribution(validForm)).toBe(true);
  });

  it("builds a normalized backend catalog payload", () => {
    expect(
      buildCatalogContributionPayload({
        name: `  ${CATALOG_PRODUCT_NAME} `,
        category: " grains ",
        brand: " Kitchen ",
        barcode: " 590-123 abc ",
        imageUrl: " https://example.com/pack.png ",
        calories: "120",
        protein: "4",
        fat: "2",
        carbs: "20",
      })
    ).toEqual({
      name: CATALOG_PRODUCT_NAME,
      category: "grains",
      brand: "Kitchen",
      barcode: "590123",
      imageUrl: "https://example.com/pack.png",
      calories: 120,
      protein: 4,
      fat: 2,
      carbs: 20,
    });
  });

  it("prefills correction submissions from an existing scanned or searched product", () => {
    const product: Product = {
      id: "off-coke",
      name: "Coca-Cola",
      unit: "ml",
      source: "OpenFoodFacts",
      brand: "Coca Cola",
      barcode: " 5449000000996 ",
      category: "beverages",
      imageUrl: " https://example.com/coke.jpg ",
      nutrients: {
        calories: 42.346,
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
    };

    expect(createCatalogContributionFormFromProduct(product)).toMatchObject({
      name: "Coca-Cola",
      category: "beverages",
      brand: "Coca Cola",
      barcode: "5449000000996",
      imageUrl: "https://example.com/coke.jpg",
      calories: "42.35",
      protein: "0",
      fat: "0",
      carbs: "10.6",
    });
  });

  it("rejects invalid numeric payloads instead of sending fake catalog data", () => {
    expect(
      buildCatalogContributionPayload({
        ...createInitialCatalogContributionForm(CATALOG_PRODUCT_NAME),
        calories: "abc",
        protein: "4",
        fat: "2",
        carbs: "20",
      })
    ).toBeNull();
  });

  it("keeps catalog submission states explicit and retryable", () => {
    const copy = {
      submitting: "Sending",
      accepted: "Accepted",
      failed: "Catalog failed.",
      retry: "Retry",
    };
    const payload = {
      name: "Quinoa bowl",
      calories: 120,
      protein: 4,
      fat: 2,
      carbs: 20,
    };

    expect(resolveCatalogContributionNotice({ status: "idle" }, copy)).toBeNull();
    expect(
      resolveCatalogContributionNotice({ status: "submitting", payload }, copy)
    ).toEqual({
      severity: "info",
      text: "Sending",
    });
    expect(resolveCatalogContributionNotice({ status: "accepted" }, copy)).toEqual({
      severity: "success",
      text: "Accepted",
    });
    expect(
      resolveCatalogContributionNotice(
        { status: "failed", payload, message: "Provider unavailable." },
        copy
      )
    ).toEqual({
      severity: "warning",
      text: "Catalog failed. Provider unavailable.",
      retryable: true,
    });
  });
});
