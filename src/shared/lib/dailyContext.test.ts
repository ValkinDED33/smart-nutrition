import { describe, expect, it } from "vitest";
import { buildDailyContext } from "./dailyContext";
import { addDays } from "./date";
import { createEmptyNutrients } from "./nutrients";
import type { MealEntry, MealType } from "../types/meal";

const now = new Date("2026-05-24T13:30:00.000Z");

const createEntry = ({
  daysAgo,
  mealType,
  hour = 12,
  calories,
  protein,
  fat = 10,
  carbs = 30,
  fiber = 3,
}: {
  daysAgo: number;
  mealType: MealType;
  hour?: number;
  calories: number;
  protein: number;
  fat?: number;
  carbs?: number;
  fiber?: number;
}): MealEntry => {
  const nutrients = createEmptyNutrients();
  nutrients.calories = calories;
  nutrients.protein = protein;
  nutrients.fat = fat;
  nutrients.carbs = carbs;
  nutrients.fiber = fiber;

  const eatenAt = addDays(now, -daysAgo);
  eatenAt.setHours(hour, 0, 0, 0);

  return {
    id: `entry-${daysAgo}-${mealType}-${hour}`,
    mealType,
    eatenAt: eatenAt.toISOString(),
    origin: "manual",
    quantity: 100,
    product: {
      id: `product-${daysAgo}-${mealType}-${hour}`,
      name: "Test product",
      unit: "g",
      source: "Manual",
      nutrients,
    },
  };
};

describe("buildDailyContext", () => {
  it("finds the first-meal focus before any food is logged", () => {
    const context = buildDailyContext({
      items: [],
      dailyCalories: 2000,
      macroTargets: { protein: 120, fat: 70, carbs: 220 },
      waterConsumedMl: 0,
      waterTargetMl: 2200,
      now,
    });

    expect(context.today.entries).toBe(0);
    expect(context.primaryFocus).toBe("log_first_meal");
    expect(context.suggestedMealType).toBe("lunch");
    expect(context.patterns).toContain("light_logging");
  });

  it("compares today with yesterday and detects repeated low protein", () => {
    const context = buildDailyContext({
      items: [
        createEntry({
          daysAgo: 0,
          mealType: "breakfast",
          calories: 420,
          protein: 18,
        }),
        createEntry({
          daysAgo: 1,
          mealType: "lunch",
          calories: 680,
          protein: 24,
        }),
      ],
      dailyCalories: 2100,
      macroTargets: { protein: 130, fat: 70, carbs: 240 },
      waterConsumedMl: 800,
      waterTargetMl: 2200,
      now,
    });

    expect(context.today.protein).toBe(18);
    expect(context.yesterday.protein).toBe(24);
    expect(context.gaps.protein).toBe(112);
    expect(context.primaryFocus).toBe("complete_day");
    expect(context.patterns).toContain("low_protein_repeat");
    expect(context.patterns).toContain("water_low_repeat");
  });

  it("detects steady weeks when calories and protein are in range", () => {
    const items = Array.from({ length: 5 }, (_, index) => [
      createEntry({
        daysAgo: index,
        mealType: "breakfast",
        calories: 520,
        protein: 34,
        fiber: 7,
      }),
      createEntry({
        daysAgo: index,
        mealType: "lunch",
        calories: 720,
        protein: 42,
        fiber: 8,
      }),
      createEntry({
        daysAgo: index,
        mealType: "dinner",
        calories: 720,
        protein: 42,
        fiber: 8,
      }),
    ]).flat();

    const context = buildDailyContext({
      items,
      dailyCalories: 2000,
      macroTargets: { protein: 120, fat: 70, carbs: 220 },
      waterConsumedMl: 2200,
      waterTargetMl: 2200,
      now,
    });

    expect(context.week.daysLogged).toBe(5);
    expect(context.primaryFocus).toBe("steady");
    expect(context.patterns).toContain("steady_streak");
    expect(context.nudgeTone).toBe("celebratory");
  });

  it("detects late snack and calorie overshoot patterns", () => {
    const context = buildDailyContext({
      items: [
        createEntry({
          daysAgo: 0,
          mealType: "breakfast",
          calories: 700,
          protein: 30,
          hour: 8,
        }),
        createEntry({
          daysAgo: 0,
          mealType: "lunch",
          calories: 900,
          protein: 42,
          hour: 13,
        }),
        createEntry({
          daysAgo: 0,
          mealType: "snack",
          calories: 650,
          protein: 8,
          hour: 22,
        }),
        createEntry({
          daysAgo: 2,
          mealType: "snack",
          calories: 320,
          protein: 6,
          hour: 21,
        }),
      ],
      dailyCalories: 1900,
      macroTargets: { protein: 120, fat: 65, carbs: 210 },
      waterConsumedMl: 1600,
      waterTargetMl: 2200,
      now,
    });

    expect(context.primaryFocus).toBe("calories_high");
    expect(context.patterns).toContain("late_snacking");
    expect(context.patterns).toContain("calorie_overshoot");
    expect(context.nudgeTone).toBe("direct");
  });
});
