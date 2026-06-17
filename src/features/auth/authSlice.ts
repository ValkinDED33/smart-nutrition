import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CompanionState } from "../../companion";
import type { AppSnapshotMeta } from "../../shared/types/appSnapshot";
import type { User } from "@domain/user/types";
import {
  AuthApiError,
  getAuthRuntimeInfo,
  getRemoteBackendAvailability,
  pullRemoteAppSnapshot,
  restoreSession,
  syncRemoteCommunityState,
  syncRemoteCompanionState,
  syncRemoteFridgeState,
  type RemoteSyncResult,
  syncRemoteMealState,
  syncRemoteProfileState,
  syncRemoteWaterState,
} from "../../shared/api/auth";
import { buildAppSnapshot, getSnapshotMetaFromSnapshot } from "@domain/appSnapshot";
import {
  readCachedRemoteMeta,
  writeCachedRemoteMeta,
  writeCachedRemoteSnapshot,
} from "../../shared/lib/remoteStateCache";
import {
  clearSyncOutbox,
  createEmptySyncOutboxMeta,
  getSyncOutboxMeta,
  type SyncOutboxMeta,
} from "../../shared/lib/syncOutbox";
import { replaceCommunityState, type CommunityState } from "../community/communitySlice";
import { hydrateCompanionState } from "../companion/model/store";
import { replaceFridgeState, type FridgeState } from "../fridge/fridgeSlice";
import { replaceProfileState, type ProfileState } from "../profile/profileSlice";
import { replaceMealState, type MealState } from "../meal/mealSlice";
import { replaceWaterState, type WaterState } from "../water/waterSlice";

export type SyncMode = "remote-cloud";
export type SyncStatus = "syncing" | "synced" | "error";
type RestoreRaceResult =
  | { kind: "remote"; data: Awaited<ReturnType<typeof restoreSession>> }
  | { kind: "timeout" };

const STARTUP_SESSION_TIMEOUT_MS = 3_500;

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  syncMode: SyncMode;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  syncError: string | null;
  cloudMeta: AppSnapshotMeta | null;
  syncOutbox: SyncOutboxMeta;
  syncToast: { id: number; kind: "retry-success" | "outbox-flushed" } | null;
}

interface AuthRootState {
  auth: AuthState;
  profile: ProfileState;
  meal: MealState;
  water: WaterState;
  fridge: FridgeState;
  community: CommunityState;
  companion: CompanionState;
}

const getQueuedSyncMessage = (pendingChanges: number) =>
  pendingChanges <= 1
    ? "1 unsynced change is waiting for cloud confirmation."
    : `${pendingChanges} unsynced changes are waiting for cloud confirmation.`;

const getSyncStatus = (syncOutbox: SyncOutboxMeta): SyncStatus =>
  syncOutbox.pendingChanges > 0 ? "error" : "synced";

const getSyncError = (syncOutbox: SyncOutboxMeta) =>
  syncOutbox.pendingChanges > 0
    ? syncOutbox.lastError ?? getQueuedSyncMessage(syncOutbox.pendingChanges)
    : null;

const getSyncErrorMessage = (result: RemoteSyncResult) =>
  result.code === "STATE_CONFLICT"
    ? "Cloud data changed on another device. Use the latest cloud version before retrying."
    : result.message ?? "Cloud sync could not save the latest app data.";

const cacheCurrentRemoteSnapshot = (
  state: AuthRootState,
  meta: AppSnapshotMeta | null | undefined
) => {
    const snapshot = buildAppSnapshot({
      profile: state.profile,
      meal: state.meal,
      water: state.water,
      fridge: state.fridge,
      community: state.community,
      companion: state.companion,
      meta,
    });

  writeCachedRemoteSnapshot(snapshot);

  if (meta) {
    writeCachedRemoteMeta(meta);
  }
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
  syncMode: "remote-cloud",
  syncStatus: "synced",
  lastSyncedAt: null,
  syncError: null,
  cloudMeta: null,
  syncOutbox: createEmptySyncOutboxMeta(),
  syncToast: null,
};

export const initializeAuth = createAsyncThunk<
  {
    user: User;
    syncMode: SyncMode;
    syncOutbox: SyncOutboxMeta;
    cloudMeta: AppSnapshotMeta | null;
  },
  void,
  { state: AuthRootState; rejectValue: string | null }
