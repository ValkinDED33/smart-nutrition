import { beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeProfileState, setAssistantCustomization } from "./profileSlice";
import {
  applyProfileActionInCloud,
  buildProfileStateAfterAction,
  rebaseProfileStateChange,
  saveProfileAndUserToCloud,
  saveProfileAndUserToCloudWithConflictRebase,
  saveProfileStateToCloud,
  saveProfileStateToCloudWithConflictRebase,
} from "./profileCloudSync";

const authApiMock = vi.hoisted(() => ({
  syncRemoteProfileState: vi.fn(),
  syncRemoteProfileWithUser: vi.fn(),
  pullRemoteAppSnapshot: vi.fn(),
}));

vi.mock("@shared/api/auth", () => authApiMock);

const ASSISTANT_NAME = "Alex";
const CLOUD_DEVICE_ID = "device-1";
const PROFILE_SYNC_FAILED_MESSAGE =
  "Cloud sync could not save the latest profile data.";
const RAW_PROFILE_SYNC_ERROR = "Provider stack trace: profile database failed";
const PROFILE_RENDER_MODE_3D = "3d";
const PROFILE_CALORIES = 2100;
const PROFILE_REBASED_CALORIES = 2400;
const CLOUD_SNAPSHOT_UPDATED_AT = "2026-07-02T08:20:00.000Z";
const PROFILE_UPDATED_AT = "2026-07-01T08:20:00.000Z";
const PROFILE_PREVIOUS_UPDATED_AT = "2026-07-01T08:19:00.000Z";
const ACTION_SYNC_STARTED = "auth/markSyncStarted";
const ACTION_HYDRATE_SYNC_OUTBOX = "auth/hydrateSyncOutbox";
const ACTION_SET_CLOUD_META = "auth/setCloudMeta";
const ACTION_SYNC_SUCCESS = "auth/markSyncSuccess";
const ACTION_SYNC_ERROR = "auth/markSyncError";
const ACTION_REPLACE_PROFILE = "profile/replaceProfileState";
const ACTION_HYDRATE_COMPANION = "companion/hydrateCompanionState";
const USER_PROFILE_FIXTURE = {
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

describe("profileCloudSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reuses the profile reducer to build the next cloud state", () => {
    const current = normalizeProfileState({});
    const next = buildProfileStateAfterAction(
      current,
      setAssistantCustomization({ name: ASSISTANT_NAME })
    );

    expect(next.assistant.name).toBe(ASSISTANT_NAME);
    expect(current.assistant.name).not.toBe(ASSISTANT_NAME);
  });

  it("rebases only the changed profile fields onto a fresh cloud snapshot", () => {
    const baseProfile = normalizeProfileState({
      dailyCalories: 2100,
      targetWeight: 80,
      assistant: { name: "Helper" },
    });
    const nextProfile = normalizeProfileState({
      ...baseProfile,
      targetWeight: 75,
    });
    const freshProfile = normalizeProfileState({
      dailyCalories: 2300,
      targetWeight: 80,
      assistant: { name: "Cloud Helper" },
    });

    const rebasedProfile = rebaseProfileStateChange(
      baseProfile,
      nextProfile,
      freshProfile
    );

    expect(rebasedProfile.dailyCalories).toBe(2300);
    expect(rebasedProfile.targetWeight).toBe(75);
    expect(rebasedProfile.assistant.name).toBe("Cloud Helper");
  });

  it("updates local profile only after the cloud save succeeds", async () => {
    const dispatch = vi.fn();
    authApiMock.syncRemoteProfileState.mockResolvedValueOnce({
      ok: true,
      meta: {
        updatedAt: PROFILE_UPDATED_AT,
        deviceId: CLOUD_DEVICE_ID,
      },
    });

    await applyProfileActionInCloud(
      dispatch,
      normalizeProfileState({}),
      setAssistantCustomization({ name: ASSISTANT_NAME }),
      PROFILE_PREVIOUS_UPDATED_AT
    );

    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      ACTION_SYNC_STARTED,
      ACTION_HYDRATE_SYNC_OUTBOX,
      ACTION_SET_CLOUD_META,
      ACTION_SYNC_SUCCESS,
      ACTION_REPLACE_PROFILE,
    ]);
  });

  it("saves companion render mode preference through the profile cloud contract", async () => {
    const dispatch = vi.fn();
    authApiMock.syncRemoteProfileState.mockResolvedValueOnce({
      ok: true,
      meta: {
        updatedAt: "2026-07-01T08:25:00.000Z",
        deviceId: CLOUD_DEVICE_ID,
      },
    });

    const nextProfile = await applyProfileActionInCloud(
      dispatch,
      normalizeProfileState({}),
      setAssistantCustomization({ preferredCompanionRenderMode: PROFILE_RENDER_MODE_3D }),
      "2026-07-01T08:24:00.000Z"
    );

    expect(nextProfile.assistant.preferredCompanionRenderMode).toBe(PROFILE_RENDER_MODE_3D);
    expect(authApiMock.syncRemoteProfileState).toHaveBeenCalledWith(
      expect.objectContaining({
        assistant: expect.objectContaining({
          preferredCompanionRenderMode: PROFILE_RENDER_MODE_3D,
        }),
      })
    );
    expect(dispatch.mock.calls.at(-1)?.[0]).toMatchObject({
      type: ACTION_REPLACE_PROFILE,
      payload: expect.objectContaining({
        assistant: expect.objectContaining({
          preferredCompanionRenderMode: PROFILE_RENDER_MODE_3D,
        }),
      }),
    });
  });

  it("does not apply companion render mode locally when cloud save fails", async () => {
    const dispatch = vi.fn();
    authApiMock.syncRemoteProfileState.mockResolvedValueOnce({
      ok: false,
      code: "SYNC_FAILED",
      message: RAW_PROFILE_SYNC_ERROR,
    });

    await expect(
      applyProfileActionInCloud(
        dispatch,
        normalizeProfileState({}),
        setAssistantCustomization({ preferredCompanionRenderMode: PROFILE_RENDER_MODE_3D })
      )
    ).rejects.toThrow(PROFILE_SYNC_FAILED_MESSAGE);

    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      ACTION_SYNC_STARTED,
      ACTION_SYNC_ERROR,
    ]);
    expect(dispatch).toHaveBeenCalledWith({
      type: ACTION_SYNC_ERROR,
      payload: PROFILE_SYNC_FAILED_MESSAGE,
    });
  });

  it("marks profile sync success only after the remote profile state is saved", async () => {
    const dispatch = vi.fn();
    const profile = normalizeProfileState({ dailyCalories: PROFILE_CALORIES });
    authApiMock.syncRemoteProfileState.mockResolvedValueOnce({
      ok: true,
      meta: {
        updatedAt: "2026-06-30T10:00:00.000Z",
        deviceId: CLOUD_DEVICE_ID,
      },
    });

    await saveProfileStateToCloud(
      dispatch,
      profile,
      "2026-06-30T09:59:00.000Z"
    );

    expect(authApiMock.syncRemoteProfileState).toHaveBeenCalledWith(profile);
    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      ACTION_SYNC_STARTED,
      ACTION_HYDRATE_SYNC_OUTBOX,
      ACTION_SET_CLOUD_META,
      ACTION_SYNC_SUCCESS,
    ]);
  });

  it("saves user profile and profile state through one cloud contract", async () => {
    const dispatch = vi.fn();
    const profile = normalizeProfileState({ dailyCalories: PROFILE_CALORIES });
    const user = USER_PROFILE_FIXTURE;
    authApiMock.syncRemoteProfileWithUser.mockResolvedValueOnce({
      ok: true,
      user,
      meta: {
        updatedAt: PROFILE_UPDATED_AT,
        deviceId: CLOUD_DEVICE_ID,
      },
    });

    const result = await saveProfileAndUserToCloud(
      dispatch,
      user,
      profile,
      PROFILE_PREVIOUS_UPDATED_AT
    );

    expect(result).toEqual(user);
    expect(authApiMock.syncRemoteProfileWithUser).toHaveBeenCalledWith(
      user,
      profile
    );
    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      ACTION_SYNC_STARTED,
      ACTION_HYDRATE_SYNC_OUTBOX,
      ACTION_SET_CLOUD_META,
      ACTION_SYNC_SUCCESS,
    ]);
  });

  it("does not confirm user profile save when the combined cloud contract fails", async () => {
    const dispatch = vi.fn();
    const profile = normalizeProfileState({ dailyCalories: PROFILE_CALORIES });
    const user = USER_PROFILE_FIXTURE;
    authApiMock.syncRemoteProfileWithUser.mockResolvedValueOnce({
      ok: false,
      code: "SYNC_FAILED",
      message: RAW_PROFILE_SYNC_ERROR,
    });

    await expect(
      saveProfileAndUserToCloud(
        dispatch,
        user,
        profile,
        PROFILE_PREVIOUS_UPDATED_AT
      )
    ).rejects.toThrow(PROFILE_SYNC_FAILED_MESSAGE);

    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      ACTION_SYNC_STARTED,
      ACTION_SYNC_ERROR,
    ]);
    expect(dispatch).toHaveBeenCalledWith({
      type: ACTION_SYNC_ERROR,
      payload: PROFILE_SYNC_FAILED_MESSAGE,
    });
  });

  it("rebases a combined profile and user save after a cloud conflict", async () => {
    const dispatch = vi.fn();
    const staleProfile = normalizeProfileState({
      dailyCalories: PROFILE_CALORIES,
      weightHistory: [{ date: "2026-07-01", weight: 76 }],
    });
    const cloudProfile = normalizeProfileState({
      dailyCalories: PROFILE_REBASED_CALORIES,
      weightHistory: [{ date: "2026-07-02", weight: 75 }],
    });
    const rebasedProfile = normalizeProfileState({
      ...cloudProfile,
      weightHistory: [
        ...cloudProfile.weightHistory,
        { date: "2026-07-03", weight: 74 },
      ],
    });
    const user = {
      ...USER_PROFILE_FIXTURE,
      weight: 74,
    };

    authApiMock.syncRemoteProfileWithUser
      .mockResolvedValueOnce({
        ok: false,
        code: "STATE_CONFLICT",
        message: "conflict",
        meta: null,
      })
      .mockResolvedValueOnce({
        ok: true,
        user,
        meta: {
          updatedAt: PROFILE_UPDATED_AT,
          deviceId: CLOUD_DEVICE_ID,
        },
      });
    authApiMock.pullRemoteAppSnapshot.mockResolvedValueOnce({
      profile: cloudProfile,
      meal: null,
      water: null,
      fridge: null,
      community: null,
      companion: null,
      updatedAt: CLOUD_SNAPSHOT_UPDATED_AT,
      profileUpdatedAt: CLOUD_SNAPSHOT_UPDATED_AT,
      mealUpdatedAt: null,
      waterUpdatedAt: null,
    });

    const result = await saveProfileAndUserToCloudWithConflictRebase(
      dispatch,
      user,
      staleProfile,
      () => rebasedProfile,
      PROFILE_PREVIOUS_UPDATED_AT
    );

    expect(result).toEqual({ user, profile: rebasedProfile });
    expect(authApiMock.syncRemoteProfileWithUser).toHaveBeenNthCalledWith(
      1,
      user,
      staleProfile
    );
    expect(authApiMock.syncRemoteProfileWithUser).toHaveBeenNthCalledWith(
      2,
      user,
      rebasedProfile
    );
    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      ACTION_SYNC_STARTED,
      ACTION_SYNC_STARTED,
      ACTION_REPLACE_PROFILE,
      ACTION_HYDRATE_COMPANION,
      ACTION_HYDRATE_SYNC_OUTBOX,
      ACTION_SET_CLOUD_META,
      ACTION_SYNC_SUCCESS,
      ACTION_HYDRATE_SYNC_OUTBOX,
      ACTION_SET_CLOUD_META,
      ACTION_SYNC_SUCCESS,
    ]);
  });

  it("uses backend-confirmed profile after a combined conflict rebase", async () => {
    const dispatch = vi.fn();
    const staleProfile = normalizeProfileState({
      dailyCalories: PROFILE_CALORIES,
      weightHistory: [{ date: "2026-07-01", weight: 76 }],
    });
    const cloudProfile = normalizeProfileState({
      dailyCalories: PROFILE_REBASED_CALORIES,
      weightHistory: [{ date: "2026-07-02", weight: 75 }],
    });
    const rebasedProfile = normalizeProfileState({
      ...cloudProfile,
      weightHistory: [
        ...cloudProfile.weightHistory,
        { date: "2026-07-03", weight: 74 },
      ],
    });
    const backendConfirmedProfile = normalizeProfileState({
      ...rebasedProfile,
      dailyCalories: 2500,
    });
    const user = {
      ...USER_PROFILE_FIXTURE,
      weight: 74,
    };

    authApiMock.syncRemoteProfileWithUser
      .mockResolvedValueOnce({
        ok: false,
        code: "STATE_CONFLICT",
        message: "conflict",
        meta: null,
      })
      .mockResolvedValueOnce({
        ok: true,
        user,
        profile: backendConfirmedProfile,
        meta: {
          updatedAt: PROFILE_UPDATED_AT,
          deviceId: CLOUD_DEVICE_ID,
        },
      });
    authApiMock.pullRemoteAppSnapshot.mockResolvedValueOnce({
      profile: cloudProfile,
      meal: null,
      water: null,
      fridge: null,
      community: null,
      companion: null,
      updatedAt: CLOUD_SNAPSHOT_UPDATED_AT,
      profileUpdatedAt: CLOUD_SNAPSHOT_UPDATED_AT,
      mealUpdatedAt: null,
      waterUpdatedAt: null,
    });

    const result = await saveProfileAndUserToCloudWithConflictRebase(
      dispatch,
      user,
      staleProfile,
      () => rebasedProfile,
      PROFILE_PREVIOUS_UPDATED_AT
    );

    expect(result).toEqual({ user, profile: backendConfirmedProfile });
  });

  it("throws and marks sync error when the cloud rejects the profile state", async () => {
    const dispatch = vi.fn();
    authApiMock.syncRemoteProfileState.mockResolvedValueOnce({
      ok: false,
      code: "SYNC_FAILED",
      message: RAW_PROFILE_SYNC_ERROR,
    });

    await expect(
      saveProfileStateToCloud(dispatch, normalizeProfileState({}))
    ).rejects.toThrow(PROFILE_SYNC_FAILED_MESSAGE);

    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      ACTION_SYNC_STARTED,
      ACTION_SYNC_ERROR,
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
      ACTION_SYNC_STARTED,
      ACTION_SYNC_STARTED,
      ACTION_REPLACE_PROFILE,
      "companion/hydrateCompanionState",
      ACTION_HYDRATE_SYNC_OUTBOX,
      ACTION_SET_CLOUD_META,
      ACTION_SYNC_SUCCESS,
    ]);
  });

  it("rebases a profile-only save after a cloud conflict", async () => {
    const dispatch = vi.fn();
    const staleProfile = normalizeProfileState({
      dailyCalories: PROFILE_CALORIES,
      targetWeight: 80,
    });
    const nextProfile = normalizeProfileState({
      ...staleProfile,
      targetWeight: 75,
    });
    const cloudProfile = normalizeProfileState({
      dailyCalories: PROFILE_REBASED_CALORIES,
      targetWeight: 80,
    });

    authApiMock.syncRemoteProfileState
      .mockResolvedValueOnce({
        ok: false,
        code: "STATE_CONFLICT",
        message: "conflict",
        meta: null,
      })
      .mockResolvedValueOnce({
        ok: true,
        meta: {
          updatedAt: PROFILE_UPDATED_AT,
          deviceId: CLOUD_DEVICE_ID,
        },
      });
    authApiMock.pullRemoteAppSnapshot.mockResolvedValueOnce({
      profile: cloudProfile,
      meal: null,
      water: null,
      fridge: null,
      community: null,
      companion: null,
      updatedAt: CLOUD_SNAPSHOT_UPDATED_AT,
      profileUpdatedAt: CLOUD_SNAPSHOT_UPDATED_AT,
      mealUpdatedAt: null,
      waterUpdatedAt: null,
    });

    const result = await saveProfileStateToCloudWithConflictRebase(
      dispatch,
      staleProfile,
      nextProfile,
      undefined,
      PROFILE_PREVIOUS_UPDATED_AT
    );

    expect(result.profile.dailyCalories).toBe(PROFILE_REBASED_CALORIES);
    expect(result.profile.targetWeight).toBe(75);
    expect(authApiMock.syncRemoteProfileState).toHaveBeenNthCalledWith(
      1,
      nextProfile
    );
    expect(authApiMock.syncRemoteProfileState).toHaveBeenNthCalledWith(
      2,
      result.profile
    );
    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      ACTION_SYNC_STARTED,
      ACTION_SYNC_STARTED,
      ACTION_REPLACE_PROFILE,
      ACTION_HYDRATE_COMPANION,
      ACTION_HYDRATE_SYNC_OUTBOX,
      ACTION_SET_CLOUD_META,
      ACTION_SYNC_SUCCESS,
      ACTION_HYDRATE_SYNC_OUTBOX,
      ACTION_SET_CLOUD_META,
      ACTION_SYNC_SUCCESS,
    ]);
  });
});
