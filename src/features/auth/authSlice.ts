import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import type { AppSnapshotMeta } from "../../shared/types/appSnapshot";
import type { User } from "../../shared/types/user";
import {
  AuthApiError,
  getAuthRuntimeInfo,
  getRemoteBackendAvailability,
  pullRemoteAppSnapshot,
  restoreSession,
  syncRemoteCommunityState,
  syncRemoteFridgeState,
  type RemoteSyncResult,
  syncRemoteMealState,
  syncRemoteProfileState,
  syncRemoteWaterState,
} from "../../shared/api/auth";
import { buildAppSnapshot, getSnapshotMetaFromSnapshot } from "../../shared/lib/appSnapshot";
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
import { replaceCommunityState } from "../community/communitySlice";
import { replaceFridgeState } from "../fridge/fridgeSlice";
import { replaceProfileState } from "../profile/profileSlice";
import { replaceMealState } from "../meal/mealSlice";
import { replaceWaterState } from "../water/waterSlice";

export type SyncMode = "local-browser" | "remote-cloud";
export type SyncStatus = "local-only" | "syncing" | "synced" | "error";

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

const getQueuedSyncMessage = (pendingChanges: number) =>
  pendingChanges <= 1
    ? "1 local change is queued and waiting for cloud sync."
    : `${pendingChanges} local changes are queued and waiting for cloud sync.`;

const getSyncStatusForMode = (
  mode: SyncMode,
  syncOutbox: SyncOutboxMeta
): SyncStatus =>
  mode === "remote-cloud"
    ? syncOutbox.pendingChanges > 0
      ? "error"
      : "synced"
    : "local-only";

const getSyncErrorForMode = (
  mode: SyncMode,
  syncOutbox: SyncOutboxMeta
) =>
  mode === "remote-cloud" && syncOutbox.pendingChanges > 0
    ? syncOutbox.lastError ?? getQueuedSyncMessage(syncOutbox.pendingChanges)
    : null;

const getCloudMetaForMode = (mode: SyncMode, snapshotMeta: AppSnapshotMeta | null) =>
  mode === "remote-cloud" ? snapshotMeta : null;

const getSyncErrorMessage = (result: RemoteSyncResult) =>
  result.code === "STATE_CONFLICT"
    ? "Cloud data changed on another device. Use the latest cloud version before retrying."
    : result.message ?? "Cloud sync could not save the latest app data.";

