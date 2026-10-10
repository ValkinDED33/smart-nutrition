import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");

describe("progress mobile compact contracts", () => {
  it("keeps progress page sections and weight cards compact on mobile", async () => {
    const pageSource = await readSource("src/pages/ProgressPage.tsx");
    const quickWeightSource = await readSource(
      "src/features/profile/QuickWeightCheckInCard.tsx",
    );
    const trendSource = await readSource(
      "src/features/profile/WeightTrendCard.tsx",
    );

    expect(pageSource).toContain('data-progress-mobile-section="weight"');
    expect(pageSource).toContain('data-progress-mobile-section="body"');
    expect(pageSource).toContain('data-progress-mobile-section="trends"');
    expect(pageSource).toContain("spacing={{ xs: 1.2, md: 2.5 }}");
    expect(quickWeightSource).toContain(
      'data-quick-weight-mobile-summary-rail="true"',
    );
    expect(quickWeightSource).toContain(
      'data-quick-weight-mobile-editor="true"',
    );
    expect(quickWeightSource).toContain('display: { xs: "none", md: "block" }');
    expect(quickWeightSource).toContain("height: { xs: 7, md: 10 }");
    expect(trendSource).toContain(
      'data-weight-trend-mobile-summary-rail="true"',
    );
    expect(trendSource).toContain("height: { xs: 156, sm: 220, md: 260 }");
    expect(trendSource).toContain("minHeight: { xs: 156, sm: 220 }");
  });

  it("keeps monthly analytics from becoming a long mobile wall", async () => {
    const source = await readSource(
      "src/features/meal/MonthlyAnalyticsCard.tsx",
    );

    expect(source).toContain("const MONTHLY_MOBILE_RAIL_SX = {");
    expect(source).toContain('data-monthly-mobile-summary-rail="true"');
    expect(source).toContain('data-monthly-mobile-calendar-rail="true"');
    expect(source).toContain('data-monthly-mobile-deviation-rail="true"');
    expect(source).toContain('data-monthly-mobile-macro-rail="true"');
    expect(source).toContain('display: { xs: "flex", md: "grid" }');
    expect(source).toContain('display: { xs: "flex", sm: "grid" }');
    expect(source).toContain("minWidth: { xs: 42, sm: 0 }");
    expect(source).toContain(
      'const MONTHLY_MOBILE_SCROLL_SNAP_X = "x proximity"',
    );
    expect(source).toContain(
      'scrollSnapType: { xs: MONTHLY_MOBILE_SCROLL_SNAP_X, md: "none" }',
    );
  });
});
