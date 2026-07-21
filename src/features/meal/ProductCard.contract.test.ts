import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("ProductCard contract", () => {
  it("keeps product catalog status visible in product cards", async () => {
    const source = await readFile("src/features/meal/ProductCard.tsx", "utf8");

    expect(source).toContain("getProductStatusChip");
    expect(source).toContain("product.status");
    expect(source).toContain("statusApproved");
    expect(source).toContain("statusPending");
    expect(source).toContain("statusPersonal");
  });

  it("does not render raw provider ids as regular product source copy", async () => {
    const productCardSource = await readFile("src/features/meal/ProductCard.tsx", "utf8");
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
});
