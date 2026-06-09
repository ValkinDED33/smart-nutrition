import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { describe, expect, it, vi } from "vitest";
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

const { syncRemoteWaterStateMock } = vi.hoisted(() => ({
  syncRemoteWaterStateMock: vi.fn(),
}));

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
          id: "user-1",
          name: "Test User",
          email: "test@example.com",
          age: 30,
          weight: 80,
          height: 180,
          gender: "male",
          activity: "moderate",
          goal: "maintain",
          role: "VERIFIED_USER",
        },
        syncMode: "remote-cloud",
        syncOutbox: {
          pendingChanges: 0,
          firstQueuedAt: null,
          lastQueuedAt: null,
          lastError: null,
        },
        cloudMeta: { updatedAt: "base-version" },
      })
    );

    store.dispatch(incrementWater(250));
    store.dispatch(incrementWater(250));

    await vi.waitFor(() => {
      expect(syncRemoteWaterStateMock).toHaveBeenCalledTimes(1);
    });

    expect(syncedWaterAmounts).toEqual([500]);
  });
});
