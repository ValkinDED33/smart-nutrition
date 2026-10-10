import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const RECIPES_PAGE_SOURCE = "src/pages/RecipesPage.tsx";

describe("RecipesPage contract", () => {
  it("keeps recipe navigation before the AI blueprint on mobile", async () => {
    const source = await readFile(RECIPES_PAGE_SOURCE, "utf8");
    const tabsIndex = source.indexOf("<SectionTabs");
    const recommendationsGuardIndex = source.indexOf('activeSection === "recommendations"');
    const blueprintIndex = source.indexOf("<AIMasterBlueprintPanel");

    expect(tabsIndex).toBeGreaterThan(-1);
    expect(recommendationsGuardIndex).toBeGreaterThan(tabsIndex);
    expect(blueprintIndex).toBeGreaterThan(recommendationsGuardIndex);
    expect(source).toContain('stickyOnMobile');
  });
});
