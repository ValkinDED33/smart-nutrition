import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("MealBuilderPage capture routing contract", () => {
  it("opens scanner and photo capture directly instead of hiding them behind secondary tabs", async () => {
    const source = await readFile("src/pages/MealBuilderPage.tsx", "utf8");

    expect(source).toContain("isDirectCaptureMode");
    expect(source).toContain('data-meal-builder-direct-capture="barcode"');
    expect(source).toContain('data-meal-builder-direct-capture="photo"');
    expect(source).toContain("{directCaptureModule}");
    expect(source).toContain("!isDirectCaptureMode");
  });
});
