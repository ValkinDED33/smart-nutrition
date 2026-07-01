import type { AnyAction } from "@reduxjs/toolkit";
import { getSnapshotMetaFromSnapshot } from "@domain/appSnapshot";
import type { RemoteSyncResult } from "@shared/api/auth";
import { pullRemoteAppSnapshot } from "@shared/api/auth";
import {
  clearSyncOutbox,
} from "@shared/lib/syncOutbox";
import {
  writeCachedRemoteSnapshot,
} from "@shared/lib/remoteStateCache";
import {
  hydrateSyncOutbox,
  markSyncError,
  markSyncStarted,
  markSyncSuccess,
  setCloudMeta,
} from "./authSlice";
import { applyRemoteSnapshotToStore } from "./sessionSnapshot";

type CloudConflictDispatch = (action: AnyAction) => unknown;

export const isCloudStateConflict = (
  result: Pick<RemoteSyncResult, "code" | "ok">
) => !result.ok && result.code === "STATE_CONFLICT";

export const recoverLatestCloudSnapshotAfterConflict = async (
  dispatch: CloudConflictDispatch
) => {
  dispatch(markSyncStarted());

  const snapshot = await pullRemoteAppSnapshot({ force: true });

  if (!snapshot) {
    const message = "Cloud data changed on another device, but the latest cloud snapshot could not be loaded.";
    dispatch(markSyncError(message));
    throw new Error(message);
  }

  applyRemoteSnapshotToStore(dispatch, snapshot);
  writeCachedRemoteSnapshot(snapshot);

  const meta = getSnapshotMetaFromSnapshot(snapshot);
  dispatch(hydrateSyncOutbox(clearSyncOutbox()));
  dispatch(setCloudMeta(meta));
  dispatch(markSyncSuccess(meta?.updatedAt ?? new Date().toISOString()));

  return snapshot;
};
