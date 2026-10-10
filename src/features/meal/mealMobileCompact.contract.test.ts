import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");
const MOBILE_CARD_PADDING = "p: { xs: 1.35, md: 3 }";
const HIDE_MOBILE_SUPPORTING_TEXT = 'display: { xs: "none", sm: "block" }';
const FLEX_TO_GRID_RAIL = 'display: { xs: "flex", md: "grid" }';
const MOBILE_SNAP_RAIL = 'scrollSnapType: { xs: "x proximity", md: "none" }';

describe("meal mobile compact contracts", () => {
  it("keeps weekly insights summary swipeable instead of three stacked cards", async () => {
    const source = await readSource("src/features/meal/WeeklyInsights.tsx");

    expect(source).toContain('data-weekly-insights-mobile-summary-rail="true"');
    expect(source).toContain(MOBILE_CARD_PADDING);
    expect(source).toContain(FLEX_TO_GRID_RAIL);
    expect(source).toContain(MOBILE_SNAP_RAIL);
  });

  it("keeps saved meal templates compact on mobile", async () => {
    const source = await readSource("src/features/meal/TemplateVault.tsx");

    expect(source).toContain('data-template-vault-mobile-compact-list="true"');
    expect(source).toContain(MOBILE_CARD_PADDING);
    expect(source).toContain(HIDE_MOBILE_SUPPORTING_TEXT);
    expect(source).toContain('size="small"');
  });

  it("keeps daily micronutrients and history compact on mobile", async () => {
    const micronutrients = await readSource(
      "src/features/meal/DailyMicronutrientsCard.tsx",
    );
    const history = await readSource(
      "src/features/meal/DailyHistoryExplorer.tsx",
    );

    expect(micronutrients).toContain(
      'data-daily-micronutrients-mobile-rail="true"',
    );
    expect(micronutrients).toContain(MOBILE_CARD_PADDING);
    expect(micronutrients).toContain(FLEX_TO_GRID_RAIL);
    expect(micronutrients).toContain(MOBILE_SNAP_RAIL);
    expect(history).toContain('data-daily-history-mobile-compact-list="true"');
    expect(history).toContain('size="small"');
    expect(history).toContain(HIDE_MOBILE_SUPPORTING_TEXT);
  });

  it("keeps nutrition coach insights swipeable and concise on mobile", async () => {
    const source = await readSource("src/features/meal/NutritionCoachCard.tsx");

    expect(source).toContain('data-nutrition-coach-mobile-stat-rail="true"');
    expect(source).toContain('data-nutrition-coach-mobile-insight-rail="true"');
    expect(source).toContain(FLEX_TO_GRID_RAIL);
    expect(source).toContain("minWidth: { xs: 260, md: 0 }");
    expect(source).toContain(MOBILE_SNAP_RAIL);
  });
});
