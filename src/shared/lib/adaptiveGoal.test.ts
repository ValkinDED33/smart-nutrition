import { describe, expect, it } from "vitest";
import {
  applyGoalDelta,
  calculateAdaptiveCalorieTarget,
  calculateAverageDailyCalories,
} from "./adaptiveGoal";

describe("adaptiveGoal", () => {
  it("applies cut and bulk deltas safely", () => {
    expect(applyGoalDelta(2200, "cut")).toBe(1900);
    expect(applyGoalDelta(1500, "cut")).toBe(1200);
    expect(applyGoalDelta(2200, "bulk")).toBe(2450);
    expect(applyGoalDelta(2200, "maintain")).toBe(2200);
  });

  it("calculates average only from days with logged meals", () => {
    const items = [
      {
        id: "1",
        quantity: 100,
        mealType: "breakfast" as const,
        eatenAt: new Date().toISOString(),
        origin: "manual" as const,
        product: { nutrients: { calories: 200 } },
      },
      {
        id: "2",
        quantity: 100,
        mealType: "lunch" as const,
        eatenAt: new Date().toISOString(),
        origin: "manual" as const,
        product: { nutrients: { calories: 400 } },
      },
    ] as const;

    expect(calculateAverageDailyCalories([...items] as never, 7)).toBe(600);
  });

  it("nudges calorie targets based on intake and weight signal", () => {
    const aggressiveCut = calculateAdaptiveCalorieTarget({
      maintenanceCalories: 2500,
      goal: "cut",
      averageIntake: 2550,
      weightChange: 0.6,
    });

    const laggingBulk = calculateAdaptiveCalorieTarget({
      maintenanceCalories: 2500,
      goal: "bulk",
      averageIntake: 2200,
      weightChange: -0.3,
    });

    expect(aggressiveCut).toBeLessThan(2200);
    expect(laggingBulk).toBeGreaterThan(2750);
  });
});
