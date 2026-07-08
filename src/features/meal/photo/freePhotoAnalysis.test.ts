import { describe, expect, it } from "vitest";
import { createFreePhotoAnalysis } from "./freePhotoAnalysis";

describe("free photo analysis UX copy", () => {
  it("keeps fallback photo analysis consumer-friendly", () => {
    const analysis = createFreePhotoAnalysis({ mealType: "lunch" });
    const visibleCopy = [
      analysis.dishName,
      analysis.summary,
      ...analysis.cautions,
    ].join(" ");

    expect(visibleCopy).toContain("Review");
    expect(visibleCopy).not.toMatch(/paid AI/i);
    expect(visibleCopy).not.toMatch(/disabled in this build/i);
    expect(visibleCopy).not.toMatch(/low-confidence/i);
    expect(visibleCopy).not.toMatch(/automatic image recognition/i);
    expect(analysis.manualReviewRequired).toBe(true);
  });
});
