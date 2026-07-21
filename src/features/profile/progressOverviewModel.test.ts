import { describe, expect, it } from "vitest";
import { createEmptyNutrients } from "@domain/meal/nutrients";
import type { MealState } from "../meal/mealSlice";
import type { WaterState } from "../water/waterModel";
import type { ProfileState } from "./model/store";
import {
  createProgressOverviewItems,
  formatProgressPercent,
  getProgressTone,
} from "./progressOverviewModel";

const labels = {
  calories: "Calories",
  protein: "Protein",
  water: "Water",
  meals: "Meals",
  weightGoal: "Weight goal",
  checkIn: "Check-in",
  noTarget: "target not set",
  mealsDetail: (count: number) => `${count}/4 today`,
  checkInDetail: (count: number) => `${count} entries`,
};

const createProfile = (overrides: Partial<ProfileState> = {}) =>
  ({
    dailyCalories: 2000,
    weightHistory: [{ date: "2026-07-20T08:00:00.000Z", weight: 82 }],
    measurementHistory: [
      { id: "m1", date: "2026-07-18T08:00:00.000Z", waistCm: 90 },
      { id: "m2", date: "2026-07-19T08:00:00.000Z", waistCm: 89 },
    ],
    targetWeight: 78,
    targetWeightStart: 86,
    ...overrides,
  }) as ProfileState;

const createMeal = (overrides: Partial<MealState> = {}) => {
  const nutrients = createEmptyNutrients();
  nutrients.calories = 1200;
  nutrients.protein = 90;

  return {
    items: [
      {
        id: "meal-1",
        eatenAt: "2026-07-21T09:00:00.000Z",
        mealType: "breakfast",
        origin: "manual",
        quantity: 100,
        product: {
          id: "product-1",
          name: "Rice",
          unit: "g",
          source: "Manual",
          nutrients,
        },
      },
      {
        id: "meal-2",
        eatenAt: "2026-07-20T09:00:00.000Z",
        mealType: "breakfast",
        origin: "manual",
        quantity: 100,
        product: {
          id: "product-2",
          name: "Old rice",
          unit: "g",
          source: "Manual",
          nutrients,
        },
      },
    ],
    totalNutrients: nutrients,
    templates: [],
    savedProducts: [],
    recentProducts: [],
    personalBarcodeProducts: [],
    ...overrides,
  } satisfies MealState;
};

const createWater = (overrides: Partial<WaterState> = {}) =>
  ({
    consumedMl: 1500,
    dailyWaterGoal: 2000,
    glassSizeMl: 250,
    lastLoggedOn: "2026-07-21",
    targetMode: "manual",
    history: [],
    reminders: {
      enabled: false,
      intervalMinutes: 90,
      startTime: "09:00",
      endTime: "21:00",
      lastReminderAt: null,
    },
    ...overrides,
  }) satisfies WaterState;

describe("progressOverviewModel", () => {
  it("builds one tested overview across every counted progress domain", () => {
    const items = createProgressOverviewItems({
      profile: createProfile(),
      meal: createMeal(),
      water: createWater(),
      now: new Date("2026-07-21T12:00:00.000Z"),
      labels,
    });

    expect(items.map((item) => item.domain)).toEqual([
      "calories",
      "protein",
      "water",
      "meals",
      "weight",
      "checkIn",
    ]);
    expect(items.find((item) => item.domain === "calories")).toMatchObject({
      value: 60,
      tone: "watch",
      detail: "1200 / 2000 kcal",
    });
    expect(items.find((item) => item.domain === "protein")).toMatchObject({
      value: 60,
      tone: "watch",
      detail: "90 / 150 g",
    });
    expect(items.find((item) => item.domain === "water")).toMatchObject({
      value: 75,
      tone: "watch",
      detail: "1500 / 2000 ml",
    });
    expect(items.find((item) => item.domain === "meals")).toMatchObject({
      value: 25,
      detail: "1/4 today",
    });
    expect(items.find((item) => item.domain === "weight")).toMatchObject({
      value: 50,
      detail: "82.0 / 78.0 kg",
    });
    expect(items.find((item) => item.domain === "checkIn")).toMatchObject({
      value: 50,
      detail: "2 entries",
    });
  });

  it("keeps missing targets honest instead of inventing percentages", () => {
    const items = createProgressOverviewItems({
      profile: createProfile({
        dailyCalories: 0,
        targetWeight: null,
        measurementHistory: [],
      }),
      meal: createMeal(),
      water: createWater({ dailyWaterGoal: 0 }),
      now: new Date("2026-07-21T12:00:00.000Z"),
      labels,
    });

    expect(items.find((item) => item.domain === "calories")).toMatchObject({
      value: null,
      tone: "missing",
    });
    expect(items.find((item) => item.domain === "protein")).toMatchObject({
      value: null,
      tone: "missing",
    });
    expect(items.find((item) => item.domain === "water")).toMatchObject({
      value: null,
      tone: "missing",
    });
    expect(items.find((item) => item.domain === "weight")).toMatchObject({
      value: null,
      detail: "target not set",
    });
    expect(formatProgressPercent(null)).toBe("-");
    expect(getProgressTone(null)).toBe("missing");
  });
});
