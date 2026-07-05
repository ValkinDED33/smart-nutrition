import { describe, expect, it } from "vitest";
import type { MealEntry } from "@domain/meal/types";
import { createEmptyNutrients } from "@domain/meal/nutrients";
import type { DietStyle, WomenHealthState } from "@domain/profile/types";
import {
  buildSupplementRecommendations,
  createSupplementRecommendationContextSummary,
  getPrimarySupplementRecommendation,
  type SupplementRecommendationContext,
  type SupplementRecommendationType,
} from "./supplementRecommendationModel";

const womenHealth: WomenHealthState = {
  mode: "none",
  pregnancyWeek: null,
  dueDate: null,
  lastPeriodStartDate: null,
  doctorConfirmed: false,
  notes: "",
  updatedAt: null,
};

const createMeal = (
  name: string,
  eatenAt: string,
  nutrients: Partial<ReturnType<typeof createEmptyNutrients>> = {}
): MealEntry => {
  const fullNutrients = createEmptyNutrients();

  Object.assign(fullNutrients, nutrients);

  return {
    id: name,
    mealType: "breakfast",
    eatenAt,
    quantity: 100,
    origin: "manual",
    product: {
      id: name,
      name,
      unit: "g",
      source: "Manual",
      nutrients: fullNutrients,
    },
  };
};

const createContext = (
  overrides: Partial<SupplementRecommendationContext> = {}
): SupplementRecommendationContext => ({
  now: new Date("2026-07-05T18:30:00.000Z"),
  meals: [
    createMeal("Coffee", "2026-07-05T17:45:00.000Z"),
    createMeal("Salmon salad", "2026-07-05T12:30:00.000Z", {
      fat: 18,
      calcium: 120,
      iron: 2,
      fiber: 5,
    }),
  ],
  waterConsumedMl: 700,
  waterTargetMl: 2200,
  dietStyle: "balanced" as DietStyle,
  allergies: [],
  excludedIngredients: [],
  womenHealth,
  ...overrides,
});

describe("supplementRecommendationModel", () => {
  it("builds the full contextual supplement recommendation set", () => {
    const recommendations = buildSupplementRecommendations(createContext());
    const types = new Set(recommendations.map((item) => item.type));
    const expectedTypes: SupplementRecommendationType[] = [
      "magnesium",
      "vitamin_d",
      "omega_3",
      "zinc",
      "probiotics",
      "iron",
      "calcium",
      "b_complex",
      "hydration",
      "sleep_recovery",
    ];

    expect(recommendations).toHaveLength(expectedTypes.length);
    expectedTypes.forEach((type) => expect(types.has(type)).toBe(true));
  });

  it("connects recommendations with meals, fat, caffeine, water, and sleep context", () => {
    const recommendations = buildSupplementRecommendations(createContext());
    const vitaminD = recommendations.find((item) => item.type === "vitamin_d");
    const magnesium = recommendations.find((item) => item.type === "magnesium");
    const zinc = recommendations.find((item) => item.type === "zinc");
    const sleep = recommendations.find((item) => item.type === "sleep_recovery");

    expect(vitaminD?.context.join(" ")).toContain("жирами");
    expect(magnesium?.blockers.join(" ")).toContain("води");
    expect(zinc?.blockers.join(" ")).toContain("Кава");
    expect(sleep?.surfaces.bedtime_reminder).toContain("вечірній");
  });

  it("keeps pregnancy supplement guidance safe and clinician-bound", () => {
    const recommendations = buildSupplementRecommendations(
      createContext({
        womenHealth: { ...womenHealth, mode: "pregnant", doctorConfirmed: false },
      })
    );
    const iron = recommendations.find((item) => item.type === "iron");

    expect(iron?.reminder.type).toBe("pregnancy_supplement");
    expect(iron?.blockers.join(" ")).toContain("лікаря");
    expect(iron?.deeperExplanation).toContain("лікарським");
  });

  it("creates actionable reminder text without replacing backend reminder contracts", () => {
    const recommendations = buildSupplementRecommendations(createContext());

    recommendations.forEach((item) => {
      expect(item.reminder.text).toContain("щодня");
      expect(["medication", "pregnancy_supplement", "water", "habit"]).toContain(
        item.reminder.type
      );
    });
  });

  it("prioritizes visible blockers for the primary assistant recommendation", () => {
    const primary = getPrimarySupplementRecommendation(buildSupplementRecommendations(createContext()));

    expect(primary?.blockers.length).toBeGreaterThan(0);
    expect(["magnesium", "zinc", "iron", "hydration", "sleep_recovery"]).toContain(
      primary?.type
    );
  });

  it("summarizes deterministic context without pretending to know unavailable signals", () => {
    const summary = createSupplementRecommendationContextSummary(createContext());

    expect(summary.hasRecentCaffeine).toBe(true);
    expect(summary.hasFatMeal).toBe(true);
    expect(summary.waterLow).toBe(true);
  });
});
