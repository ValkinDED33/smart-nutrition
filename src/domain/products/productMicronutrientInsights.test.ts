import { describe, expect, it } from "vitest";
import { createEmptyNutrients } from "./nutrients";
import { getProductMicronutrientInsights } from "./productMicronutrientInsights";
import type { Product } from "./types";

const SEAWEED_INSIGHT_ID = "seaweed-iodine-source";

const createProduct = (overrides: Partial<Product> = {}): Product => ({
  id: "product-seaweed",
  name: "Морская капуста",
  unit: "g",
  source: "OpenFoodFacts",
  nutrients: createEmptyNutrients(),
  facts: {
    ingredientsText: "Морская капуста, соль, масло",
  },
  ...overrides,
});

describe("productMicronutrientInsights", () => {
  it("explains iodine for seaweed products when provider data has no iodine value", () => {
    const insights = getProductMicronutrientInsights(createProduct());

    expect(insights).toHaveLength(1);
    expect(insights[0]).toMatchObject({
      id: SEAWEED_INSIGHT_ID,
      nutrientKey: "iodine",
      title: {
        uk: "Йод",
        pl: "Jod",
        en: "Iodine",
      },
    });
    expect(insights[0]?.body.uk).toContain("морських водоростей");
    expect(insights[0]?.evidence.uk).toContain("не рахується автоматично");
  });

  it("does not duplicate iodine guidance when the product database provides iodine", () => {
    const nutrients = createEmptyNutrients();
    nutrients.iodine = 120;

    const insights = getProductMicronutrientInsights(
      createProduct({
        nutrients,
      })
    );

    expect(insights).toEqual([]);
  });

  it("detects Polish and English seaweed product names", () => {
    expect(
      getProductMicronutrientInsights(
        createProduct({
          name: "Sałatka z morska kapusta",
          facts: {},
        })
      ).map((insight) => insight.id)
    ).toContain(SEAWEED_INSIGHT_ID);
    expect(
      getProductMicronutrientInsights(
        createProduct({
          name: "Kelp snack",
          facts: {},
        })
      ).map((insight) => insight.id)
    ).toContain(SEAWEED_INSIGHT_ID);
  });
});
