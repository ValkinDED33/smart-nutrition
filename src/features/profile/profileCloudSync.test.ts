import { describe, expect, it, vi } from "vitest";
import { normalizeProfileState, setAssistantCustomization } from "./profileSlice";
import {
  applyProfileActionInCloud,
  buildProfileStateAfterAction,
  saveProfileAndUserToCloud,
  saveProfileStateToCloud,
} from "./profileCloudSync";

const authApiMock = vi.hoisted(() => ({
  syncRemoteProfileState: vi.fn(),
  syncRemoteProfileWithUser: vi.fn(),
  pullRemoteAppSnapshot: vi.fn(),
}));

vi.mock("@shared/api/auth", () => authApiMock);

describe("profileCloudSync", () => {
  it("reuses the profile reducer to build the next cloud state", () => {
    const current = normalizeProfileState({});
    const next = buildProfileStateAfterAction(
      current,
      setAssistantCustomization({ name: "Alex" })
    );

    expect(next.assistant.name).toBe("Alex");
    expect(current.assistant.name).not.toBe("Alex");
  });

  it("updates local profile only after the cloud save succeeds", async () => {
    const dispatch = vi.fn();
    authApiMock.syncRemoteProfileState.mockResolvedValueOnce({
      ok: true,
      meta: {
        updatedAt: "2026-07-01T08:20:00.000Z",
        deviceId: "device-1",
      },
    });

    await applyProfileActionInCloud(
      dispatch,
      normalizeProfileState({}),
      setAssistantCustomization({ name: "Alex" }),
      "2026-07-01T08:19:00.000Z"
    );

    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      "auth/markSyncStarted",
      "auth/hydrateSyncOutbox",
      "auth/setCloudMeta",
      "auth/markSyncSuccess",
      "profile/replaceProfileState",
    ]);
  });

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

  it("saves user profile and profile state through one cloud contract", async () => {
    const dispatch = vi.fn();
    const profile = normalizeProfileState({ dailyCalories: 2100 });
    const user = {
      id: "user-1",
      email: "profile@example.com",
      name: "Profile User",
      age: 31,
      weight: 76,
      height: 176,
      gender: "male",
      activity: "moderate",
      goal: "maintain",
      role: "USER",
      createdAt: "2026-07-01T08:00:00.000Z",
    } as const;
    authApiMock.syncRemoteProfileWithUser.mockResolvedValueOnce({
      ok: true,
      user,
      meta: {
        updatedAt: "2026-07-01T08:20:00.000Z",
        deviceId: "device-1",
      },
    });

    const result = await saveProfileAndUserToCloud(
      dispatch,
      user,
      profile,
      "2026-07-01T08:19:00.000Z"
    );

    expect(result).toEqual(user);
    expect(authApiMock.syncRemoteProfileWithUser).toHaveBeenCalledWith(
      user,
      profile
    );
    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      "auth/markSyncStarted",
      "auth/hydrateSyncOutbox",
      "auth/setCloudMeta",
      "auth/markSyncSuccess",
    ]);
  });

  it("does not confirm user profile save when the combined cloud contract fails", async () => {
    const dispatch = vi.fn();
    const profile = normalizeProfileState({ dailyCalories: 2100 });
    const user = {
      id: "user-1",
      email: "profile@example.com",
      name: "Profile User",
      age: 31,
      weight: 76,
      height: 176,
      gender: "male",
      activity: "moderate",
      goal: "maintain",
      role: "USER",
      createdAt: "2026-07-01T08:00:00.000Z",
    } as const;
    authApiMock.syncRemoteProfileWithUser.mockResolvedValueOnce({
      ok: false,
      code: "SYNC_FAILED",
      message: "combined profile failed",
    });

    await expect(
      saveProfileAndUserToCloud(
        dispatch,
        user,
        profile,
        "2026-07-01T08:19:00.000Z"
      )
    ).rejects.toThrow("combined profile failed");

    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      "auth/markSyncStarted",
      "auth/markSyncError",
    ]);
  });

  it("throws and marks sync error when the cloud rejects the profile state", async () => {
    const dispatch = vi.fn();
    authApiMock.syncRemoteProfileState.mockResolvedValueOnce({
      ok: false,
      code: "SYNC_FAILED",
      message: "profile failed",
    });

    await expect(
      saveProfileStateToCloud(dispatch, normalizeProfileState({}))
    ).rejects.toThrow("profile failed");

    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      "auth/markSyncStarted",
      "auth/markSyncError",
    ]);
  });

  it("pulls and applies the latest cloud snapshot when profile save conflicts", async () => {
    const dispatch = vi.fn();
    const cloudProfile = normalizeProfileState({ dailyCalories: 2300 });
    authApiMock.syncRemoteProfileState.mockResolvedValueOnce({
      ok: false,
      code: "STATE_CONFLICT",
      message: "conflict",
      meta: null,
    });
    authApiMock.pullRemoteAppSnapshot.mockResolvedValueOnce({
      profile: cloudProfile,
      meal: null,
      water: null,
      fridge: null,
      community: null,
      companion: null,
      updatedAt: "2026-06-30T11:00:00.000Z",
      profileUpdatedAt: "2026-06-30T11:00:00.000Z",
      mealUpdatedAt: null,
      waterUpdatedAt: null,
    });

    await expect(
      saveProfileStateToCloud(dispatch, normalizeProfileState({ dailyCalories: 1800 }))
    ).rejects.toThrow("latest cloud version has been loaded");

    expect(authApiMock.pullRemoteAppSnapshot).toHaveBeenCalledWith({ force: true });
    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      "auth/markSyncStarted",
      "auth/markSyncStarted",
      "profile/replaceProfileState",
      "companion/hydrateCompanionState",
      "auth/hydrateSyncOutbox",
      "auth/setCloudMeta",
      "auth/markSyncSuccess",
    ]);
  });
});
