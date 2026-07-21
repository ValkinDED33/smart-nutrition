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
});
