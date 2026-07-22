import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MealEntry } from "@domain/meal/types";
import { createEmptyNutrients } from "@domain/meal/nutrients";
import { createInitialMealState } from "./mealSlice";
import {
  addMealEntriesToCloud,
  applyMealTemplateInCloud,
  saveMealProductToCloud,
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

const ENTRY_ID_ONE = "one";
const TEMPLATE_ID_ONE = "template-one";
const TEMPLATE_CREATED_AT = "2026-07-03T08:00:00.000Z";
const MISSING_CANONICAL_MEAL_ERROR = "Backend did not return canonical meal state.";
const MEAL_SYNC_FAILED_MESSAGE = "Cloud sync could not save the latest meal data.";
const RAW_MEAL_SYNC_ERROR = "Provider stack trace: meal write failed";

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

  it("rejects quick meal entry success without canonical backend meal state", async () => {
    const dispatch = vi.fn();
    authApiMock.createRemoteMealEntries.mockResolvedValueOnce({
      ok: true,
      meta: null,
    });

    await expect(
      addMealEntriesToCloud(
        dispatch as never,
        createInitialMealState(),
        [createEntry(ENTRY_ID_ONE)]
      )
    ).rejects.toThrow(MISSING_CANONICAL_MEAL_ERROR);

    expect(authApiMock.createRemoteMealEntries).toHaveBeenCalledWith([
      createEntry(ENTRY_ID_ONE),
    ]);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("uses canonical backend meal state when quick add returns it", async () => {
    const dispatch = vi.fn();
    const entry = createEntry(ENTRY_ID_ONE);
    const canonicalEntry = createEntry("server-normalized");
    const canonicalMeal = {
      ...createInitialMealState(),
      items: [canonicalEntry],
    };
    authApiMock.createRemoteMealEntries.mockResolvedValueOnce({
      ok: true,
      meta: null,
      meal: canonicalMeal,
    });

    const next = await addMealEntriesToCloud(
      dispatch as never,
      createInitialMealState(),
      [entry]
    );

    expect(next).toBe(canonicalMeal);
    expect(next.items).toEqual([canonicalEntry]);
    expect(dispatch).toHaveBeenCalledWith(replaceMealState(canonicalMeal));
  });

  it("does not mutate the runtime meal state when quick add save fails", async () => {
    const dispatch = vi.fn();
    authApiMock.createRemoteMealEntries.mockResolvedValueOnce({
      ok: false,
      code: "REMOTE_UNAVAILABLE",
      message: RAW_MEAL_SYNC_ERROR,
      meta: null,
    });

    await expect(
      addMealEntriesToCloud(
        dispatch as never,
        createInitialMealState(),
        [createEntry(ENTRY_ID_ONE)]
      )
    ).rejects.toThrow(MEAL_SYNC_FAILED_MESSAGE);

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("rejects meal template success without canonical backend meal state", async () => {
    const dispatch = vi.fn();
    const template = {
      id: TEMPLATE_ID_ONE,
      name: "Lunch",
      mealType: "lunch" as const,
      items: [{ product: createEntry(ENTRY_ID_ONE).product, quantity: 120 }],
      createdAt: TEMPLATE_CREATED_AT,
    };
    authApiMock.createRemoteMealTemplate.mockResolvedValueOnce({
      ok: true,
      meta: null,
    });

    await expect(
      saveMealTemplateToCloud(
        dispatch as never,
        createInitialMealState(),
        template
      )
    ).rejects.toThrow(MISSING_CANONICAL_MEAL_ERROR);

    expect(authApiMock.createRemoteMealTemplate).toHaveBeenCalledWith(template);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("uses canonical backend meal state when template save returns it", async () => {
    const dispatch = vi.fn();
    const template = {
      id: TEMPLATE_ID_ONE,
      name: "Lunch",
      mealType: "lunch" as const,
      items: [{ product: createEntry(ENTRY_ID_ONE).product, quantity: 120 }],
      createdAt: TEMPLATE_CREATED_AT,
    };
    const canonicalMeal = {
      ...createInitialMealState(),
      templates: [{ ...template, name: "Server Lunch" }],
    };
    authApiMock.createRemoteMealTemplate.mockResolvedValueOnce({
      ok: true,
      meta: null,
      meal: canonicalMeal,
    });

    const next = await saveMealTemplateToCloud(
      dispatch as never,
      createInitialMealState(),
      template
    );

    expect(next).toBe(canonicalMeal);
    expect(next.templates).toEqual([
      expect.objectContaining({ name: "Server Lunch" }),
    ]);
    expect(dispatch).toHaveBeenCalledWith(replaceMealState(canonicalMeal));
  });

  it("rejects saved product success without canonical backend meal state", async () => {
    const dispatch = vi.fn();
    const product = createEntry(ENTRY_ID_ONE).product;
    authApiMock.saveRemoteMealProduct.mockResolvedValueOnce({
      ok: true,
      meta: null,
    });

    await expect(
      saveMealProductToCloud(dispatch as never, createInitialMealState(), product)
    ).rejects.toThrow(MISSING_CANONICAL_MEAL_ERROR);

    expect(authApiMock.saveRemoteMealProduct).toHaveBeenCalledWith("saved", product);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("uses the same cloud-confirmed path when applying templates", async () => {
    const dispatch = vi.fn();
    const entry = createEntry("one");
    const meal = {
      ...createInitialMealState(),
      templates: [
        {
          id: TEMPLATE_ID_ONE,
          name: "Breakfast",
          mealType: "breakfast" as const,
          items: [{ product: entry.product, quantity: entry.quantity }],
          createdAt: TEMPLATE_CREATED_AT,
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
      TEMPLATE_ID_ONE,
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
        [createEntry(ENTRY_ID_ONE)]
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
