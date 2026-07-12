import { describe, expect, it } from "vitest";
import { buildBabyPreview, estimateBabyEyeColor } from "./babyPreview";

describe("baby preview domain", () => {
  it("estimates baby eye color from both parents without claiming certainty", () => {
    expect(estimateBabyEyeColor("brown", "blue")).toEqual([
      { color: "brown", probability: 50 },
      { color: "blue", probability: 50 },
    ]);
  });

  it("does not invent eye color chances when parent data is missing", () => {
    expect(estimateBabyEyeColor("unknown", "blue")).toEqual([]);
  });

  it("keeps sex probability honest and zodiac traits playful", () => {
    const preview = buildBabyPreview({
      motherEyeColor: "green",
      fatherEyeColor: "brown",
      motherZodiac: "cancer",
      fatherZodiac: "capricorn",
      motherChineseZodiac: "tiger",
      fatherChineseZodiac: "goat",
    });

    expect(preview.sexChances).toMatchObject({ girl: 50, boy: 50 });
    expect(preview.sexChances.note).toBe(
      "biological_sex_not_predictable_from_parent_profile"
    );
    expect(preview.playfulTraits).toEqual([
      "sensitivity",
      "persistence",
      "boldness",
      "soft creativity",
    ]);
    expect(preview.disclaimer).toContain("not science");
  });
});
