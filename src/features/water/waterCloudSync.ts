import type { AnyAction } from "@reduxjs/toolkit";
import {
  hydrateSyncOutbox,
  markSyncError,
  markSyncStarted,
  markSyncSuccess,
  setCloudMeta,
} from "@features/auth/authSlice";
import {
  isCloudStateConflict,
  recoverLatestCloudSnapshotAfterConflict,
} from "@features/auth/cloudConflictRecovery";
import { syncRemoteWaterState } from "@shared/api/auth";
import { resolveCloudSyncFailureMessage } from "@shared/lib/cloudSyncErrors";
import { clearSyncOutbox } from "@shared/lib/syncOutbox";
import type { WaterState } from "./waterSlice";

type WaterSyncAction =
  | ReturnType<typeof hydrateSyncOutbox>
  | ReturnType<typeof markSyncError>
  | ReturnType<typeof markSyncStarted>
  | ReturnType<typeof markSyncSuccess>
  | ReturnType<typeof setCloudMeta>
  | AnyAction;

type WaterSyncDispatch = (action: WaterSyncAction) => unknown;

const getWaterSyncErrorMessage = (result: {
  message?: string;
  code?: string;
}) =>
  resolveCloudSyncFailureMessage({
    code: result.code,
    message: result.message,
    conflictMessage:
      "Cloud data changed on another device. Pull the latest cloud version before saving water again.",
    fallbackMessage: "Cloud sync could not save the latest water data.",
  });

export const saveWaterStateToCloud = async (
  dispatch: WaterSyncDispatch,
  water: WaterState,
  confirmedAt = new Date().toISOString()
) => {
  dispatch(markSyncStarted());
  const result = await syncRemoteWaterState(water);

  if (!result.ok) {
    if (isCloudStateConflict(result)) {
      await recoverLatestCloudSnapshotAfterConflict(dispatch);
      throw new Error(
        "Cloud data changed on another device. The latest cloud version has been loaded; please log water again."
      );
    }

    const message = getWaterSyncErrorMessage(result);
    dispatch(markSyncError(message));
    throw new Error(message);
  }

  dispatch(hydrateSyncOutbox(clearSyncOutbox()));
  dispatch(setCloudMeta(result.meta ?? null));
  dispatch(markSyncSuccess(result.meta?.updatedAt ?? confirmedAt));

  return result;
};
