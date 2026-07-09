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

const ASSISTANT_NAME = "Alex";
const CLOUD_DEVICE_ID = "device-1";
const PROFILE_SYNC_FAILED_MESSAGE = "profile failed";
const PROFILE_RENDER_MODE_3D = "3d";
const PROFILE_CALORIES = 2100;
const PROFILE_UPDATED_AT = "2026-07-01T08:20:00.000Z";
const PROFILE_PREVIOUS_UPDATED_AT = "2026-07-01T08:19:00.000Z";
const ACTION_SYNC_STARTED = "auth/markSyncStarted";
const ACTION_HYDRATE_SYNC_OUTBOX = "auth/hydrateSyncOutbox";
const ACTION_SET_CLOUD_META = "auth/setCloudMeta";
const ACTION_SYNC_SUCCESS = "auth/markSyncSuccess";
const ACTION_SYNC_ERROR = "auth/markSyncError";
const ACTION_REPLACE_PROFILE = "profile/replaceProfileState";
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
  it("reuses the profile reducer to build the next cloud state", () => {
    const current = normalizeProfileState({});
    const next = buildProfileStateAfterAction(
      current,
      setAssistantCustomization({ name: ASSISTANT_NAME })
    );

    expect(next.assistant.name).toBe(ASSISTANT_NAME);
    expect(current.assistant.name).not.toBe(ASSISTANT_NAME);
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
      message: PROFILE_SYNC_FAILED_MESSAGE,
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
      message: "combined profile failed",
    });

    await expect(
      saveProfileAndUserToCloud(
        dispatch,
        user,
        profile,
        PROFILE_PREVIOUS_UPDATED_AT
      )
    ).rejects.toThrow("combined profile failed");

    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      ACTION_SYNC_STARTED,
      ACTION_SYNC_ERROR,
    ]);
  });

  it("throws and marks sync error when the cloud rejects the profile state", async () => {
    const dispatch = vi.fn();
    authApiMock.syncRemoteProfileState.mockResolvedValueOnce({
      ok: false,
      code: "SYNC_FAILED",
      message: PROFILE_SYNC_FAILED_MESSAGE,
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
});
