import { describe, expect, it } from "vitest";
import {
  createFoodCommandFocusQuery,
  createInitialFoodCommandQuantity,
  createNutritionGoogleSearchUrl,
  normalizeFoodCommandFocus,
  shouldShowQuickSearchDeadEnd,
} from "./foodCommandCenterModel";

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
});