const cacheCurrentRemoteSnapshot = (
  state: RootState,
  meta: AppSnapshotMeta | null | undefined
) => {
    const snapshot = buildAppSnapshot({
      profile: state.profile,
      meal: state.meal,
      water: state.water,
      fridge: state.fridge,
      community: state.community,
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
  syncMode: "local-browser",
  syncStatus: "local-only",
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
  { rejectValue: string | null }
>("auth/initialize", async (_, { dispatch, rejectWithValue }) => {
  try {
    const data = await restoreSession();
    const syncOutbox = getSyncOutboxMeta();

    if (!data) {
      return rejectWithValue(null);
    }

    if (data.snapshot && syncOutbox.pendingChanges === 0) {
      dispatch(replaceProfileState(data.snapshot.profile));
      dispatch(replaceMealState(data.snapshot.meal));
      dispatch(replaceWaterState(data.snapshot.water));
      dispatch(replaceFridgeState(data.snapshot.fridge));
      dispatch(replaceCommunityState(data.snapshot.community));
    }

    const cloudMeta = getSnapshotMetaFromSnapshot(data.snapshot) ?? readCachedRemoteMeta({ allowStale: true });

    if (data.snapshot) {
      writeCachedRemoteSnapshot(data.snapshot);
    }

    return {
      user: data.user,
      syncMode: getAuthRuntimeInfo().mode,
      syncOutbox,
      cloudMeta,
    };
  } catch (error) {
    const errorCode =
      error instanceof AuthApiError && error.code === "INVALID_CREDENTIALS"
        ? "SESSION_EXPIRED"
        : null;

    return rejectWithValue(errorCode);
  }
});

const pushCurrentStateToCloud = async (state: RootState) => {
  const [profileSynced, mealSynced, waterSynced, fridgeSynced, communitySynced] = await Promise.all([
    syncRemoteProfileState(state.profile),
    syncRemoteMealState(state.meal),
    syncRemoteWaterState(state.water),
    syncRemoteFridgeState(state.fridge),
    syncRemoteCommunityState(state.community),
  ]);

  if (
    profileSynced.ok &&
    mealSynced.ok &&
    waterSynced.ok &&
    fridgeSynced.ok &&
    communitySynced.ok
  ) {
    return {
      ok: true,
      meta:
        communitySynced.meta ??
        fridgeSynced.meta ??
        waterSynced.meta ??
        mealSynced.meta ??
        profileSynced.meta ??
        null,
    } satisfies RemoteSyncResult;
  }

  if (!profileSynced.ok) {
    return profileSynced;
  }

  if (!mealSynced.ok) {
    return mealSynced;
  }

  if (!waterSynced.ok) {
    return waterSynced;
  }

  if (!fridgeSynced.ok) {
    return fridgeSynced;
  }

  return communitySynced;
};

export const retryCloudSync = createAsyncThunk<
  { syncedAt: string; syncOutbox: SyncOutboxMeta; cloudMeta: AppSnapshotMeta | null },
  void,
  { state: RootState; rejectValue: string }
>("auth/retryCloudSync", async (_, { dispatch, getState, rejectWithValue }) => {
  if (getAuthRuntimeInfo().mode !== "remote-cloud") {
    return rejectWithValue("Cloud sync is not enabled for this account.");
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
});

export const flushSyncOutbox = createAsyncThunk<
  { syncedAt: string; syncOutbox: SyncOutboxMeta; cloudMeta: AppSnapshotMeta | null },
  void,
  { state: RootState; rejectValue: string }
>(
  "auth/flushSyncOutbox",
  async (_, { dispatch, getState, rejectWithValue }) => {
    if (getAuthRuntimeInfo().mode !== "remote-cloud") {
      return rejectWithValue("Cloud sync is not enabled for this account.");
    }

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
      const state = getState() as RootState;

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
  { state: RootState; rejectValue: string }
>(
  "auth/pullLatestCloudSnapshot",
  async (payload, { dispatch, rejectWithValue }) => {
    if (getAuthRuntimeInfo().mode !== "remote-cloud") {
      return rejectWithValue("Cloud sync is not enabled for this account.");
    }

    const snapshot = await pullRemoteAppSnapshot({ force: true });

    if (!snapshot) {
      return rejectWithValue("Could not pull the latest cloud snapshot.");
    }

    dispatch(replaceProfileState(snapshot.profile));
    dispatch(replaceMealState(snapshot.meal));
    dispatch(replaceWaterState(snapshot.water));
    dispatch(replaceFridgeState(snapshot.fridge));
    dispatch(replaceCommunityState(snapshot.community));
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
      const state = getState() as RootState;

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
      state.syncMode = "local-browser";
      state.syncStatus = "local-only";
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
      state.error = null;
      state.syncMode = action.payload.syncMode;
      state.syncOutbox = action.payload.syncOutbox;
      state.syncStatus = getSyncStatusForMode(
        action.payload.syncMode,
        action.payload.syncOutbox
      );
      state.lastSyncedAt =
        action.payload.syncMode === "remote-cloud" &&
        action.payload.syncOutbox.pendingChanges === 0
          ? new Date().toISOString()
          : null;
      state.syncError = getSyncErrorForMode(
        action.payload.syncMode,
        action.payload.syncOutbox
      );
      state.cloudMeta = getCloudMetaForMode(
        action.payload.syncMode,
        action.payload.cloudMeta ?? null
      );
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
        state.syncError = getSyncErrorForMode(state.syncMode, action.payload);
        return;
      }

      if (state.syncStatus !== "syncing") {
        state.syncStatus = "synced";
      }

      state.syncError = null;
    },
    setCloudMeta(state, action: PayloadAction<AppSnapshotMeta | null>) {
      state.cloudMeta =
        state.syncMode === "remote-cloud" ? action.payload : null;
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
        state.syncStatus = getSyncStatusForMode(
          action.payload.syncMode,
          action.payload.syncOutbox
        );
        state.lastSyncedAt =
          action.payload.syncMode === "remote-cloud" &&
          action.payload.syncOutbox.pendingChanges === 0
            ? new Date().toISOString()
            : null;
        state.syncError = getSyncErrorForMode(
          action.payload.syncMode,
          action.payload.syncOutbox
        );
        state.cloudMeta = getCloudMetaForMode(
          action.payload.syncMode,
          action.payload.cloudMeta
        );
        state.syncToast = null;
      })
      .addCase(initializeAuth.rejected, (state) => {
        const syncMode = getAuthRuntimeInfo().mode;
        const syncOutbox = getSyncOutboxMeta();

        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.isInitialized = true;
        state.error = null;
        state.syncMode = syncMode;
        state.syncStatus = getSyncStatusForMode(syncMode, syncOutbox);
        state.lastSyncedAt = null;
        state.syncError = getSyncErrorForMode(syncMode, syncOutbox);
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
          action.payload ?? getSyncErrorForMode(state.syncMode, state.syncOutbox);
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
export const selectAuth = (state: RootState) => state.auth;

export default authSlice.reducer;
