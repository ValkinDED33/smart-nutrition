import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readPageSource = (fileName: string) =>
  readFile(new URL(`./${fileName}`, import.meta.url), "utf8");

describe("page lazy-loading boundaries", () => {
  it("keeps recipe subfeatures behind route-local lazy boundaries", async () => {
    const source = await readPageSource("RecipesPage.tsx");

    expect(source).toContain("const FridgeRecipePlanner = lazy");
    expect(source).toContain("const NutritionLibraryPanel = lazy");
    expect(source).toContain("const RecipeSection = lazy");
    expect(source).toContain("const SmartRecommendations = lazy");
    expect(source).toContain("LazyModuleBoundary");
    expect(source).not.toMatch(
      /import\s+\{\s*(FridgeRecipePlanner|NutritionLibraryPanel|RecipeSection|SmartRecommendations)/
    );
  });

  it("does not force markdown learning content into the initial community page chunk", async () => {
    const source = await readPageSource("CommunityPage.tsx");

    expect(source).toContain("const LearningHubCard = lazy");
    expect(source).toContain("LazyModuleBoundary");
    expect(source).not.toMatch(/import\s+\{\s*LearningHubCard/);
  });

  it("uses the shared lazy recovery boundary instead of page-specific copies", async () => {
    const source = await readPageSource("MealBuilderPage.tsx");
    const boundarySource = await readFile(
      new URL("../shared/ui/LazyModuleBoundary.tsx", import.meta.url),
      "utf8"
    );

    expect(source).toContain("LazyModuleBoundary");
    expect(source).not.toContain("class MealBuilderLazyBoundary");
    expect(boundarySource).toContain("clearRuntimeCaches");
    expect(boundarySource).toContain("buildRecoveryReloadUrl");
  });

  it("wraps high-traffic lazy pages with local recovery boundaries", async () => {
    const pageSources = await Promise.all(
      [
        "AiCompanionPage.tsx",
        "DashboardPage.tsx",
        "MealsPage.tsx",
        "ProfilePage.tsx",
        "ProgressPage.tsx",
      ].map(readPageSource)
    );

    pageSources.forEach((source) => {
      expect(source).toContain("LazyModuleBoundary");
      expect(source).toContain("buildLazyModuleRecoveryCopy");
    });
  });
});
