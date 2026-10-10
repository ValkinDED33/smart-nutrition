import { describe, expect, it } from "vitest";
import {
  createFoodCommandFocusQuery,
  createInitialFoodCommandQuantity,
  createNutritionGoogleSearchUrl,
  isFoodCommandUnitCompatible,
  normalizeTrustedMealProductUnit,
  normalizeFoodCommandFocus,
  parseFoodCommandText,
  shouldTreatMlProductAsSolidFood,
  shouldShowQuickSearchDeadEnd,
} from "./foodCommandCenterModel";

const nutrients = {
  calories: 0,
  protein: 0,
  fat: 0,
  saturatedFat: 0,
  monounsaturatedFat: 0,
  polyunsaturatedFat: 0,
  transFat: 0,
  omega3: 0,
  omega6: 0,
  omega9: 0,
  cholesterol: 0,
  carbs: 0,
  sugars: 0,
  fiber: 0,
  starch: 0,
  glucose: 0,
  fructose: 0,
  sucrose: 0,
  lactose: 0,
  water: 0,
  sodium: 0,
  potassium: 0,
  vitaminA: 0,
  vitaminB: 0,
  vitaminB1: 0,
  vitaminB2: 0,
  vitaminB3: 0,
  vitaminB5: 0,
  vitaminB6: 0,
  vitaminB7: 0,
  vitaminB9: 0,
  vitaminB12: 0,
  vitaminC: 0,
  vitaminD: 0,
  vitaminE: 0,
  vitaminK: 0,
  calcium: 0,
  iron: 0,
  magnesium: 0,
  zinc: 0,
  phosphorus: 0,
  iodine: 0,
  selenium: 0,
  copper: 0,
};

describe("foodCommandCenterModel", () => {
  it("starts quantity empty so mobile users can type immediately", () => {
    expect(createInitialFoodCommandQuantity()).toBe("");
  });

  it("normalizes assistant food handoff focus into a safe initial query", () => {
    expect(normalizeFoodCommandFocus("protein")).toBe("protein");
    expect(normalizeFoodCommandFocus("food")).toBe("food");
    expect(normalizeFoodCommandFocus("scanner")).toBeNull();
    expect(createFoodCommandFocusQuery("protein")).toBe("protein");
    expect(createFoodCommandFocusQuery("food")).toBe("");
    expect(createFoodCommandFocusQuery(null)).toBe("");
  });

  it("shows a recovery path when quick search has no online or saved suggestions", () => {
    expect(
      shouldShowQuickSearchDeadEnd({
        query: "quinoa",
        isSearching: false,
        isError: false,
        suggestionCount: 0,
      })
    ).toBe(true);
  });

  it("does not show the recovery path while searching, on errors, short queries, or matches", () => {
    expect(
      shouldShowQuickSearchDeadEnd({
        query: "quinoa",
        isSearching: true,
        isError: false,
        suggestionCount: 0,
      })
    ).toBe(false);
    expect(
      shouldShowQuickSearchDeadEnd({
        query: "quinoa",
        isSearching: false,
        isError: true,
        suggestionCount: 0,
      })
    ).toBe(false);
    expect(
      shouldShowQuickSearchDeadEnd({
        query: "qi",
        isSearching: false,
        isError: false,
        suggestionCount: 0,
      })
    ).toBe(false);
    expect(
      shouldShowQuickSearchDeadEnd({
        query: "quinoa",
        isSearching: false,
        isError: false,
        suggestionCount: 1,
      })
    ).toBe(false);
  });

  it("builds a Google nutrition fallback URL only for useful queries", () => {
    expect(createNutritionGoogleSearchUrl("  chicken   breast ")).toContain(
      "chicken%20breast%20nutrition%20facts%20calories%20protein"
    );
    expect(createNutritionGoogleSearchUrl("ab")).toBe("#");
  });

  it("parses explicit food commands without creating a second meal logger", () => {
    expect(parseFoodCommandText("add lunch 200 g chicken breast")).toEqual({
      query: "chicken breast",
      quantity: 200,
      unit: "g",
      mealType: "lunch",
    });
    expect(parseFoodCommandText("додай сніданок 250 мл апельсиновий сік")).toEqual({
      query: "апельсиновий сік",
      quantity: 250,
      unit: "ml",
      mealType: "breakfast",
    });
    expect(parseFoodCommandText("запиши перекус 1 штука банан")).toEqual({
      query: "банан",
      quantity: 1,
      unit: "piece",
      mealType: "snack",
    });
  });

  it("rejects vague product search text as a save command", () => {
    expect(parseFoodCommandText("banana")).toBeNull();
    expect(parseFoodCommandText("add rice")).toBeNull();
    expect(parseFoodCommandText("200 g")).toBeNull();
  });

  it("requires command units to match product units before direct save", () => {
    expect(isFoodCommandUnitCompatible("g", "g")).toBe(true);
    expect(isFoodCommandUnitCompatible("ml", "ml")).toBe(true);
    expect(isFoodCommandUnitCompatible("piece", "piece")).toBe(true);
    expect(isFoodCommandUnitCompatible("ml", "g")).toBe(false);
  });

  it("normalizes suspicious solid catalog products from ml to grams before saving", () => {
    const bananaChips = {
      id: "off-banana-chips",
      name: "Banana chips",
      unit: "ml" as const,
      source: "OpenFoodFacts" as const,
      category: "Plant Based Foods And Beverages",
      nutrients: { ...nutrients, calories: 528, protein: 2.3, carbs: 58, fat: 34 },
      facts: { servingUnit: "ml" as const },
    };

    expect(shouldTreatMlProductAsSolidFood(bananaChips)).toBe(true);
    expect(normalizeTrustedMealProductUnit(bananaChips).unit).toBe("g");
    expect(normalizeTrustedMealProductUnit(bananaChips).facts?.servingUnit).toBe("g");
  });

  it("keeps liquid catalog products in milliliters", () => {
    const juice = {
      id: "off-juice",
      name: "Orange juice",
      unit: "ml" as const,
      source: "OpenFoodFacts" as const,
      category: "beverages",
      nutrients: { ...nutrients, calories: 45, protein: 0.5, carbs: 10, fat: 0 },
    };

    expect(shouldTreatMlProductAsSolidFood(juice)).toBe(false);
    expect(normalizeTrustedMealProductUnit(juice).unit).toBe("ml");
  });
});