>(
  "auth/initialize",
  async (_, { dispatch, rejectWithValue }) => {
    const syncOutbox = getSyncOutboxMeta();
    const applySessionData = (
      data: NonNullable<Awaited<ReturnType<typeof restoreSession>>>
    ) => {
      if (data.snapshot && syncOutbox.pendingChanges === 0) {
        dispatch(replaceProfileState(data.snapshot.profile));
        dispatch(replaceMealState(data.snapshot.meal));
        dispatch(replaceWaterState(data.snapshot.water));
        dispatch(replaceFridgeState(data.snapshot.fridge));
        dispatch(replaceCommunityState(data.snapshot.community));
        dispatch(hydrateCompanionState(data.snapshot.companion));
      }

      const cloudMeta =
        getSnapshotMetaFromSnapshot(data.snapshot) ??
        readCachedRemoteMeta({ allowStale: true });

      if (data.snapshot) {
        writeCachedRemoteSnapshot(data.snapshot);
      }

      return {
        user: data.user,
        syncMode: getAuthRuntimeInfo().mode,
        syncOutbox,
        cloudMeta,
      };
    };

    let startupTimeoutId: ReturnType<typeof globalThis.setTimeout> | null = null;

    try {
      const sessionAbortController = new AbortController();
      const sessionPromise = restoreSession({
        signal: sessionAbortController.signal,
        timeoutMs: STARTUP_SESSION_TIMEOUT_MS,
      });
      const timeoutPromise = new Promise<RestoreRaceResult>((resolve) => {
        startupTimeoutId = globalThis.setTimeout(() => {
          sessionAbortController.abort();
          resolve({ kind: "timeout" });
        }, STARTUP_SESSION_TIMEOUT_MS);
      });
      const startupResult = await Promise.race<RestoreRaceResult>([
        sessionPromise.then((data) => ({ kind: "remote", data })),
        timeoutPromise,
      ]);

      if (startupResult.kind === "timeout") {
        return rejectWithValue("REMOTE_API_UNAVAILABLE");
      }

      if (!startupResult.data) {
        return rejectWithValue(null);
      }

      return applySessionData(startupResult.data);
    } catch (error) {
      const errorCode =
        error instanceof AuthApiError
          ? error.code === "INVALID_CREDENTIALS"
            ? "SESSION_EXPIRED"
            : error.code === "REMOTE_API_UNAVAILABLE"
              ? "REMOTE_API_UNAVAILABLE"
              : null
          : null;

      return rejectWithValue(errorCode);
    } finally {
      if (startupTimeoutId !== null) {
        globalThis.clearTimeout(startupTimeoutId);
      }
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as AuthRootState;

      return !state.auth.isInitialized && !state.auth.isLoading;
    },
  }
);

const pushCurrentStateToCloud = async (state: AuthRootState) => {
  const profileSynced = await syncRemoteProfileState(state.profile);

  if (!profileSynced.ok) {
    return profileSynced;
  }

  const mealSynced = await syncRemoteMealState(state.meal);

  if (!mealSynced.ok) {
    return mealSynced;
  }

  const waterSynced = await syncRemoteWaterState(state.water);

  if (!waterSynced.ok) {
    return waterSynced;
  }

  const fridgeSynced = await syncRemoteFridgeState(state.fridge);

  if (!fridgeSynced.ok) {
    return fridgeSynced;
  }

  const communitySynced = await syncRemoteCommunityState(state.community);

  if (!communitySynced.ok) {
    return communitySynced;
  }

  const companionSynced = await syncRemoteCompanionState(state.companion);

  if (!companionSynced.ok) {
    return companionSynced;
  }

  return {
    ok: true,
    meta:
      companionSynced.meta ??
      communitySynced.meta ??
      fridgeSynced.meta ??
      waterSynced.meta ??
      mealSynced.meta ??
      profileSynced.meta ??
      null,
  } satisfies RemoteSyncResult;
};

export const retryCloudSync = createAsyncThunk<
  { syncedAt: string; syncOutbox: SyncOutboxMeta; cloudMeta: AppSnapshotMeta | null },
  void,
  { state: AuthRootState; rejectValue: string }
>("auth/retryCloudSync", async (_, { dispatch, getState, rejectWithValue }) => {
  const state = getState();
  const syncResult = await pushCurrentStateToCloud(state);

  if (!syncResult.ok) {
    dispatch(setCloudMeta(syncResult.meta ?? readCachedRemoteMeta({ allowStale: true })));
    return rejectWithValue(getSyncErrorMessage(syncResult));
  }

  cacheCurrentRemoteSnapshot(state, syncResult.meta);

  return {
    syncedAt: syncResult.meta?.updatedAt ?? new Date().toISOString(),
    syncOutbox: clearSyncOutbox(),
    cloudMeta: syncResult.meta ?? null,
  };
});

export const flushSyncOutbox = createAsyncThunk<
  { syncedAt: string; syncOutbox: SyncOutboxMeta; cloudMeta: AppSnapshotMeta | null },
  void,
  { state: AuthRootState; rejectValue: string }
