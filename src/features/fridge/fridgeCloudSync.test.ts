import { describe, expect, it, vi } from "vitest";
import { createEmptyNutrients } from "@domain/meal/nutrients";
import type { Product } from "@domain/products/types";
import { normalizeFridgeState } from "./fridgeSlice";
import {
  consumeFridgeItemsInCloud,
  upsertFridgeItemInCloud,
} from "./fridgeCloudSync";

const replaceFridgeStateAction = "fridge/replaceFridgeState";

const authApiMock = vi.hoisted(() => ({
  syncRemoteFridgeState: vi.fn(),
  pullRemoteAppSnapshot: vi.fn(),
}));

vi.mock("@shared/api/auth", () => authApiMock);

const createProduct = (id: string): Product => ({
  id,
  name: `Product ${id}`,
  unit: "g",
  source: "Manual",
  nutrients: createEmptyNutrients(),
});

describe("fridgeCloudSync", () => {
  it("updates local fridge only after the cloud save succeeds", async () => {
    const dispatch = vi.fn();
    authApiMock.syncRemoteFridgeState.mockResolvedValueOnce({
      ok: true,
      meta: { updatedAt: "2026-06-30T14:00:00.000Z" },
    });

    await upsertFridgeItemInCloud(
      dispatch as never,
      normalizeFridgeState({}),
      { product: createProduct("one"), quantity: 100 }
    );

    expect(authApiMock.syncRemoteFridgeState).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      replaceFridgeStateAction,
    ]);
  });

  it("pulls the latest cloud snapshot instead of applying stale fridge state on conflict", async () => {
    const dispatch = vi.fn();
    authApiMock.syncRemoteFridgeState.mockResolvedValueOnce({
      ok: false,
      code: "STATE_CONFLICT",
      message: "conflict",
      meta: null,
    });
    authApiMock.pullRemoteAppSnapshot.mockResolvedValueOnce({
      profile: null,
      meal: null,
      water: null,
      fridge: normalizeFridgeState({}),
      community: null,
      companion: null,
      updatedAt: "2026-06-30T14:05:00.000Z",
      profileUpdatedAt: null,
      mealUpdatedAt: null,
      waterUpdatedAt: null,
    });

    await expect(
      upsertFridgeItemInCloud(
        dispatch as never,
        normalizeFridgeState({}),
        { product: createProduct("one"), quantity: 100 }
      )
    ).rejects.toThrow("latest cloud version has been loaded");

    expect(authApiMock.pullRemoteAppSnapshot).toHaveBeenCalledWith({ force: true });
    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      "auth/markSyncStarted",
      replaceFridgeStateAction,
      "companion/hydrateCompanionState",
      "auth/hydrateSyncOutbox",
      "auth/setCloudMeta",
      "auth/markSyncSuccess",
    ]);
  });

  it("persists consumed fridge ingredients only after cloud save succeeds", async () => {
    const dispatch = vi.fn();
    const initial = normalizeFridgeState({
      items: [
        {
          id: "fridge-rice",
          product: createProduct("rice"),
          quantity: 200,
          createdAt: "2026-06-30T10:00:00.000Z",
        },
      ],
    });

    authApiMock.syncRemoteFridgeState.mockResolvedValueOnce({
      ok: true,
      meta: { updatedAt: "2026-06-30T14:10:00.000Z" },
    });

    const next = await consumeFridgeItemsInCloud(dispatch as never, initial, [
      { product: createProduct("rice"), quantity: 50 },
    ]);

    expect(authApiMock.syncRemoteFridgeState).toHaveBeenCalledWith({
      items: [
        {
          ...initial.items[0],
          quantity: 150,
        },
      ],
    });
    expect(next.items[0]?.quantity).toBe(150);
    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      replaceFridgeStateAction,
    ]);
  });
});
