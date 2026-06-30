import { describe, expect, it, vi } from "vitest";
import { normalizeProfileState } from "./profileSlice";
import { saveProfileStateToCloud } from "./profileCloudSync";

const authApiMock = vi.hoisted(() => ({
  syncRemoteProfileState: vi.fn(),
}));

vi.mock("@shared/api/auth", () => authApiMock);

describe("profileCloudSync", () => {
  it("marks profile sync success only after the remote profile state is saved", async () => {
    const dispatch = vi.fn();
    const profile = normalizeProfileState({ dailyCalories: 2100 });
    authApiMock.syncRemoteProfileState.mockResolvedValueOnce({
      ok: true,
      meta: {
        updatedAt: "2026-06-30T10:00:00.000Z",
        deviceId: "device-1",
      },
    });

    await saveProfileStateToCloud(
      dispatch,
      profile,
      "2026-06-30T09:59:00.000Z"
    );

    expect(authApiMock.syncRemoteProfileState).toHaveBeenCalledWith(profile);
    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      "auth/markSyncStarted",
      "auth/hydrateSyncOutbox",
      "auth/setCloudMeta",
      "auth/markSyncSuccess",
    ]);
  });

  it("throws and marks sync error when the cloud rejects the profile state", async () => {
    const dispatch = vi.fn();
    authApiMock.syncRemoteProfileState.mockResolvedValueOnce({
      ok: false,
      code: "STATE_CONFLICT",
      message: "conflict",
      meta: null,
    });

    await expect(
      saveProfileStateToCloud(dispatch, normalizeProfileState({}))
    ).rejects.toThrow("Cloud data changed on another device");

    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      "auth/markSyncStarted",
      "auth/markSyncError",
    ]);
  });
});
