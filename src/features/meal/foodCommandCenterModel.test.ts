import { describe, expect, it } from "vitest";
import {
  createNutritionGoogleSearchUrl,
  shouldShowQuickSearchDeadEnd,
} from "./foodCommandCenterModel";

describe("foodCommandCenterModel", () => {
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
