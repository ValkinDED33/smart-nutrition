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

  it("keeps the day view compact by opening FoodCommandCenter only inside add mode", async () => {
    const source = await readFile("src/pages/MealBuilderPage.tsx", "utf8");
    const foodCommandIndex = source.indexOf("<FoodCommandCenter");
    const addSectionIndex = source.indexOf('displayedActiveSection === "add"');
    const daySectionIndex = source.indexOf('displayedActiveSection === "day"');
    const tabsIndex = source.indexOf("<SectionTabs");
    const blueprintIndex = source.indexOf("<AIMasterBlueprintPanel");

    expect(addSectionIndex).toBeGreaterThan(-1);
    expect(foodCommandIndex).toBeGreaterThan(addSectionIndex);
    expect(daySectionIndex).toBeGreaterThan(foodCommandIndex);
    expect(blueprintIndex).toBeGreaterThan(tabsIndex);
    expect(blueprintIndex).toBeGreaterThan(addSectionIndex);
  });
});
