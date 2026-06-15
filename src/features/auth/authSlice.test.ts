import { configureStore } from "@reduxjs/toolkit";
import { afterEach, describe, expect, it, vi } from "vitest";
import authReducer, { initializeAuth, setCredentials } from "./authSlice";
import type { User } from "@domain/user/types";
import profileReducer from "../profile/profileSlice";
import mealReducer from "../meal/mealSlice";
import waterReducer from "../water/waterSlice";
import fridgeReducer from "../fridge/fridgeSlice";
import communityReducer from "../community/communitySlice";
import companionReducer from "../companion/model/store";

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

vi.mock("../../shared/api/auth", () => authApiMock);

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

describe("authSlice", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("finishes initialization when remote restore exceeds startup timeout", async () => {
    vi.useFakeTimers();
    const store = createTestStore();

    authApiMock.restoreSession.mockReturnValue(new Promise(() => undefined));

    const resultPromise = store.dispatch(initializeAuth());

    await vi.advanceTimersByTimeAsync(6_000);
    await resultPromise;

    expect(store.getState().auth).toMatchObject({
      user: null,
      error: "REMOTE_API_UNAVAILABLE",
      isAuthenticated: false,
      isInitialized: true,
      isLoading: false,
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

    await vi.advanceTimersByTimeAsync(6_000);
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

  it("marks auth initialized when credentials are set explicitly", () => {
    const store = createTestStore();
    const user = createUser("confirmed-user");

    store.dispatch(
      setCredentials({
        user,
        syncMode: "remote-cloud",
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
});
