import { describe, expect, it } from "vitest";
import {
  derivePrimaryGoal,
  normalizeSelectedGoals,
  parseOnboardingNumber,
  toggleArrayValue,
} from "./types";

describe("onboarding step helpers", () => {
  it("keeps multi-choice selections instead of forcing a single option", () => {
    expect(toggleArrayValue(["cut"], "healthy")).toEqual(["cut", "healthy"]);
    expect(toggleArrayValue(["cut", "healthy"], "cut")).toEqual(["healthy"]);
  });

  it("derives the primary profile goal from selected onboarding goals", () => {
    expect(derivePrimaryGoal(["healthy"])).toEqual({
      goal: "maintain",
      primaryGoalNote: "healthy",
    });
    expect(derivePrimaryGoal(["healthy", "cut"])).toEqual({
      goal: "cut",
      primaryGoalNote: "",
    });
  });

  it("normalizes selected goals and parses mobile decimal input", () => {
    expect(normalizeSelectedGoals(["cut", "unknown", "healthy"])).toEqual([
      "cut",
      "healthy",
    ]);
    expect(parseOnboardingNumber("111,5")).toBe(111.5);
    expect(parseOnboardingNumber("")).toBeNull();
  });
});
