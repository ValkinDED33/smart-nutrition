import {
  hydrateSyncOutbox,
  markSyncError,
  markSyncStarted,
  markSyncSuccess,
  setCloudMeta,
} from "@features/auth/authSlice";
import { syncRemoteProfileState } from "@shared/api/auth";
import { clearSyncOutbox } from "@shared/lib/syncOutbox";
import type { ProfileState } from "./profileSlice";

type ProfileSyncAction =
  | ReturnType<typeof hydrateSyncOutbox>
  | ReturnType<typeof markSyncError>
  | ReturnType<typeof markSyncStarted>
  | ReturnType<typeof markSyncSuccess>
  | ReturnType<typeof setCloudMeta>;

type ProfileSyncDispatch = (action: ProfileSyncAction) => unknown;

const getProfileSyncErrorMessage = (result: {
  message?: string;
  code?: string;
}) =>
  result.code === "STATE_CONFLICT"
    ? "Cloud data changed on another device. Pull the latest cloud version before saving again."
    : result.message ?? "Cloud sync could not save the latest profile data.";

export const saveProfileStateToCloud = async (
  dispatch: ProfileSyncDispatch,
  profile: ProfileState,
  confirmedAt = new Date().toISOString()
) => {
  dispatch(markSyncStarted());
  const result = await syncRemoteProfileState(profile);

  if (!result.ok) {
    const message = getProfileSyncErrorMessage(result);
    dispatch(markSyncError(message));
    throw new Error(message);
  }

  dispatch(hydrateSyncOutbox(clearSyncOutbox()));
  dispatch(setCloudMeta(result.meta ?? null));
  dispatch(markSyncSuccess(result.meta?.updatedAt ?? confirmedAt));

  return result;
};
