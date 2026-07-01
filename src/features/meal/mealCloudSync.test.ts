import { describe, expect, it, vi } from "vitest";
import type { MealEntry } from "@domain/meal/types";
import { createEmptyNutrients } from "@domain/meal/nutrients";
import { createInitialMealState } from "./mealSlice";
import { addMealEntriesToCloud } from "./mealCloudSync";

const authApiMock = vi.hoisted(() => ({
  createRemoteMealEntries: vi.fn(),
  createRemoteMealTemplate: vi.fn(),
  deleteRemoteMealEntry: vi.fn(),
  deleteRemoteMealProduct: vi.fn(),
  deleteRemoteMealTemplate: vi.fn(),
  saveRemoteMealProduct: vi.fn(),
  syncRemoteMealState: vi.fn(),
  pullRemoteAppSnapshot: vi.fn(),
}));

vi.mock("@shared/api/auth", () => authApiMock);

const createEntry = (id: string): MealEntry => ({
  id,
  product: {
    id: `product-${id}`,
    name: `Product ${id}`,
    unit: "g",
    source: "Manual",
    nutrients: {
      ...createEmptyNutrients(),
      calories: 100,
      protein: 10,
      carbs: 12,
      fat: 3,
    },
  },
  quantity: 100,
  mealType: "breakfast",
  eatenAt: "2026-06-30T08:00:00.000Z",
  origin: "manual",
});

describe("mealCloudSync", () => {
  it("pulls the latest cloud snapshot instead of applying stale meal entries on conflict", async () => {
    const dispatch = vi.fn();
    const cloudMeal = createInitialMealState();
    authApiMock.createRemoteMealEntries.mockResolvedValueOnce({
      ok: false,
      code: "STATE_CONFLICT",
      message: "conflict",
      meta: null,
    });
    authApiMock.pullRemoteAppSnapshot.mockResolvedValueOnce({
      profile: null,
      meal: cloudMeal,
      water: null,
      fridge: null,
      community: null,
      companion: null,
      updatedAt: "2026-06-30T13:00:00.000Z",
      profileUpdatedAt: null,
      mealUpdatedAt: "2026-06-30T13:00:00.000Z",
      waterUpdatedAt: null,
    });

    await expect(
      addMealEntriesToCloud(
        dispatch as never,
        createInitialMealState(),
        [createEntry("one")]
      )
    ).rejects.toThrow("latest cloud version has been loaded");

    expect(authApiMock.pullRemoteAppSnapshot).toHaveBeenCalledWith({ force: true });
    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      "auth/markSyncStarted",
      "meal/replaceMealState",
      "companion/hydrateCompanionState",
      "auth/hydrateSyncOutbox",
      "auth/setCloudMeta",
      "auth/markSyncSuccess",
    ]);
  });
});
