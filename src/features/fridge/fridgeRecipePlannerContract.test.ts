import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(
  resolve(process.cwd(), "src/features/fridge/FridgeRecipePlanner.tsx"),
  "utf8"
);

describe("fridge recipe planner user feedback contract", () => {
  it("keeps meal and fridge save failures in product language", () => {
    expect(source).toContain("mealSaveFailed");
    expect(source).toContain("setFridgeSaveError(copy.saveFailed)");
    expect(source).toContain("setMealSaveError(copy.mealSaveFailed)");
    expect(source).not.toContain("error instanceof Error ? error.message");
    expect(source).not.toContain("fridgeError instanceof Error");
    expect(source).not.toContain("Could not save meal to cloud.");
    expect(source).not.toMatch(/save(?:d)? fridge to cloud|lodówki w chmurze|хмар/i);
  });
});
