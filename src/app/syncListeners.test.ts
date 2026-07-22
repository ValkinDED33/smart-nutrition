import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  registerRemoteSyncListeners,
  remoteSyncListenerMiddleware,
} from "./syncListeners";
import authReducer, { setCredentials } from "../features/auth/authSlice";
import communityReducer from "../features/community/communitySlice";
import companionReducer from "../features/companion/model/store";
import fridgeReducer from "../features/fridge/fridgeSlice";
import mealReducer from "../features/meal/mealSlice";
import profileReducer from "../features/profile/profileSlice";
import waterReducer, { incrementWater } from "../features/water/waterSlice";
import { awardCompanionReward } from "../features/companion/model/store";

const { syncRemoteCompanionStateMock, syncRemoteWaterStateMock } = vi.hoisted(() => ({
  syncRemoteCompanionStateMock: vi.fn(),
  syncRemoteWaterStateMock: vi.fn(),
}));

const TEST_USER_ID = "user-1";
const TEST_USER_EMAIL = "test@example.com";
const TEST_SYNC_MODE = "remote-cloud";
const CLOUD_BASE_VERSION = "base-version";
const SYNC_ERROR_MESSAGE = "Cloud sync could not save the latest change.";
const VISIBLE_SYNC_ERROR_MESSAGE =
  "Cloud sync could not save the latest app data.";
const RAW_SYNC_ERROR = "Provider stack trace: automatic sync write failed";

vi.mock("../shared/api/auth", () => {
  const okResult = { ok: true, meta: { updatedAt: "sync-ok" } };
  class MockAuthApiError extends Error {
    code: string;

    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  }

  return {
    AuthApiError: MockAuthApiError,
    analyzeMealPhoto: vi.fn(),
    createRemoteMealEntries: vi.fn(async () => okResult),
    createRemoteMealTemplate: vi.fn(async () => okResult),
    deleteAccount: vi.fn(),
    deleteRemoteMealEntry: vi.fn(async () => okResult),
    deleteRemoteMealProduct: vi.fn(async () => okResult),
    deleteRemoteMealTemplate: vi.fn(async () => okResult),
    exportRemoteAccountData: vi.fn(),
    getAuthRuntimeInfo: vi.fn(() => ({ mode: "remote-cloud" })),
    getRemoteAccountBackup: vi.fn(),
    getRemoteAccountBackups: vi.fn(),
    getRemoteAuthBaseUrl: vi.fn(),
    getRemoteAuthToken: vi.fn(),
    getRemoteBackendAvailability: vi.fn(async () => true),
    getRemoteSnapshotMeta: vi.fn(),
    isCloudSyncActive: vi.fn(() => true),
    login: vi.fn(),
    logout: vi.fn(),
    logoutEverywhere: vi.fn(),
    purgeLegacyBrowserAuthStorage: vi.fn(),
    pullRemoteAppSnapshot: vi.fn(),
    refreshRemoteAccessSession: vi.fn(async () => true),
    register: vi.fn(),
    requestPasswordReset: vi.fn(),
    resendRegistrationVerification: vi.fn(),
    resetPassword: vi.fn(),
    restoreSession: vi.fn(),
    saveRemoteMealProduct: vi.fn(async () => okResult),
    syncRemoteCommunityState: vi.fn(async () => okResult),
    syncRemoteCompanionState: syncRemoteCompanionStateMock,
    syncRemoteFridgeState: vi.fn(async () => okResult),
    syncRemoteMealState: vi.fn(async () => okResult),
    syncRemoteProfileState: vi.fn(async () => okResult),
    syncRemoteWaterState: syncRemoteWaterStateMock,
    updateStoredProfile: vi.fn(),
    verifyRegistration: vi.fn(),
  };
});

const createTestStore = () =>
  configureStore({
    reducer: combineReducers({
      profile: profileReducer,
      meal: mealReducer,
      water: waterReducer,
      auth: authReducer,
      fridge: fridgeReducer,
      community: communityReducer,
      companion: companionReducer,
    }),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(remoteSyncListenerMiddleware.middleware),
  });

