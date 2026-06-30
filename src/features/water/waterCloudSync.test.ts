import { describe, expect, it, vi } from "vitest";
import { createInitialWaterState } from "./waterSlice";
import { saveWaterStateToCloud } from "./waterCloudSync";

const authApiMock = vi.hoisted(() => ({
  syncRemoteWaterState: vi.fn(),
}));

vi.mock("@shared/api/auth", () => authApiMock);

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
      "auth/markSyncStarted",
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
      message: "water failed",
    });

    await expect(
      saveWaterStateToCloud(dispatch, createInitialWaterState())
    ).rejects.toThrow("water failed");

    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      "auth/markSyncStarted",
      "auth/markSyncError",
    ]);
  });
});
