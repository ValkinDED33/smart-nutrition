import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");

describe("ProgressOverviewCard contract", () => {
  it("keeps the progress overview connected to every counted domain", async () => {
    const source = await readSource("src/features/profile/ProgressOverviewCard.tsx");
    const modelSource = await readSource("src/features/profile/progressOverviewModel.ts");
    const pageSource = await readSource("src/pages/ProgressPage.tsx");

    expect(pageSource).toContain("ProgressOverviewCard");
    expect(source).toContain("createProgressOverviewItems");
    expect(source).toContain("formatProgressPercent");
    expect(source).toContain("getProgressToneColor");
    expect(modelSource).toContain("createProgressOverviewItems");
    expect(source).toContain("state.profile");
    expect(source).toContain("state.meal");
    expect(source).toContain("state.water");
    expect(modelSource).toContain("caloriesProgress");
    expect(modelSource).toContain("proteinProgress");
    expect(modelSource).toContain("waterProgress");
    expect(source).toContain("createWaterGlassSlots");
    expect(source).toContain("overviewWaterGlasses");
    expect(source).toContain('data-testid="overview-water-glass"');
    expect(source).toContain("onSelectDomain");
    expect(source).toContain("data-progress-domain={item.domain}");
    expect(pageSource).toContain("getSectionForProgressDomain");
    expect(pageSource).toContain('case "water":');
    expect(pageSource).toContain('return "water";');
    expect(modelSource).toContain("mealsProgress");
    expect(modelSource).toContain("weightProgress");
    expect(modelSource).toContain("checkInProgress");
    expect(source).not.toContain("const caloriesProgress");
  });
});
