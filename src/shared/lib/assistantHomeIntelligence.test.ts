import { describe, expect, it } from "vitest";
import { buildAssistantHomeIntelligence } from "./assistantHomeIntelligence";
import type { DailyContext } from "./dailyContext";

const baseContext: DailyContext = {
  today: {
    dateKey: "2026-05-31",
    entries: 1,
    mealTypes: ["breakfast"],
    calories: 400,
    protein: 18,
    fat: 12,
    carbs: 44,
    fiber: 4,
  },
  yesterday: {
    dateKey: "2026-05-30",
    entries: 3,
    mealTypes: ["breakfast", "lunch", "dinner"],
    calories: 1900,
    protein: 90,
    fat: 60,
    carbs: 210,
    fiber: 20,
  },
  week: {
    daysLogged: 4,
    averageCalories: 1800,
    averageProtein: 92,
    averageFiber: 18,
    averageEntries: 3,
  },
  targets: {
    calories: 2100,
    protein: 130,
    fat: 70,
    carbs: 240,
    fiber: 25,
    waterMl: 2200,
  },
  gaps: {
    calories: 1700,
    protein: 112,
    fat: 58,
    carbs: 196,
    fiber: 21,
    waterMl: 1600,
  },
  progress: {
    calories: 19,
    protein: 14,
    fat: 17,
    carbs: 18,
    fiber: 16,
    water: 27,
  },
  primaryFocus: "protein",
  suggestedMealType: "lunch",
  patterns: ["low_protein_repeat"],
  nudgeTone: "direct",
};

describe("buildAssistantHomeIntelligence", () => {
  it("turns low protein into a protein action", () => {
    const intelligence = buildAssistantHomeIntelligence({
      context: baseContext,
      language: "en",
      now: new Date("2026-05-31T13:00:00.000Z"),
    });

    expect(intelligence.phase).toBe("day");
    expect(intelligence.primaryAction.kind).toBe("meal_search");
    expect(intelligence.primaryAction.searchQuery).toContain("chicken");
  });

  it("turns evening steady days into a review action", () => {
    const intelligence = buildAssistantHomeIntelligence({
      context: { ...baseContext, primaryFocus: "steady", patterns: ["steady_streak"] },
      language: "en",
      now: new Date("2026-05-31T20:00:00.000Z"),
    });

    expect(intelligence.phase).toBe("evening");
    expect(intelligence.primaryAction.kind).toBe("progress");
  });
});
