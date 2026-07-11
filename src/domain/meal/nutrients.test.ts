import { describe, expect, it } from "vitest";
import { getNutrientLabel } from "./nutrients";

describe("nutrient labels", () => {
  it("uses readable nutrient names instead of macro abbreviations", () => {
    expect(getNutrientLabel("protein", "uk")).toBe("Білки");
    expect(getNutrientLabel("fat", "uk")).toBe("Жири");
    expect(getNutrientLabel("carbs", "uk")).toBe("Вуглеводи");
    expect(getNutrientLabel("sugars", "uk")).toBe("Цукор");
    expect(getNutrientLabel("sugars", "en")).toBe("Sugar");
  });
});
