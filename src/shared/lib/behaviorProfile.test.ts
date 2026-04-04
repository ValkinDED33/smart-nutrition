import { describe, expect, it } from "vitest";
import { addDays } from "./date";
import { generateBehaviorProfileAnalysis, getReminderShiftMinutes, hasBehaviorReminderSuggestion } from "./behaviorProfile";
import { createEmptyNutrients } from "./nutrients";
import type { MealEntry, MealType } from "../types/meal";
import type { ReminderTimes } from "../types/profile";

const defaultReminderTimes: ReminderTimes = {
  breakfast: "08:30",
  lunch: "13:00",
  dinner: "19:00",
  snack: "16:30",
};

const createEntry = ({
  daysAgo,
  mealType,
  hour,
  minute,
}: {
  daysAgo: number;
  mealType: MealType;
  hour: number;
  minute: number;
}): MealEntry => {
  const date = addDays(new Date(), -daysAgo);
  date.setHours(hour, minute, 0, 0);

  return {
    id: `${mealType}-${daysAgo}-${hour}-${minute}`,
    mealType,
    eatenAt: date.toISOString(),
    origin: "manual",
    quantity: 100,
    product: {
      id: `product-${mealType}-${daysAgo}`,
      name: "Test",
      unit: "g",
      source: "Manual",
      nutrients: createEmptyNutrients(),
    },
  };
};

describe("behaviorProfile", () => {
  it("calculates streaks from recent activity", () => {
    const analysis = generateBehaviorProfileAnalysis({
      items: [
        createEntry({ daysAgo: 0, mealType: "breakfast", hour: 8, minute: 10 }),
        createEntry({ daysAgo: 1, mealType: "lunch", hour: 13, minute: 0 }),
        createEntry({ daysAgo: 2, mealType: "dinner", hour: 19, minute: 10 }),
        createEntry({ daysAgo: 4, mealType: "breakfast", hour: 8, minute: 30 }),
      ],
      reminderTimes: defaultReminderTimes,
    });

    expect(analysis.currentStreak).toBe(3);
    expect(analysis.bestStreak).toBe(3);
    expect(analysis.activeDays).toBe(4);
  });

  it("derives smart reminder times from median meal logging windows", () => {
    const analysis = generateBehaviorProfileAnalysis({
      items: [
        createEntry({ daysAgo: 0, mealType: "breakfast", hour: 8, minute: 40 }),
        createEntry({ daysAgo: 1, mealType: "breakfast", hour: 8, minute: 30 }),
        createEntry({ daysAgo: 2, mealType: "breakfast", hour: 8, minute: 50 }),
      ],
      reminderTimes: defaultReminderTimes,
    });

    expect(analysis.mealHabits.breakfast.averageLogTime).toBe("08:40");
    expect(analysis.suggestedReminderTimes.breakfast).toBe("08:20");
    expect(hasBehaviorReminderSuggestion(defaultReminderTimes, analysis)).toBe(true);
    expect(getReminderShiftMinutes(defaultReminderTimes.breakfast, analysis.suggestedReminderTimes.breakfast)).toBe(-10);
  });

  it("finds strongest and weakest meal habits", () => {
    const analysis = generateBehaviorProfileAnalysis({
      items: [
        createEntry({ daysAgo: 0, mealType: "breakfast", hour: 8, minute: 20 }),
        createEntry({ daysAgo: 1, mealType: "breakfast", hour: 8, minute: 25 }),
        createEntry({ daysAgo: 2, mealType: "breakfast", hour: 8, minute: 30 }),
        createEntry({ daysAgo: 3, mealType: "breakfast", hour: 8, minute: 35 }),
        createEntry({ daysAgo: 0, mealType: "snack", hour: 16, minute: 10 }),
      ],
      reminderTimes: defaultReminderTimes,
    });

    expect(analysis.strongestMealType).toBe("breakfast");
    expect(analysis.weakestMealType).toBe("lunch");
  });
});
