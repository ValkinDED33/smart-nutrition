import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const sourcePath = "src/features/meal/NutritionLibraryPanel.tsx";

describe("NutritionLibraryPanel contract", () => {
  it("surfaces saved products templates and articles as one My Library overview", async () => {
    const source = await readFile(sourcePath, "utf8");

    expect(source).toContain('data-my-library-overview="true"');
    expect(source).toContain("labels.myHubTitle");
    expect(source).toContain("savedOverviewItems");
    expect(source).toContain("count: savedProducts.length");
    expect(source).toContain("count: templates.length");
    expect(source).toContain("count: visibleSavedPosts.length");
    expect(source).toContain("onClick={() => setActiveTab(item.id)}");
  });

  it("uses existing canonical meal and community state instead of a separate library store", async () => {
    const source = await readFile(sourcePath, "utf8");

    expect(source).toContain("useSelector(selectSavedProducts)");
    expect(source).toContain("useSelector(selectMealTemplates)");
    expect(source).toContain("state.community.favoritePostIds");
    expect(source).not.toContain("localStorage");
    expect(source).not.toContain("myLibrarySlice");
    expect(source).not.toContain("saveMyLibrary");
  });

  it("keeps dense library result groups compact on mobile", async () => {
    const source = await readFile(sourcePath, "utf8");

    expect(source).toContain(
      'data-nutrition-library-mobile-product-rail="true"',
    );
    expect(source).toContain('data-nutrition-library-mobile-dish-rail="true"');
    expect(source).toContain(
      'data-nutrition-library-mobile-recipe-rail="true"',
    );
    expect(source).toContain(
      'data-nutrition-library-mobile-article-rail="true"',
    );
    expect(source).toContain("MOBILE_LIBRARY_RAIL");
    expect(source).toContain("MOBILE_DISH_RAIL");
    expect(source).toContain('const MOBILE_LIBRARY_SNAP = "x proximity"');
    expect(source).toContain(
      'scrollSnapType: { xs: MOBILE_LIBRARY_SNAP, sm: "none" }',
    );
  });
});
