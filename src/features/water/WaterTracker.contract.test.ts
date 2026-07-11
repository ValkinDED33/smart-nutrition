import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("WaterTracker contract", () => {
  it("keeps tappable glass slots as the primary hydration control", async () => {
    const source = await readFile("src/features/water/WaterTracker.tsx", "utf8");
    const glassSlotsIndex = source.indexOf("glasses.map");
    const quickAmountsIndex = source.indexOf("copy.quickAmounts");

    expect(source).toContain("createWaterGlassSlots");
    expect(source).toContain("handleGlassClick");
    expect(source).toContain("linear-gradient(180deg, rgba(56,189,248,0.86)");
    expect(glassSlotsIndex).toBeGreaterThan(-1);
    expect(quickAmountsIndex).toBeGreaterThan(-1);
    expect(glassSlotsIndex).toBeLessThan(quickAmountsIndex);
  });
});