describe("remote sync listeners", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("syncs companion state when companion rewards change", async () => {
    syncRemoteCompanionStateMock.mockResolvedValue({
      ok: true,
      meta: { updatedAt: "companion-sync-ok" },
    });
    registerRemoteSyncListeners();
    const store = createTestStore();

    store.dispatch(
      setCredentials({
        user: {
          id: TEST_USER_ID,
          name: "Test User",
          email: TEST_USER_EMAIL,
          age: 30,
          weight: 80,
          height: 180,
          gender: "male",
          activity: "moderate",
          goal: "maintain",
          role: "VERIFIED_USER",
        },
        syncMode: TEST_SYNC_MODE,
        syncOutbox: {
          pendingChanges: 0,
          firstQueuedAt: null,
          lastQueuedAt: null,
          lastError: null,
        },
        cloudMeta: { updatedAt: CLOUD_BASE_VERSION },
      })
    );

    store.dispatch(awardCompanionReward("meal_added"));

    await vi.waitFor(() => {
      expect(syncRemoteCompanionStateMock).toHaveBeenCalledTimes(1);
    });
    expect(syncRemoteCompanionStateMock).toHaveBeenCalledWith(
      expect.objectContaining({ xp: expect.any(Number) })
    );
  });

  it("coalesces rapid water updates and syncs the latest water state", async () => {
    const syncedWaterAmounts: number[] = [];

    syncRemoteWaterStateMock.mockImplementation((water: { consumedMl: number }) => {
      syncedWaterAmounts.push(water.consumedMl);

      return Promise.resolve({
        ok: true,
        meta: { updatedAt: `water-${water.consumedMl}` },
      });
    });

    registerRemoteSyncListeners();
    const store = createTestStore();

    store.dispatch(
      setCredentials({
        user: {
          id: TEST_USER_ID,
          name: "Test User",
          email: TEST_USER_EMAIL,
          age: 30,
          weight: 80,
          height: 180,
          gender: "male",
          activity: "moderate",
          goal: "maintain",
          role: "VERIFIED_USER",
        },
        syncMode: TEST_SYNC_MODE,
        syncOutbox: {
          pendingChanges: 0,
          firstQueuedAt: null,
          lastQueuedAt: null,
          lastError: null,
        },
        cloudMeta: { updatedAt: CLOUD_BASE_VERSION },
      })
    );

    store.dispatch(incrementWater(250));
    store.dispatch(incrementWater(250));

    await vi.waitFor(() => {
      expect(syncRemoteWaterStateMock).toHaveBeenCalledTimes(1);
    });

    expect(syncedWaterAmounts).toEqual([500]);
  });

  it("stores product-language sync failure copy instead of raw provider text", async () => {
    syncRemoteWaterStateMock.mockResolvedValueOnce({
      ok: false,
      code: "SYNC_FAILED",
      message: RAW_SYNC_ERROR,
      meta: null,
    });
    registerRemoteSyncListeners();
    const store = createTestStore();

    store.dispatch(
      setCredentials({
        user: {
          id: TEST_USER_ID,
          name: "Test User",
          email: TEST_USER_EMAIL,
          age: 30,
          weight: 80,
          height: 180,
          gender: "male",
          activity: "moderate",
          goal: "maintain",
          role: "VERIFIED_USER",
        },
        syncMode: TEST_SYNC_MODE,
        syncOutbox: {
          pendingChanges: 0,
          firstQueuedAt: null,
          lastQueuedAt: null,
          lastError: null,
        },
        cloudMeta: { updatedAt: CLOUD_BASE_VERSION },
      })
    );

    store.dispatch(incrementWater(250));

    await vi.waitFor(() => {
      expect(syncRemoteWaterStateMock).toHaveBeenCalledTimes(1);
    });

    await vi.waitFor(() => {
      expect(store.getState().auth.syncError).toBe(VISIBLE_SYNC_ERROR_MESSAGE);
    });
    expect(store.getState().auth.syncOutbox.lastError).toBe(SYNC_ERROR_MESSAGE);
    expect(store.getState().auth.syncError).not.toContain(RAW_SYNC_ERROR);
    expect(store.getState().auth.syncOutbox.lastError).not.toContain(RAW_SYNC_ERROR);
  });
});
