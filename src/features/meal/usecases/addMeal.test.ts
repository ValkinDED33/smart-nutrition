import { describe, expect, it, vi } from "vitest";
import { createEmptyNutrients } from "@domain/meal/nutrients";
import { AddMealUseCase } from "./addMeal";
import type { IMealRepository } from "@data/meal";

const createCommand = () => ({
  product: {
    id: "product-1",
    name: "Greek yogurt",
    unit: "g" as const,
    source: "Manual" as const,
    nutrients: {
      ...createEmptyNutrients(),
      calories: 100,
      protein: 10,
      fat: 3,
      carbs: 12,
    },
  },
  quantity: 100,
  mealType: "breakfast" as const,
  profile: {
    dailyCalories: 2200,
    macroGoals: {
      calories: 2200,
      protein: 120,
      fat: 70,
      carbs: 240,
    },
    allergies: [],
    excludedIngredients: [],
    dietStyle: "balanced" as const,
  },
  currentMeals: [],
});

describe("AddMealUseCase", () => {
  it("creates a valid meal draft without using local persistence by default", async () => {
    const useCase = new AddMealUseCase(undefined, () => "meal-1");

    const result = await useCase.execute(createCommand());

    expect(result.isOk).toBe(true);
    expect(result.value).toMatchObject({
      id: "meal-1",
      quantity: 100,
      mealType: "breakfast",
      origin: "manual",
    });
  });

  it("uses an explicit repository only when a caller provides one", async () => {
    const createMeal = vi.fn(async (entry) => ({ ...entry, id: "repo-meal" }));
    const repository: IMealRepository = {
      getMeals: vi.fn(),
      getMealsByRange: vi.fn(),
      getMealById: vi.fn(),
      createMeal,
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
      clearCache: vi.fn(),
    };
    const useCase = new AddMealUseCase(repository, () => "meal-1");

    const result = await useCase.execute(createCommand());

    expect(createMeal).toHaveBeenCalledOnce();
    expect(result.value?.id).toBe("repo-meal");
  });
});
