import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

describe("FoodCommandCenter production contract", () => {
  const commandSource = readSource("src/features/meal/FoodCommandCenter.tsx");
  const mealBuilderSource = readSource("src/pages/MealBuilderPage.tsx");

  it("keeps one primary food command center over existing canonical entry flows", () => {
    expect(mealBuilderSource).toContain("<FoodCommandCenter");
    expect(mealBuilderSource).toContain("onOpenTarget={openFoodCommandTarget}");
    expect(mealBuilderSource).not.toContain("const mealInputModes");
    expect(mealBuilderSource).not.toContain("getMealInputModeCopy");
    expect(mealBuilderSource).not.toContain("MEAL_INPUT_GRID_COLUMNS");
  });

  it("routes command targets to existing scanner, photo, saved, builder, search, and catalog surfaces", () => {
    expect(commandSource).toContain('data-food-command-target="photo"');
    expect(commandSource).toContain('data-food-command-target="barcode"');
    expect(commandSource).toContain('data-food-command-target="composer"');
    expect(commandSource).toContain('data-food-command-target="favorites"');
    expect(commandSource).toContain('data-food-command-target="search"');
    expect(commandSource).toContain('| "catalog"');
    expect(commandSource).toContain('onClick={() => onOpenTarget("catalog")}');
    expect(mealBuilderSource).toContain('target === "catalog"');
    expect(mealBuilderSource).toContain('setActiveSection("templates")');
  });
});
