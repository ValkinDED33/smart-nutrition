import { describe, expect, it } from "vitest";
import { addDays } from "./date";
import { createEmptyNutrients } from "./nutrients";
import { generateNutritionCoachAnalysis } from "./nutritionCoach";
import type { MealEntry, MealType } from "../types/meal";

const createEntry = ({
  daysAgo,
  mealType,
  calories,
  protein,
  fiber,
}: {
  daysAgo: number;
  mealType: MealType;
  calories: number;
  protein: number;
  fiber: number;
}): MealEntry => {
  const nutrients = createEmptyNutrients();
  nutrients.calories = calories;
  nutrients.protein = protein;
  nutrients.fiber = fiber;

  return {
    id: `entry-${daysAgo}-${mealType}-${calories}`,
    mealType,
    eatenAt: addDays(new Date(), -daysAgo).toISOString(),
    origin: "manual",
    quantity: 100,
    product: {
      id: `product-${daysAgo}-${mealType}`,
      name: "Test product",
      unit: "g",
      source: "Manual",
      nutrients,
    },
  };
};

describe("generateNutritionCoachAnalysis", () => {
  it("flags weak logging and low protein when recent data is sparse", () => {
    const analysis = generateNutritionCoachAnalysis({
      items: [
        createEntry({ daysAgo: 0, mealType: "breakfast", calories: 350, protein: 14, fiber: 3 }),
        createEntry({ daysAgo: 2, mealType: "dinner", calories: 600, protein: 22, fiber: 5 }),
      ],
      dailyCalories: 2200,
      goal: "maintain",
      dietStyle: "balanced",
      weight: 80,
      weightHistory: [
        { date: addDays(new Date(), -7).toISOString(), weight: 80 },
        { date: new Date().toISOString(), weight: 80.4 },
      ],
    });

    expect(analysis.score).toBeLessThan(60);
    expect(analysis.insights.map((insight) => insight.code)).toContain("logging_low");
    expect(analysis.insights.map((insight) => insight.code)).toContain("protein_low");
  });

  it("returns a strong on-track result for a stable week", () => {
    const items = Array.from({ length: 7 }, (_, index) => [
      createEntry({ daysAgo: index, mealType: "breakfast", calories: 550, protein: 35, fiber: 8 }),
      createEntry({ daysAgo: index, mealType: "lunch", calories: 700, protein: 42, fiber: 9 }),
      createEntry({ daysAgo: index, mealType: "dinner", calories: 800, protein: 48, fiber: 10 }),
    ]).flat();

    const analysis = generateNutritionCoachAnalysis({
      items,
      dailyCalories: 2100,
      goal: "maintain",
      dietStyle: "balanced",
      weight: 75,
      weightHistory: [
        { date: addDays(new Date(), -14).toISOString(), weight: 75 },
        { date: new Date().toISOString(), weight: 75.2 },
      ],
    });

    expect(analysis.score).toBeGreaterThanOrEqual(80);
    expect(analysis.insights[0]?.code).toBe("on_track");
  });

  it("flags calorie surplus during cutting when weekly average is too high", () => {
    const items = Array.from({ length: 5 }, (_, index) => [
      createEntry({ daysAgo: index, mealType: "breakfast", calories: 750, protein: 35, fiber: 5 }),
      createEntry({ daysAgo: index, mealType: "lunch", calories: 850, protein: 40, fiber: 6 }),
      createEntry({ daysAgo: index, mealType: "dinner", calories: 700, protein: 38, fiber: 5 }),
    ]).flat();

    const analysis = generateNutritionCoachAnalysis({
      items,
      dailyCalories: 1900,
      goal: "cut",
      dietStyle: "balanced",
      weight: 78,
      weightHistory: [
        { date: addDays(new Date(), -10).toISOString(), weight: 78 },
        { date: new Date().toISOString(), weight: 78.5 },
      ],
    });

    expect(analysis.insights.map((insight) => insight.code)).toContain("calories_high");
  });

  it("flags low water and skipped breakfast patterns", () => {
    const items = Array.from({ length: 4 }, (_, index) => [
      createEntry({ daysAgo: index, mealType: "lunch", calories: 700, protein: 42, fiber: 8 }),
      createEntry({ daysAgo: index, mealType: "dinner", calories: 750, protein: 44, fiber: 8 }),
    ]).flat();
    const waterHistory = Array.from({ length: 4 }, (_, index) => {
      const date = addDays(new Date(), -index).toISOString().slice(0, 10);

      return {
        date,
        consumedMl: 900,
        targetMl: 2200,
      };
    });

    const analysis = generateNutritionCoachAnalysis({
      items,
      dailyCalories: 2100,
      goal: "maintain",
      dietStyle: "balanced",
      weight: 75,
      weightHistory: [],
      waterHistory,
    });

    expect(analysis.insights.map((insight) => insight.code)).toContain("water_low");
    expect(analysis.insights.map((insight) => insight.code)).toContain("breakfast_skipped");
    expect(analysis.breakfastSkippedDays).toBe(4);
  });
});
