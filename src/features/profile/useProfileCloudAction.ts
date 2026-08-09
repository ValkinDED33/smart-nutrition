import { useCallback, useState } from "react";
import type { AnyAction } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@app/store";
import {
  applyProfileActionInCloud,
  rebaseProfileStateChange,
  saveProfileAndUserToCloudWithConflictRebase,
  saveProfileStateToCloudWithConflictRebase,
} from "./profileCloudSync";
import type { ProfileCloudActionCopy } from "./profileCloudActionCopy";
import { replaceProfileState, type ProfileState } from "./profileSlice";
import { setUser } from "../auth/authSlice";

type AuthUser = NonNullable<RootState["auth"]["user"]>;

const PROFILE_SAVE_IN_PROGRESS_ERROR = "Cloud profile save is already in progress.";
const SAFE_PROFILE_SYNC_ERROR_PATTERN =
  /^Cloud (?:data changed|sync could not save)[A-Za-z0-9 .,';-]+(?: \((?:[A-Z_]+|HTTP \d{3}|stage:[a-z0-9-]+|reason:[A-Za-z0-9_.$-]+)(?: · (?:[A-Z_]+|HTTP \d{3}|stage:[a-z0-9-]+|reason:[A-Za-z0-9_.$-]+))*\))?$/;

const getSafeProfileSyncErrorMessage = (error: unknown) => {
  if (!(error instanceof Error)) {
    return null;
  }

  const message = error.message.trim();

  return SAFE_PROFILE_SYNC_ERROR_PATTERN.test(message) ? message : null;
};

export const resolveProfileCloudActionErrorMessage = (
  error: unknown,
  copy: ProfileCloudActionCopy
) => {
  if (error instanceof Error && error.message === PROFILE_SAVE_IN_PROGRESS_ERROR) {
    return copy.saveInProgress;
  }

  return getSafeProfileSyncErrorMessage(error) ?? copy.saveFailed;
};

export const useProfileCloudAction = (copy: ProfileCloudActionCopy) => {
  const dispatch = useDispatch<AppDispatch>();
  const profile = useSelector((state: RootState) => state.profile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runProfileAction = useCallback(
    async (action: AnyAction) => {
      if (saving) {
        return null;
      }

      setSaving(true);
      setError(null);

      try {
        return await applyProfileActionInCloud(dispatch, profile, action);
      } catch (caughtError) {
        setError(resolveProfileCloudActionErrorMessage(caughtError, copy));
        throw caughtError;
      } finally {
        setSaving(false);
      }
    },
    [copy, dispatch, profile, saving]
  );

  const runProfileStateSave = useCallback(
    async (nextProfile: ProfileState, confirmedAt?: string) => {
      if (saving) {
        return null;
      }

      setSaving(true);
      setError(null);

      try {
        const saved = await saveProfileStateToCloudWithConflictRebase(
          dispatch,
          profile,
          nextProfile,
          undefined,
          confirmedAt
        );
        dispatch(replaceProfileState(saved.profile));
        return saved.profile;
      } catch (caughtError) {
        setError(resolveProfileCloudActionErrorMessage(caughtError, copy));
        throw caughtError;
      } finally {
        setSaving(false);
      }
    },
    [copy, dispatch, profile, saving]
  );

  const runProfileAndUserSave = useCallback(
    async (
      nextUser: AuthUser,
      nextProfile: ProfileState,
      confirmedAt?: string,
      rebaseProfile?: (freshProfile: ProfileState) => ProfileState
    ) => {
      if (saving) {
        const inProgressError = new Error(PROFILE_SAVE_IN_PROGRESS_ERROR);
        setError(resolveProfileCloudActionErrorMessage(inProgressError, copy));
        throw inProgressError;
      }

      setSaving(true);
      setError(null);

      try {
        const saved = rebaseProfile
          ? await saveProfileAndUserToCloudWithConflictRebase(
              dispatch,
              nextUser,
              nextProfile,
              rebaseProfile,
              confirmedAt
            )
          : await saveProfileAndUserToCloudWithConflictRebase(
              dispatch,
              nextUser,
              nextProfile,
              (freshProfile) =>
                rebaseProfileStateChange(profile, nextProfile, freshProfile),
              confirmedAt
            );

        dispatch(setUser(saved.user));
        dispatch(replaceProfileState(saved.profile));
        return saved;
      } catch (caughtError) {
        setError(resolveProfileCloudActionErrorMessage(caughtError, copy));
        throw caughtError;
      } finally {
        setSaving(false);
      }
    },
    [copy, dispatch, profile, saving]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    saving,
    error,
    hasError: error !== null,
    runProfileAction,
    runProfileStateSave,
    runProfileAndUserSave,
    clearError,
  };
};
