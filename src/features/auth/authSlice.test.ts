import { configureStore } from "@reduxjs/toolkit";
import { afterEach, describe, expect, it, vi } from "vitest";
import authReducer, {
  initializeAuth,
  markSyncError,
  retryCloudSync,
  setCredentials,
} from "./authSlice";
import type { User } from "@domain/user/types";
import { createEmptyNutrients } from "@domain/meal/nutrients";
import profileReducer, { setAssistantCustomization } from "../profile/profileSlice";
import mealReducer from "../meal/mealSlice";
import waterReducer from "../water/waterSlice";
import fridgeReducer from "../fridge/fridgeSlice";
import communityReducer from "../community/communitySlice";
import companionReducer from "../companion/model/store";
import { clearSyncOutbox, enqueueSyncOutbox } from "@shared/lib/syncOutbox";

const authApiMock = vi.hoisted(() => ({
  getAuthRuntimeInfo: vi.fn(() => ({
    mode: "remote-cloud" as const,
    providerLabel: "Remote API account",
    sessionLabel: "Secure cookie session",
    syncLabel: "Remote sync",
    securityLabel: "HttpOnly cookie session",
    supportsAccountDeletion: true,
    supportsDataExport: true,
    supportsSessionRevocation: true,
  })),
  getRemoteBackendAvailability: vi.fn(),
  pullRemoteAppSnapshot: vi.fn(),
  restoreSession: vi.fn(),
  syncRemoteCommunityState: vi.fn(),
  syncRemoteCompanionState: vi.fn(),
  syncRemoteFridgeState: vi.fn(),
  syncRemoteMealState: vi.fn(),
  syncRemoteProfileState: vi.fn(),
  syncRemoteWaterState: vi.fn(),
  AuthApiError: class AuthApiError extends Error {
    code: string;

    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

const sessionHintMock = vi.hoisted(() => ({
  hasRecentAuthSessionHint: vi.fn(() => false),
}));

vi.mock("../../shared/api/auth", () => authApiMock);
vi.mock("../../shared/lib/authSessionHint", () => sessionHintMock);

const ONBOARDING_COMPLETED_AT = "2026-06-20T10:00:00.000Z";
const CHAOTIC_SCHEDULE_FRICTION = "chaotic_schedule";
const GENTLE_MOTIVATION_STYLE = "gentle";
const TEST_REMOTE_CLOUD_SYNC_MODE = "remote-cloud";

const createTestStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      profile: profileReducer,
      meal: mealReducer,
      water: waterReducer,
      fridge: fridgeReducer,
      community: communityReducer,
      companion: companionReducer,
    },
  });

const createUser = (id: string): User => ({
  id,
  name: "Cached User",
  email: "cached@example.com",
  emailVerified: true,
  age: 30,
  weight: 82,
  height: 180,
  gender: "male",
  activity: "moderate",
  goal: "cut",
  role: "VERIFIED_USER",
});

const createMealEntry = (id: string) => ({
  id,
  product: {
    id: `product-${id}`,
    name: `Product ${id}`,
    unit: "g" as const,
    source: "Manual" as const,
    nutrients: {
      ...createEmptyNutrients(),
      calories: 120,
      protein: 12,
      carbs: 14,
      fat: 4,
    },
  },
  quantity: 100,
  mealType: "breakfast" as const,
  eatenAt: "2026-07-03T08:00:00.000Z",
  origin: "manual" as const,
});

describe("authSlice", () => {
  afterEach(() => {
    vi.useRealTimers();
    clearSyncOutbox();
    vi.clearAllMocks();
    sessionHintMock.hasRecentAuthSessionHint.mockReturnValue(false);
  });

  it("finishes initialization when remote restore exceeds startup timeout", async () => {
    vi.useFakeTimers();
    const store = createTestStore();

    authApiMock.restoreSession.mockReturnValue(new Promise(() => undefined));

    const resultPromise = store.dispatch(initializeAuth());

    await vi.advanceTimersByTimeAsync(3_500);
    await resultPromise;

    expect(store.getState().auth).toMatchObject({
      user: null,
      error: "REMOTE_API_UNAVAILABLE",
      isAuthenticated: false,
      isInitialized: true,
      isLoading: false,
      sessionRestoreStatus: "idle",
    });
  });

  it("does not auto-login later when startup restore timed out", async () => {
    vi.useFakeTimers();
    const store = createTestStore();
    let resolveSession: (value: { user: User; snapshot: null } | null) => void = () => {};
    const sessionPromise = new Promise<{ user: User; snapshot: null } | null>(
      (resolve) => {
        resolveSession = resolve;
      }
    );

    authApiMock.restoreSession.mockReturnValue(sessionPromise);

    const resultPromise = store.dispatch(initializeAuth());

    await vi.advanceTimersByTimeAsync(3_500);
    await resultPromise;

    resolveSession({
      user: createUser("late-session-user"),
      snapshot: null,
    });
    await vi.runAllTimersAsync();

    expect(store.getState().auth).toMatchObject({
      user: null,
      isAuthenticated: false,
      isInitialized: true,
      isLoading: false,
    });
  });

  it("keeps returning users in restore mode briefly before showing reconnect state", async () => {
    vi.useFakeTimers();
    sessionHintMock.hasRecentAuthSessionHint.mockReturnValue(true);
    const store = createTestStore();

    authApiMock.restoreSession.mockReturnValue(new Promise(() => undefined));

    const resultPromise = store.dispatch(initializeAuth());

    await vi.advanceTimersByTimeAsync(3_500);
    expect(store.getState().auth).toMatchObject({
      isLoading: true,
      isInitialized: false,
      hasSessionHint: true,
      sessionRestoreStatus: "checking",
    });

    await vi.advanceTimersByTimeAsync(5_500);
    await resultPromise;

    expect(store.getState().auth).toMatchObject({
      user: null,
      error: "REMOTE_API_UNAVAILABLE",
      isAuthenticated: false,
      isInitialized: true,
      isLoading: false,
      hasSessionHint: true,
      sessionRestoreStatus: "unavailable",
    });
  });

  it("allows retrying session restore for returning users after backend timeout", async () => {
    vi.useFakeTimers();
    sessionHintMock.hasRecentAuthSessionHint.mockReturnValue(true);
    const store = createTestStore();
    const user = createUser("restored-after-retry");

    authApiMock.restoreSession
      .mockReturnValueOnce(new Promise(() => undefined))
      .mockResolvedValueOnce({ user, snapshot: null });

    const timeoutResult = store.dispatch(initializeAuth());

    await vi.advanceTimersByTimeAsync(9_000);
    await timeoutResult;

    await store.dispatch(initializeAuth());

    expect(store.getState().auth).toMatchObject({
      user,
      isAuthenticated: true,
      isInitialized: true,
      isLoading: false,
      hasSessionHint: true,
      sessionRestoreStatus: "idle",
    });
  });

  it("does not overwrite completed onboarding with an empty remote profile slice", async () => {
    const store = createTestStore();
    const completedAt = ONBOARDING_COMPLETED_AT;
    const user = createUser("completed-user");

    store.dispatch(
      setAssistantCustomization({
        onboarding: {
          preferredName: "Igor",
          primaryGoalNote: "steady",
          goalSelections: ["maintain"],
          mainFriction: CHAOTIC_SCHEDULE_FRICTION,
          mainFrictions: [CHAOTIC_SCHEDULE_FRICTION],
          motivationStyle: GENTLE_MOTIVATION_STYLE,
          motivationStyles: [GENTLE_MOTIVATION_STYLE],
          supportNote: "",
          completedAt,
        },
      })
    );
    authApiMock.restoreSession.mockResolvedValue({
      user,
      snapshot: {
        profile: null,
        meal: null,
        water: null,
        fridge: null,
        community: null,
        companion: null,
        updatedAt: "2026-06-20T10:01:00.000Z",
      },
    });

    await store.dispatch(initializeAuth());

    expect(store.getState().profile.assistant.onboarding.completedAt).toBe(
      completedAt
    );
    expect(store.getState().auth).toMatchObject({
      user,
      isAuthenticated: true,
      isInitialized: true,
    });
  });

  it("applies cloud snapshot and clears stale pending outbox during restore", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(ONBOARDING_COMPLETED_AT));
    enqueueSyncOutbox("Old unsynced change");
    vi.setSystemTime(new Date("2026-06-20T11:05:00.000Z"));

    const store = createTestStore();
    const user = createUser("cloud-truth-user");
    const completedAt = "2026-06-20T10:30:00.000Z";

    authApiMock.restoreSession.mockResolvedValue({
      user,
      snapshot: {
        profile: {
          assistant: {
            onboarding: {
              preferredName: "Igor",
              goalSelections: ["maintain"],
              mainFrictions: [CHAOTIC_SCHEDULE_FRICTION],
              motivationStyles: [GENTLE_MOTIVATION_STYLE],
              completedAt,
            },
          },
        },
        meal: null,
        water: null,
        fridge: null,
        community: null,
        companion: null,
        updatedAt: "2026-06-20T10:45:00.000Z",
      },
    });

    await store.dispatch(initializeAuth());

    expect(store.getState().profile.assistant.onboarding.completedAt).toBe(
      completedAt
    );
    expect(store.getState().auth.syncOutbox.pendingChanges).toBe(0);
    expect(store.getState().auth.syncStatus).toBe("synced");
  });

  it("hydrates cloud meals and templates during session restore instead of keeping empty runtime meal state", async () => {
    const store = createTestStore();
    const user = createUser("meal-restore-user");
    const cloudEntry = createMealEntry("cloud-breakfast");
    const cloudTemplate = {
      id: "cloud-template",
      name: "Cloud breakfast",
      mealType: "breakfast" as const,
      createdAt: "2026-07-03T09:00:00.000Z",
      items: [{ product: cloudEntry.product, quantity: 100 }],
    };

    expect(store.getState().meal.items).toHaveLength(0);
    expect(store.getState().meal.templates).toHaveLength(0);

    authApiMock.restoreSession.mockResolvedValue({
      user,
      snapshot: {
        profile: null,
        meal: {
          items: [cloudEntry],
          templates: [cloudTemplate],
          savedProducts: [cloudEntry.product],
          recentProducts: [cloudEntry.product],
          personalBarcodeProducts: [],
        },
        water: null,
        fridge: null,
        community: null,
        companion: null,
        updatedAt: "2026-07-03T10:00:00.000Z",
        mealUpdatedAt: "2026-07-03T10:00:00.000Z",
      },
    });

    await store.dispatch(initializeAuth());

    expect(store.getState().meal.items[0]?.id).toBe("cloud-breakfast");
    expect(store.getState().meal.templates[0]?.id).toBe("cloud-template");
    expect(store.getState().meal.savedProducts[0]?.id).toBe(
      "product-cloud-breakfast"
    );
    expect(store.getState().auth).toMatchObject({
      user,
      isAuthenticated: true,
      syncStatus: "synced",
    });
  });

  it("keeps a fresh local outbox for retry instead of silently discarding it", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(ONBOARDING_COMPLETED_AT));
    enqueueSyncOutbox("Recent unsynced change");
    vi.setSystemTime(new Date("2026-06-20T10:05:00.000Z"));

    const store = createTestStore();
    const user = createUser("fresh-outbox-user");
    const completedAt = "2026-06-20T10:03:00.000Z";

    authApiMock.restoreSession.mockResolvedValue({
      user,
      snapshot: {
        profile: {
          assistant: {
            onboarding: {
              preferredName: "Cloud Igor",
              goalSelections: ["maintain"],
              mainFrictions: [CHAOTIC_SCHEDULE_FRICTION],
              motivationStyles: [GENTLE_MOTIVATION_STYLE],
              completedAt,
            },
          },
        },
        meal: null,
        water: null,
        fridge: null,
        community: null,
        companion: null,
        updatedAt: "2026-06-20T09:55:00.000Z",
      },
    });

    await store.dispatch(initializeAuth());

    expect(store.getState().auth.syncOutbox.pendingChanges).toBe(1);
    expect(store.getState().auth.syncStatus).toBe("error");
    expect(store.getState().profile.assistant.onboarding.completedAt).not.toBe(
      completedAt
    );
  });

  it("marks auth initialized when credentials are set explicitly", () => {
    const store = createTestStore();
    const user = createUser("confirmed-user");

    store.dispatch(
      setCredentials({
        user,
        syncMode: TEST_REMOTE_CLOUD_SYNC_MODE,
        syncOutbox: {
          pendingChanges: 0,
          firstQueuedAt: null,
          lastQueuedAt: null,
          lastError: null,
        },
        cloudMeta: null,
      })
    );

    expect(store.getState().auth).toMatchObject({
      user,
      isAuthenticated: true,
      isInitialized: true,
      isLoading: false,
    });
  });

  it("keeps shared cloud sync status free of raw backend failure text", async () => {
    const store = createTestStore();
    const user = createUser("sync-safe-copy-user");

    store.dispatch(
      setCredentials({
        user,
        syncMode: TEST_REMOTE_CLOUD_SYNC_MODE,
        syncOutbox: {
          pendingChanges: 0,
          firstQueuedAt: null,
          lastQueuedAt: null,
          lastError: null,
        },
        cloudMeta: null,
      })
    );

    authApiMock.syncRemoteProfileState.mockResolvedValue({
      ok: false,
      code: "SYNC_FAILED",
      message: "MongoDB connection failed: ECONNRESET provider stack trace",
      meta: null,
    });

    await store.dispatch(retryCloudSync());

    expect(store.getState().auth.syncError).toBe(
      "Cloud sync could not save the latest app data."
    );

    store.dispatch(markSyncError("Redis timeout from backend provider"));

    expect(store.getState().auth.syncError).toBe(
      "Cloud sync could not save the latest app data."
    );
    expect(store.getState().auth.syncError).not.toContain("MongoDB");
    expect(store.getState().auth.syncError).not.toContain("Redis");
    expect(store.getState().auth.syncError).not.toContain("ECONNRESET");
  });
});
