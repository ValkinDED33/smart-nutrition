import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");

describe("ProgressOverviewCard contract", () => {
  it("keeps the progress overview connected to every counted domain", async () => {
    const source = await readSource("src/features/profile/ProgressOverviewCard.tsx");
    const pageSource = await readSource("src/pages/ProgressPage.tsx");

    expect(pageSource).toContain("ProgressOverviewCard");
    expect(source).toContain("state.profile");
    expect(source).toContain("state.meal");
    expect(source).toContain("state.water");
    expect(source).toContain("caloriesProgress");
    expect(source).toContain("proteinProgress");
    expect(source).toContain("waterProgress");
    expect(source).toContain("createWaterGlassSlots");
    expect(source).toContain("overviewWaterGlasses");
    expect(source).toContain('data-testid="overview-water-glass"');
    expect(source).toContain("onSelectDomain");
    expect(source).toContain("data-progress-domain={item.domain}");
    expect(pageSource).toContain("getSectionForProgressDomain");
    expect(pageSource).toContain('case "water":');
    expect(pageSource).toContain('return "water";');
    expect(source).toContain("mealsProgress");
    expect(source).toContain("weightProgress");
    expect(source).toContain("checkInProgress");
  });
});