>(
  "auth/flushSyncOutbox",
  async (_, { dispatch, getState, rejectWithValue }) => {
    const available = await getRemoteBackendAvailability(true);

    if (!available) {
      return rejectWithValue("Cloud API is still unavailable.");
    }

    const state = getState();
    const syncResult = await pushCurrentStateToCloud(state);

    if (!syncResult.ok) {
      dispatch(setCloudMeta(syncResult.meta ?? readCachedRemoteMeta({ allowStale: true })));
      return rejectWithValue(getSyncErrorMessage(syncResult));
    }

    cacheCurrentRemoteSnapshot(state, syncResult.meta);

    return {
      syncedAt: syncResult.meta?.updatedAt ?? new Date().toISOString(),
      syncOutbox: clearSyncOutbox(),
      cloudMeta: syncResult.meta ?? null,
    };
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as AuthRootState;

      return (
        state.auth.isAuthenticated &&
        state.auth.syncMode === "remote-cloud" &&
        state.auth.syncStatus !== "syncing" &&
        state.auth.syncOutbox.pendingChanges > 0
      );
    },
  }
);

export const pullLatestCloudSnapshot = createAsyncThunk<
  { syncedAt: string; syncOutbox: SyncOutboxMeta; cloudMeta: AppSnapshotMeta | null },
  { discardQueuedChanges?: boolean } | void,
  { state: AuthRootState; rejectValue: string }
