import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("SupplementRecommendationCard contract", () => {
  it("keeps supplement guidance in one user-facing language without internal UX labels", async () => {
    const source = await readFile("src/features/profile/SupplementRecommendationCard.tsx", "utf8");

    expect(source).toContain('const recommendationLanguage: AppLanguage = "uk"');
    expect(source).toContain("getSurfaceLabel");
    expect(source).toContain("Де це з'явиться");
    expect(source).not.toContain("UX-приклади");
    expect(source).not.toContain("Przykłady UX");
    expect(source).not.toContain("formatSurfaceLabel");
  });
});
