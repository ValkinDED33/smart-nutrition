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
import { resolveCloudSyncFailureMessage } from "@shared/lib/cloudSyncErrors";
import type { User } from "@domain/user/types";
import profileReducer, {
  normalizeProfileState,
  replaceProfileState,
  type ProfileState,
} from "./profileSlice";

type ProfileSyncAction =
  | ReturnType<typeof hydrateSyncOutbox>
  | ReturnType<typeof markSyncError>
  | ReturnType<typeof markSyncStarted>
  | ReturnType<typeof markSyncSuccess>
  | ReturnType<typeof setCloudMeta>
  | AnyAction;

type ProfileSyncDispatch = (action: ProfileSyncAction) => unknown;

type ProfileConflictRebase = (freshProfile: ProfileState) => ProfileState;

const PROFILE_CONFLICT_RETRY_MESSAGE =
  "Cloud data changed on another device. The latest cloud version has been loaded; please apply your profile change again.";

const getProfileSyncErrorMessage = (result: {
  message?: string;
  code?: string;
}) =>
  resolveCloudSyncFailureMessage({
    code: result.code,
    message: result.message,
    conflictMessage:
      "Cloud data changed on another device. Pull the latest cloud version before saving again.",
    fallbackMessage: "Cloud sync could not save the latest profile data.",
  });

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
      throw new Error(PROFILE_CONFLICT_RETRY_MESSAGE);
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
      throw new Error(PROFILE_CONFLICT_RETRY_MESSAGE);
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

export const saveProfileAndUserToCloudWithConflictRebase = async (
  dispatch: ProfileSyncDispatch,
  user: User,
  profile: ProfileState,
  rebaseProfile: ProfileConflictRebase,
  confirmedAt = new Date().toISOString()
) => {
  dispatch(markSyncStarted());
  const result = await syncRemoteProfileWithUser(user, profile);

  if (!result.ok || !result.user) {
    if (!isCloudStateConflict(result)) {
      const message = getProfileSyncErrorMessage(result);
      dispatch(markSyncError(message));
      throw new Error(message);
    }

    const snapshot = await recoverLatestCloudSnapshotAfterConflict(dispatch);
    const freshProfile = normalizeProfileState(snapshot.profile);
    const rebasedProfile = rebaseProfile(freshProfile);
    const rebasedResult = await syncRemoteProfileWithUser(user, rebasedProfile);

    if (!rebasedResult.ok || !rebasedResult.user) {
      if (isCloudStateConflict(rebasedResult)) {
        await recoverLatestCloudSnapshotAfterConflict(dispatch);
        throw new Error(PROFILE_CONFLICT_RETRY_MESSAGE);
      }

      const message = getProfileSyncErrorMessage(rebasedResult);
      dispatch(markSyncError(message));
      throw new Error(message);
    }

    dispatch(hydrateSyncOutbox(clearSyncOutbox()));
    dispatch(setCloudMeta(rebasedResult.meta ?? null));
    dispatch(markSyncSuccess(rebasedResult.meta?.updatedAt ?? confirmedAt));

    return { user: rebasedResult.user, profile: rebasedProfile };
  }

  dispatch(hydrateSyncOutbox(clearSyncOutbox()));
  dispatch(setCloudMeta(result.meta ?? null));
  dispatch(markSyncSuccess(result.meta?.updatedAt ?? confirmedAt));

  return { user: result.user, profile };
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
