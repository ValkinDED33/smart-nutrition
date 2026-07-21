import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const PRODUCT_CARD_PATH = "src/features/meal/ProductCard.tsx";
const CATALOG_CONTRIBUTION_CARD_PATH =
  "src/features/platform/CatalogContributionCard.tsx";

describe("ProductCard contract", () => {
  it("keeps product catalog status visible in product cards", async () => {
    const source = await readFile(PRODUCT_CARD_PATH, "utf8");

    expect(source).toContain("getProductStatusChip");
    expect(source).toContain("product.status");
    expect(source).toContain("statusApproved");
    expect(source).toContain("statusPending");
    expect(source).toContain("statusPersonal");
  });

  it("does not render raw provider ids as regular product source copy", async () => {
    const productCardSource = await readFile(PRODUCT_CARD_PATH, "utf8");
    const commandCenterSource = await readFile(
      "src/features/meal/FoodCommandCenter.tsx",
      "utf8"
    );
    const composerSource = await readFile("src/features/meal/QuickMealComposer.tsx", "utf8");
    const librarySource = await readFile(
      "src/features/meal/NutritionLibraryPanel.tsx",
      "utf8"
    );

    for (const source of [
      productCardSource,
      commandCenterSource,
      composerSource,
      librarySource,
    ]) {
      expect(source).toContain("getProductSourceLabel");
    }

    expect(productCardSource).not.toContain("product.source].filter");
    expect(commandCenterSource).not.toContain("selectedProduct.source}`");
    expect(composerSource).not.toContain("${selectedProduct.source}");
    expect(librarySource).not.toContain("label={product.source");
  });

  it("routes product corrections through shared catalog contribution, not local fake edits", async () => {
    const productCardSource = await readFile(PRODUCT_CARD_PATH, "utf8");
    const catalogCardSource = await readFile(CATALOG_CONTRIBUTION_CARD_PATH, "utf8");

    expect(productCardSource).toContain(
      'data-product-correction-action="catalog-contribution"'
    );
    expect(productCardSource).toContain("<CatalogContributionCard");
    expect(productCardSource).toContain("initialProduct={product}");
    expect(productCardSource).not.toContain("setProduct(");
    expect(productCardSource).not.toContain("localStorage");
    expect(catalogCardSource).toContain("initialProduct");
    expect(catalogCardSource).toContain("createCatalogContributionFormFromProduct");
  });

  it("keeps catalog contribution failures retryable without rendering backend exceptions", async () => {
    const catalogCardSource = await readFile(CATALOG_CONTRIBUTION_CARD_PATH, "utf8");

    expect(catalogCardSource).toContain("message: copy.retry");
    expect(catalogCardSource).not.toContain("PlatformApiError");
    expect(catalogCardSource).not.toContain("nextError.message");
  });
});
