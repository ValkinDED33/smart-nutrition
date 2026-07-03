import { configureStore } from "@reduxjs/toolkit";
import { describe, expect, it } from "vitest";
import { createEmptyNutrients } from "@domain/meal/nutrients";
import type { MealEntry, MealTemplate } from "@domain/meal/types";
import type { AppSnapshot } from "@shared/types/appSnapshot";
import authReducer from "@features/auth/authSlice";
import { applyRemoteSnapshotToStore } from "@features/auth/sessionSnapshot";
import companionReducer from "@features/companion/model/store";
import communityReducer from "@features/community/communitySlice";
import fridgeReducer from "@features/fridge/fridgeSlice";
import profileReducer from "@features/profile/profileSlice";
import waterReducer from "@features/water/waterSlice";
import mealReducer, { createInitialMealState, type MealState } from "./mealSlice";
import {
  buildMealStateAfterAddEntries,
  buildMealStateAfterApplyTemplate,
  buildMealStateAfterDeleteTemplate,
  buildMealStateAfterRemoveEntry,
  buildMealStateAfterSaveTemplate,
  buildMealStateAfterUpdateEntry,
  createTemplateEntries,
} from "./mealSaveModel";

const createTestStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      profile: profileReducer,
      meal: mealReducer,
      water: waterReducer,
      fridge: fridgeReducer,
      community: communityReducer,
      companion: companionReducer,
    },
  });

const createProduct = (id: string, calories = 100) => ({
  id: `product-${id}`,
  name: `Product ${id}`,
  unit: "g" as const,
  source: "Manual" as const,
  nutrients: {
    ...createEmptyNutrients(),
    calories,
    protein: 10,
    carbs: 12,
    fat: 3,
  },
});

const createEntry = (
  id: string,
  overrides: Partial<MealEntry> = {}
): MealEntry => ({
  id,
  product: createProduct(id),
  quantity: 100,
  mealType: "breakfast",
  eatenAt: "2026-07-03T08:00:00.000Z",
  origin: "manual",
  ...overrides,
});

const createTemplate = (
  id: string,
  items: MealTemplate["items"] = [
    { product: createProduct(`${id}-template`), quantity: 125 },
  ]
): MealTemplate => ({
  id,
  name: `Template ${id}`,
  mealType: "lunch",
  createdAt: "2026-07-03T09:00:00.000Z",
  items,
});

const createSnapshot = (meal: MealState): AppSnapshot => ({
  profile: null,
  meal,
  water: null,
  fridge: null,
  community: null,
  companion: null,
  updatedAt: "2026-07-03T10:00:00.000Z",
  profileUpdatedAt: null,
  mealUpdatedAt: "2026-07-03T10:00:00.000Z",
  waterUpdatedAt: null,
});

const restoreMealFromCloudSnapshot = (meal: MealState) => {
  const store = createTestStore();

  expect(store.getState().meal.items).toHaveLength(0);
  expect(store.getState().meal.templates).toHaveLength(0);

  const applied = applyRemoteSnapshotToStore(
    store.dispatch,
    createSnapshot(meal)
  );

  expect(applied).toBe(true);
  return store.getState().meal;
};

