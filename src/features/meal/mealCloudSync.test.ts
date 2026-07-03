import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MealEntry } from "@domain/meal/types";
import { createEmptyNutrients } from "@domain/meal/nutrients";
import { createInitialMealState } from "./mealSlice";
import {
  addMealEntriesToCloud,
  applyMealTemplateInCloud,
  saveMealTemplateToCloud,
} from "./mealCloudSync";
import { replaceMealState } from "./mealSlice";

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies quick meal entries only after the backend confirms them", async () => {
    const dispatch = vi.fn();
    authApiMock.createRemoteMealEntries.mockResolvedValueOnce({
      ok: true,
      meta: null,
    });

    const next = await addMealEntriesToCloud(
      dispatch as never,
      createInitialMealState(),
      [createEntry("one")]
    );

    expect(next.items).toHaveLength(1);
    expect(authApiMock.createRemoteMealEntries).toHaveBeenCalledWith([
      createEntry("one"),
    ]);
    expect(dispatch).toHaveBeenCalledWith(replaceMealState(next));
  });

  it("does not mutate the runtime meal state when quick add save fails", async () => {
    const dispatch = vi.fn();
    authApiMock.createRemoteMealEntries.mockResolvedValueOnce({
      ok: false,
      code: "REMOTE_UNAVAILABLE",
      message: "backend sleeping",
      meta: null,
    });

    await expect(
      addMealEntriesToCloud(
        dispatch as never,
        createInitialMealState(),
        [createEntry("one")]
      )
    ).rejects.toThrow("backend sleeping");

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("persists meal templates through the backend before exposing them locally", async () => {
    const dispatch = vi.fn();
    const template = {
      id: "template-one",
      name: "Lunch",
      mealType: "lunch" as const,
      items: [{ product: createEntry("one").product, quantity: 120 }],
      createdAt: "2026-07-03T08:00:00.000Z",
    };
    authApiMock.createRemoteMealTemplate.mockResolvedValueOnce({
      ok: true,
      meta: null,
    });

    const next = await saveMealTemplateToCloud(
      dispatch as never,
      createInitialMealState(),
      template
    );

    expect(next.templates).toEqual([template]);
    expect(authApiMock.createRemoteMealTemplate).toHaveBeenCalledWith(template);
    expect(dispatch).toHaveBeenCalledWith(replaceMealState(next));
  });

  it("uses the same cloud-confirmed path when applying templates", async () => {
    const dispatch = vi.fn();
    const entry = createEntry("one");
    const meal = {
      ...createInitialMealState(),
      templates: [
        {
          id: "template-one",
          name: "Breakfast",
          mealType: "breakfast" as const,
          items: [{ product: entry.product, quantity: entry.quantity }],
          createdAt: "2026-07-03T08:00:00.000Z",
        },
      ],
    };
    authApiMock.syncRemoteMealState.mockResolvedValueOnce({
      ok: true,
      meta: null,
    });

    const next = await applyMealTemplateInCloud(
      dispatch as never,
      meal,
      "template-one",
      [entry]
    );

    expect(next.items).toHaveLength(1);
    expect(authApiMock.syncRemoteMealState).toHaveBeenCalledWith(next);
    expect(dispatch).toHaveBeenCalledWith(replaceMealState(next));
  });

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
