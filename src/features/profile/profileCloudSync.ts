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
import {
  syncRemoteProfileState,
  syncRemoteProfileWithUser,
} from "@shared/api/auth";
import { clearSyncOutbox } from "@shared/lib/syncOutbox";
import type { User } from "@domain/user/types";
import profileReducer, { replaceProfileState, type ProfileState } from "./profileSlice";

type ProfileSyncAction =
  | ReturnType<typeof hydrateSyncOutbox>
  | ReturnType<typeof markSyncError>
  | ReturnType<typeof markSyncStarted>
  | ReturnType<typeof markSyncSuccess>
  | ReturnType<typeof setCloudMeta>
  | AnyAction;

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
    if (isCloudStateConflict(result)) {
      await recoverLatestCloudSnapshotAfterConflict(dispatch);
      throw new Error(
        "Cloud data changed on another device. The latest cloud version has been loaded; please apply your profile change again."
      );
    }

    const message = getProfileSyncErrorMessage(result);
    dispatch(markSyncError(message));
    throw new Error(message);
  }

  dispatch(hydrateSyncOutbox(clearSyncOutbox()));
  dispatch(setCloudMeta(result.meta ?? null));
  dispatch(markSyncSuccess(result.meta?.updatedAt ?? confirmedAt));

  return result;
};

export const saveProfileAndUserToCloud = async (
  dispatch: ProfileSyncDispatch,
  user: User,
  profile: ProfileState,
  confirmedAt = new Date().toISOString()
) => {
  dispatch(markSyncStarted());
  const result = await syncRemoteProfileWithUser(user, profile);

  if (!result.ok || !result.user) {
    if (isCloudStateConflict(result)) {
      await recoverLatestCloudSnapshotAfterConflict(dispatch);
      throw new Error(
        "Cloud data changed on another device. The latest cloud version has been loaded; please apply your profile change again."
      );
    }

    const message = getProfileSyncErrorMessage(result);
    dispatch(markSyncError(message));
    throw new Error(message);
  }

  dispatch(hydrateSyncOutbox(clearSyncOutbox()));
  dispatch(setCloudMeta(result.meta ?? null));
  dispatch(markSyncSuccess(result.meta?.updatedAt ?? confirmedAt));

  return result.user;
};

export const buildProfileStateAfterAction = (
  profile: ProfileState,
  action: AnyAction
) => profileReducer(profile, action);

export const applyProfileActionInCloud = async (
  dispatch: ProfileSyncDispatch,
  profile: ProfileState,
  action: AnyAction,
  confirmedAt = new Date().toISOString()
) => {
  const nextProfile = buildProfileStateAfterAction(profile, action);

  await saveProfileStateToCloud(dispatch, nextProfile, confirmedAt);
  dispatch(replaceProfileState(nextProfile));

  return nextProfile;
};
