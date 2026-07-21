import { useCallback, useState } from "react";
import type { AnyAction } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@app/store";
import {
  applyProfileActionInCloud,
  saveProfileAndUserToCloud,
  saveProfileStateToCloud,
} from "./profileCloudSync";
import { replaceProfileState, type ProfileState } from "./profileSlice";
import { setUser } from "../auth/authSlice";

type AuthUser = NonNullable<RootState["auth"]["user"]>;

const PROFILE_SAVE_IN_PROGRESS_ERROR = "Cloud profile save is already in progress.";
const USER_PROFILE_SAVE_ERROR =
  "Profile changes could not be saved. Please try again.";
const USER_PROFILE_SAVE_IN_PROGRESS_ERROR =
  "Profile changes are already being saved. Please wait a moment.";

export const resolveProfileCloudActionErrorMessage = (error: unknown) =>
  error instanceof Error && error.message === PROFILE_SAVE_IN_PROGRESS_ERROR
    ? USER_PROFILE_SAVE_IN_PROGRESS_ERROR
    : USER_PROFILE_SAVE_ERROR;

export const useProfileCloudAction = () => {
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
        setError(resolveProfileCloudActionErrorMessage(caughtError));
        throw caughtError;
      } finally {
        setSaving(false);
      }
    },
    [dispatch, profile, saving]
  );

  const runProfileStateSave = useCallback(
    async (nextProfile: ProfileState) => {
      if (saving) {
        return null;
      }

      setSaving(true);
      setError(null);

      try {
        await saveProfileStateToCloud(dispatch, nextProfile);
        dispatch(replaceProfileState(nextProfile));
        return nextProfile;
      } catch (caughtError) {
        setError(resolveProfileCloudActionErrorMessage(caughtError));
        throw caughtError;
      } finally {
        setSaving(false);
      }
    },
    [dispatch, saving]
  );

  const runProfileAndUserSave = useCallback(
    async (nextUser: AuthUser, nextProfile: ProfileState) => {
      if (saving) {
        const inProgressError = new Error(PROFILE_SAVE_IN_PROGRESS_ERROR);
        setError(resolveProfileCloudActionErrorMessage(inProgressError));
        throw inProgressError;
      }

      setSaving(true);
      setError(null);

      try {
        const savedUser = await saveProfileAndUserToCloud(
          dispatch,
          nextUser,
          nextProfile
        );
        dispatch(setUser(savedUser));
        dispatch(replaceProfileState(nextProfile));
        return { user: savedUser, profile: nextProfile };
      } catch (caughtError) {
        setError(resolveProfileCloudActionErrorMessage(caughtError));
        throw caughtError;
      } finally {
        setSaving(false);
      }
    },
    [dispatch, saving]
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