>(
  "auth/pullLatestCloudSnapshot",
  async (payload, { dispatch, rejectWithValue }) => {
    const snapshot = await pullRemoteAppSnapshot({ force: true });

    if (!snapshot) {
      return rejectWithValue("Could not pull the latest cloud snapshot.");
    }

    dispatch(replaceProfileState(snapshot.profile));
    dispatch(replaceMealState(snapshot.meal));
    dispatch(replaceWaterState(snapshot.water));
    dispatch(replaceFridgeState(snapshot.fridge));
    dispatch(replaceCommunityState(snapshot.community));
    dispatch(hydrateCompanionState(snapshot.companion));
    writeCachedRemoteSnapshot(snapshot);

    const syncOutbox = payload?.discardQueuedChanges
      ? clearSyncOutbox()
      : getSyncOutboxMeta();

    return {
      syncedAt: snapshot.updatedAt ?? new Date().toISOString(),
      syncOutbox,
      cloudMeta: getSnapshotMetaFromSnapshot(snapshot),
    };
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as AuthRootState;

      return (
        state.auth.isAuthenticated &&
        state.auth.syncMode === "remote-cloud" &&
        state.auth.syncStatus !== "syncing"
      );
    },
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.syncMode = "remote-cloud";
      state.syncStatus = "synced";
      state.lastSyncedAt = null;
      state.syncError = null;
      state.cloudMeta = null;
      state.syncOutbox = createEmptySyncOutboxMeta();
      state.syncToast = null;
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setCredentials(
      state,
      action: PayloadAction<{
        user: User;
        syncMode: SyncMode;
        syncOutbox: SyncOutboxMeta;
        cloudMeta?: AppSnapshotMeta | null;
      }>
    ) {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.isInitialized = true;
      state.error = null;
      state.syncMode = action.payload.syncMode;
      state.syncOutbox = action.payload.syncOutbox;
      state.syncStatus = getSyncStatus(action.payload.syncOutbox);
      state.lastSyncedAt =
        action.payload.syncOutbox.pendingChanges === 0
          ? new Date().toISOString()
          : null;
      state.syncError = getSyncError(action.payload.syncOutbox);
      state.cloudMeta = action.payload.cloudMeta ?? null;
      state.syncToast = null;
    },
    markSyncStarted(state) {
      if (!state.isAuthenticated || state.syncMode !== "remote-cloud") {
        return;
      }

      state.syncStatus = "syncing";
      state.syncError = null;
    },
    markSyncSuccess(state, action: PayloadAction<string | undefined>) {
      if (!state.isAuthenticated || state.syncMode !== "remote-cloud") {
        return;
      }

      state.syncStatus = "synced";
      state.lastSyncedAt = action.payload ?? new Date().toISOString();
      state.syncError = null;
      state.syncOutbox = createEmptySyncOutboxMeta();
    },
    markSyncError(state, action: PayloadAction<string | undefined>) {
      if (!state.isAuthenticated || state.syncMode !== "remote-cloud") {
        return;
      }

      state.syncStatus = "error";
      state.syncError = action.payload ?? "Cloud sync could not save the latest change.";
    },
    hydrateSyncOutbox(state, action: PayloadAction<SyncOutboxMeta>) {
      state.syncOutbox = action.payload;

      if (!state.isAuthenticated || state.syncMode !== "remote-cloud") {
        return;
      }

      if (action.payload.pendingChanges > 0) {
        state.syncStatus = "error";
        state.syncError = getSyncError(action.payload);
        return;
      }

      if (state.syncStatus !== "syncing") {
        state.syncStatus = "synced";
      }

      state.syncError = null;
    },
    setCloudMeta(state, action: PayloadAction<AppSnapshotMeta | null>) {
      state.cloudMeta = action.payload;
    },
    clearSyncToast(state) {
      state.syncToast = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.isInitialized = true;
        state.syncMode = action.payload.syncMode;
        state.syncOutbox = action.payload.syncOutbox;
        state.syncStatus = getSyncStatus(action.payload.syncOutbox);
        state.lastSyncedAt =
          action.payload.syncOutbox.pendingChanges === 0
            ? new Date().toISOString()
            : null;
        state.syncError = getSyncError(action.payload.syncOutbox);
        state.cloudMeta = action.payload.cloudMeta;
        state.syncToast = null;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        const syncMode = getAuthRuntimeInfo().mode;
        const syncOutbox = getSyncOutboxMeta();

        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.isInitialized = true;
        state.error = action.payload ?? null;
        state.syncMode = syncMode;
        state.syncStatus = getSyncStatus(syncOutbox);
        state.lastSyncedAt = null;
        state.syncError = getSyncError(syncOutbox);
        state.cloudMeta = null;
        state.syncOutbox = syncOutbox;
        state.syncToast = null;
      })
      .addCase(retryCloudSync.pending, (state) => {
        if (!state.isAuthenticated || state.syncMode !== "remote-cloud") {
          return;
        }

        state.syncStatus = "syncing";
        state.syncError = null;
      })
      .addCase(retryCloudSync.fulfilled, (state, action) => {
        if (!state.isAuthenticated || state.syncMode !== "remote-cloud") {
          return;
        }

        state.syncStatus = "synced";
        state.lastSyncedAt = action.payload.syncedAt;
        state.syncError = null;
        state.syncOutbox = action.payload.syncOutbox;
        state.cloudMeta = action.payload.cloudMeta;
        state.syncToast = { id: Date.now(), kind: "retry-success" };
      })
      .addCase(retryCloudSync.rejected, (state, action) => {
        if (!state.isAuthenticated || state.syncMode !== "remote-cloud") {
          return;
        }

        state.syncStatus = "error";
        state.syncError =
          action.payload ?? "Cloud sync could not save the latest app data.";
      })
      .addCase(flushSyncOutbox.pending, (state) => {
        if (!state.isAuthenticated || state.syncMode !== "remote-cloud") {
          return;
        }

        state.syncStatus = "syncing";
        state.syncError = null;
      })
      .addCase(flushSyncOutbox.fulfilled, (state, action) => {
        if (!state.isAuthenticated || state.syncMode !== "remote-cloud") {
          return;
        }

        state.syncStatus = "synced";
        state.lastSyncedAt = action.payload.syncedAt;
        state.syncError = null;
        state.syncOutbox = action.payload.syncOutbox;
        state.cloudMeta = action.payload.cloudMeta;
        state.syncToast = { id: Date.now(), kind: "outbox-flushed" };
      })
      .addCase(pullLatestCloudSnapshot.pending, (state) => {
        if (!state.isAuthenticated || state.syncMode !== "remote-cloud") {
          return;
        }

        state.syncStatus = "syncing";
        state.syncError = null;
      })
      .addCase(pullLatestCloudSnapshot.fulfilled, (state, action) => {
        if (!state.isAuthenticated || state.syncMode !== "remote-cloud") {
          return;
        }

        state.syncStatus = "synced";
        state.lastSyncedAt = action.payload.syncedAt;
        state.syncError = null;
        state.syncOutbox = action.payload.syncOutbox;
        state.cloudMeta = action.payload.cloudMeta;
      })
      .addCase(pullLatestCloudSnapshot.rejected, (state, action) => {
        if (!state.isAuthenticated || state.syncMode !== "remote-cloud") {
          return;
        }

        state.syncStatus = "error";
        state.syncError = action.payload ?? "Could not pull the latest cloud snapshot.";
      })
      .addCase(flushSyncOutbox.rejected, (state, action) => {
        if (!state.isAuthenticated || state.syncMode !== "remote-cloud") {
          return;
        }

        state.syncStatus = "error";
        state.syncError =
          action.payload ?? getSyncError(state.syncOutbox);
      });
  },
});

export const {
  logout,
  setUser,
  setCredentials,
  markSyncStarted,
  markSyncSuccess,
  markSyncError,
  hydrateSyncOutbox,
  setCloudMeta,
  clearSyncToast,
} = authSlice.actions;
export const selectAuth = (state: AuthRootState) => state.auth;

export default authSlice.reducer;
