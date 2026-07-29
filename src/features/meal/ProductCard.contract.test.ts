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

  it("keeps product details as a branded magic expand surface without changing canonical actions", async () => {
    const productCardSource = await readFile(PRODUCT_CARD_PATH, "utf8");

    expect(productCardSource).toContain("productRevealVariants");
    expect(productCardSource).toContain("playGentleClickSound");
    expect(productCardSource).toContain('data-product-magic-expand="nutrition-facts"');
    expect(productCardSource).toContain(
      'data-product-magic-expand-panel="nutrition-facts"'
    );
    expect(productCardSource).toContain('data-product-magic-expand="catalog-correction"');
    expect(productCardSource).toContain("aria-expanded={detailsOpen}");
    expect(productCardSource).toContain("aria-expanded={correctionOpen}");
    expect(productCardSource).toContain("rotate(180deg)");
    expect(productCardSource).toContain("<ProductNutritionFacts product={product} />");
    expect(productCardSource).toContain("addProductIntakeToCloud");
    expect(productCardSource).toContain("saveMealProductToCloud");
  });

  it("keeps catalog contribution failures retryable without rendering backend exceptions", async () => {
    const catalogCardSource = await readFile(CATALOG_CONTRIBUTION_CARD_PATH, "utf8");

    expect(catalogCardSource).toContain("message: copy.retry");
    expect(catalogCardSource).not.toContain("PlatformApiError");
    expect(catalogCardSource).not.toContain("nextError.message");
  });

  it("localizes catalog contribution category fallback instead of showing raw Manual source text", async () => {
    const catalogCardSource = await readFile(CATALOG_CONTRIBUTION_CARD_PATH, "utf8");

    expect(catalogCardSource).toContain("categoryCustom");
    expect(catalogCardSource).toContain("getSubmissionCategoryLabel");
    expect(catalogCardSource).toContain(
      "{getSubmissionCategoryLabel({ item, categoryOptions, copy })}"
    );
    expect(catalogCardSource).not.toContain('<MenuItem value="">Manual</MenuItem>');
    expect(catalogCardSource).not.toContain('item.category ?? item.brand ?? "Manual"');
  });
});
