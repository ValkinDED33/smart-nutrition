import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("ProductNutritionFacts contract", () => {
  it("keeps product detail food groups aligned with canonical product categories", async () => {
    const source = await readFile("src/features/meal/ProductNutritionFacts.tsx", "utf8");

    expect(source).toContain("analyzeProductIngredientInsights");
    expect(source).toContain("ingredientsSummary");
    expect(source).toContain("ingredientsRaw");
    expect(source).toContain("product.facts?.additivesText");
    expect(source).toContain("product.facts?.allergens");
    expect(source).toContain("product.facts?.traces");
    expect(source).toContain("allergenSafetyNote");
    expect(source).toContain("additiveAnalysisText");
    expect(source).toContain("getProductCategoryLabel(key, language)");
    expect(source).toContain("getProductCategoryKey(product)");
    expect(source).toContain('["beverage"');
    expect(source).toContain('["meat"');
    expect(source).toContain('["fish"');
    expect(source).toContain('["sweets"');
    expect(source).toContain('["readyMeal"');
    expect(source).not.toContain("formatFallbackLabel");
  });
});
