import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const sourcePath = "src/features/meal/SmartRecommendations.tsx";

describe("SmartRecommendations mobile contract", () => {
  it("keeps assistant recommendations compact and swipeable on mobile", async () => {
    const source = await readFile(sourcePath, "utf8");

    expect(source).toContain('data-smart-recommendations-mobile-rail="true"');
    expect(source).toContain("MOBILE_RECOMMENDATION_RAIL");
    expect(source).toContain(
      'scrollSnapType: { xs: "x proximity", md: "none" }',
    );
    expect(source).toContain("minWidth: { xs: 270, md: 0 }");
    expect(source).toContain('display: { xs: "none", sm: "block" }');
  });
});
