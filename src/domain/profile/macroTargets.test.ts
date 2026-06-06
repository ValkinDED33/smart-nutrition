import { describe, expect, it } from "vitest";
import { calculateMacroTargets } from "./macroTargets";

describe("calculateMacroTargets", () => {
  it("returns stable balanced targets for maintenance", () => {
    expect(
      calculateMacroTargets({
        calories: 2200,
        weight: 70,
        goal: "maintain",
        dietStyle: "balanced",
      })
    ).toEqual({
      protein: 119,
      fat: 73,
      carbs: 266,
    });
  });

  it("raises protein target for cutting", () => {
    const maintain = calculateMacroTargets({
      calories: 2200,
      weight: 70,
      goal: "maintain",
      dietStyle: "balanced",
    });
    const cut = calculateMacroTargets({
      calories: 1900,
      weight: 70,
      goal: "cut",
      dietStyle: "balanced",
    });

    expect(cut.protein).toBeGreaterThan(maintain.protein);
    expect(cut.carbs).toBeLessThan(maintain.carbs);
  });

  it("caps carbs lower for low-carb plans", () => {
    const balanced = calculateMacroTargets({
      calories: 2400,
      weight: 80,
      goal: "maintain",
      dietStyle: "balanced",
    });
    const lowCarb = calculateMacroTargets({
      calories: 2400,
      weight: 80,
      goal: "maintain",
      dietStyle: "low_carb",
    });

    expect(lowCarb.carbs).toBeLessThan(balanced.carbs);
    expect(lowCarb.fat).toBeGreaterThan(balanced.fat);
  });
});
