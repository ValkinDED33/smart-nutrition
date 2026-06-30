import {
  hydrateSyncOutbox,
  markSyncError,
  markSyncStarted,
  markSyncSuccess,
  setCloudMeta,
} from "@features/auth/authSlice";
import { syncRemoteWaterState } from "@shared/api/auth";
import { clearSyncOutbox } from "@shared/lib/syncOutbox";
import type { WaterState } from "./waterSlice";

type WaterSyncAction =
  | ReturnType<typeof hydrateSyncOutbox>
  | ReturnType<typeof markSyncError>
  | ReturnType<typeof markSyncStarted>
  | ReturnType<typeof markSyncSuccess>
  | ReturnType<typeof setCloudMeta>;

type WaterSyncDispatch = (action: WaterSyncAction) => unknown;

const getWaterSyncErrorMessage = (result: {
  message?: string;
  code?: string;
}) =>
  result.code === "STATE_CONFLICT"
    ? "Cloud data changed on another device. Pull the latest cloud version before saving water again."
    : result.message ?? "Cloud sync could not save the latest water data.";

export const saveWaterStateToCloud = async (
  dispatch: WaterSyncDispatch,
  water: WaterState,
  confirmedAt = new Date().toISOString()
) => {
  dispatch(markSyncStarted());
  const result = await syncRemoteWaterState(water);

  if (!result.ok) {
    const message = getWaterSyncErrorMessage(result);
    dispatch(markSyncError(message));
    throw new Error(message);
  }

  dispatch(hydrateSyncOutbox(clearSyncOutbox()));
  dispatch(setCloudMeta(result.meta ?? null));
  dispatch(markSyncSuccess(result.meta?.updatedAt ?? confirmedAt));

  return result;
};
