import { describe, expect, it } from "vitest";
import {
  buildCatalogContributionPayload,
  canSubmitCatalogContribution,
  createInitialCatalogContributionForm,
  resolveCatalogContributionNotice,
} from "./catalogContributionModel";

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
