import { describe, expect, it, vi } from "vitest";
import { createInitialWaterState } from "./waterSlice";
import { saveWaterStateToCloud } from "./waterCloudSync";

const authApiMock = vi.hoisted(() => ({
  syncRemoteWaterState: vi.fn(),
  pullRemoteAppSnapshot: vi.fn(),
}));

vi.mock("@shared/api/auth", () => authApiMock);

const MARK_SYNC_STARTED = "auth/markSyncStarted";
const MARK_SYNC_ERROR = "auth/markSyncError";
const WATER_SYNC_FAILED_MESSAGE = "Cloud sync could not save the latest water data.";
const RAW_WATER_SYNC_ERROR = "Provider stack trace: water write failed";

describe("waterCloudSync", () => {
  it("marks water sync success only after remote save", async () => {
    const dispatch = vi.fn();
    const water = createInitialWaterState();
    authApiMock.syncRemoteWaterState.mockResolvedValueOnce({
      ok: true,
      meta: { updatedAt: "2026-06-30T12:00:00.000Z" },
    });

    await saveWaterStateToCloud(dispatch, water);

    expect(authApiMock.syncRemoteWaterState).toHaveBeenCalledWith(water);
    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      MARK_SYNC_STARTED,
      "auth/hydrateSyncOutbox",
      "auth/setCloudMeta",
      "auth/markSyncSuccess",
    ]);
  });

  it("throws and marks sync error when remote save fails", async () => {
    const dispatch = vi.fn();
    authApiMock.syncRemoteWaterState.mockResolvedValueOnce({
      ok: false,
      code: "SYNC_FAILED",
      message: RAW_WATER_SYNC_ERROR,
    });

    await expect(
      saveWaterStateToCloud(dispatch, createInitialWaterState())
    ).rejects.toThrow(WATER_SYNC_FAILED_MESSAGE);

    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      MARK_SYNC_STARTED,
      MARK_SYNC_ERROR,
    ]);
    expect(dispatch).toHaveBeenCalledWith({
      type: MARK_SYNC_ERROR,
      payload: WATER_SYNC_FAILED_MESSAGE,
    });
  });

  it("pulls and applies the latest cloud snapshot when water save conflicts", async () => {
    const dispatch = vi.fn();
    const cloudWater = createInitialWaterState();
    authApiMock.syncRemoteWaterState.mockResolvedValueOnce({
      ok: false,
      code: "STATE_CONFLICT",
      message: "conflict",
      meta: null,
    });
    authApiMock.pullRemoteAppSnapshot.mockResolvedValueOnce({
      profile: null,
      meal: null,
      water: cloudWater,
      fridge: null,
      community: null,
      companion: null,
      updatedAt: "2026-06-30T12:30:00.000Z",
      profileUpdatedAt: null,
      mealUpdatedAt: null,
      waterUpdatedAt: "2026-06-30T12:30:00.000Z",
    });

    await expect(
      saveWaterStateToCloud(dispatch, {
        ...cloudWater,
        consumedMl: cloudWater.consumedMl + 250,
      })
    ).rejects.toThrow("latest cloud version has been loaded");

    expect(authApiMock.pullRemoteAppSnapshot).toHaveBeenCalledWith({ force: true });
    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      MARK_SYNC_STARTED,
      MARK_SYNC_STARTED,
      "water/replaceWaterState",
      "companion/hydrateCompanionState",
      "auth/hydrateSyncOutbox",
      "auth/setCloudMeta",
      "auth/markSyncSuccess",
    ]);
  });

  it("does not let empty local water overwrite valid cloud water on conflict", async () => {
    const dispatch = vi.fn();
    const emptyLocalWater = createInitialWaterState();
    const cloudWater = {
      ...createInitialWaterState(),
      consumedMl: 1750,
      dailyWaterGoal: 2400,
    };

    authApiMock.syncRemoteWaterState.mockResolvedValueOnce({
      ok: false,
      code: "STATE_CONFLICT",
      message: "conflict",
      meta: null,
    });
    authApiMock.pullRemoteAppSnapshot.mockResolvedValueOnce({
      profile: null,
      meal: null,
      water: cloudWater,
      fridge: null,
      community: null,
      companion: null,
      updatedAt: "2026-07-03T12:30:00.000Z",
      profileUpdatedAt: null,
      mealUpdatedAt: null,
      waterUpdatedAt: "2026-07-03T12:30:00.000Z",
    });

    await expect(saveWaterStateToCloud(dispatch, emptyLocalWater)).rejects.toThrow(
      "latest cloud version has been loaded"
    );

    expect(dispatch).toHaveBeenCalledWith({
      type: "water/replaceWaterState",
      payload: cloudWater,
    });
  });
});