describe("meal restore contract", () => {
  it("restores a confirmed meal add after refresh or relogin", () => {
    const confirmedMeal = buildMealStateAfterAddEntries(createInitialMealState(), [
      createEntry("meal-one"),
    ]);

    const restored = restoreMealFromCloudSnapshot(confirmedMeal);

    expect(restored.items).toHaveLength(1);
    expect(restored.items[0]?.id).toBe("meal-one");
    expect(restored.recentProducts[0]?.id).toBe("product-meal-one");
  });

  it("restores a confirmed meal edit after refresh or relogin", () => {
    const original = buildMealStateAfterAddEntries(createInitialMealState(), [
      createEntry("meal-edit"),
    ]);
    const confirmedMeal = buildMealStateAfterUpdateEntry(original, {
      id: "meal-edit",
      product: createProduct("updated", 220),
      quantity: 180,
      mealType: "dinner",
    });

    const restored = restoreMealFromCloudSnapshot(confirmedMeal);

    expect(restored.items[0]).toMatchObject({
      id: "meal-edit",
      quantity: 180,
      mealType: "dinner",
      product: { id: "product-updated", name: "Product updated" },
    });
  });

  it("restores a confirmed meal delete after refresh or relogin", () => {
    const original = buildMealStateAfterAddEntries(createInitialMealState(), [
      createEntry("delete-me"),
      createEntry("keep-me"),
    ]);
    const confirmedMeal = buildMealStateAfterRemoveEntry(original, "delete-me");

    const restored = restoreMealFromCloudSnapshot(confirmedMeal);

    expect(restored.items.map((item) => item.id)).toEqual(["keep-me"]);
  });

  it("restores a confirmed template save after refresh or relogin", () => {
    const template = createTemplate("saved-template");
    const confirmedMeal = buildMealStateAfterSaveTemplate(
      createInitialMealState(),
      template
    );

    const restored = restoreMealFromCloudSnapshot(confirmedMeal);

    expect(restored.templates).toEqual([template]);
  });

  it("restores a confirmed template application after refresh or relogin", () => {
    const template = createTemplate("apply-template");
    const mealWithTemplate = buildMealStateAfterSaveTemplate(
      createInitialMealState(),
      template
    );
    const entries = createTemplateEntries(
      template,
      "2026-07-03T12:00:00.000Z"
    );
    const confirmedMeal = buildMealStateAfterApplyTemplate(
      mealWithTemplate,
      template.id,
      entries
    );

    const restored = restoreMealFromCloudSnapshot(confirmedMeal);

    expect(restored.templates[0]?.id).toBe(template.id);
    expect(restored.items).toHaveLength(1);
    expect(restored.items[0]).toMatchObject({
      mealType: template.mealType,
      origin: "recipe",
      eatenAt: "2026-07-03T12:00:00.000Z",
    });
  });

  it("restores a confirmed repeat-yesterday action after refresh or relogin", () => {
    const repeatedEntries = [
      createEntry("repeat-breakfast", {
        eatenAt: "2026-07-03T08:00:00.000Z",
        mealType: "breakfast",
      }),
      createEntry("repeat-lunch", {
        eatenAt: "2026-07-03T12:00:00.000Z",
        mealType: "lunch",
      }),
    ];
    const confirmedMeal = buildMealStateAfterAddEntries(
      createInitialMealState(),
      repeatedEntries
    );

    const restored = restoreMealFromCloudSnapshot(confirmedMeal);

    expect(restored.items.map((item) => item.id)).toEqual([
      "repeat-breakfast",
      "repeat-lunch",
    ]);
  });

  it("does not let an empty runtime meal state erase a valid cloud meal snapshot", () => {
    const cloudMeal = buildMealStateAfterSaveTemplate(
      buildMealStateAfterAddEntries(createInitialMealState(), [
        createEntry("cloud-meal"),
      ]),
      createTemplate("cloud-template")
    );

    const restored = restoreMealFromCloudSnapshot(cloudMeal);

    expect(restored.items[0]?.id).toBe("cloud-meal");
    expect(restored.templates[0]?.id).toBe("cloud-template");
  });

  it("restores a confirmed template delete after refresh or relogin", () => {
    const original = buildMealStateAfterSaveTemplate(
      buildMealStateAfterSaveTemplate(
        createInitialMealState(),
        createTemplate("delete-template")
      ),
      createTemplate("keep-template")
    );
    const confirmedMeal = buildMealStateAfterDeleteTemplate(
      original,
      "delete-template"
    );

    const restored = restoreMealFromCloudSnapshot(confirmedMeal);

    expect(restored.templates.map((template) => template.id)).toEqual([
      "keep-template",
    ]);
  });
});
