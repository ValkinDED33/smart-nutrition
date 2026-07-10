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

const CLOUD_PROFILE_SAVE_FAILED = "Cloud profile save failed.";

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
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : CLOUD_PROFILE_SAVE_FAILED;
        setError(message);
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
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : CLOUD_PROFILE_SAVE_FAILED;
        setError(message);
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
        const inProgressError = new Error("Cloud profile save is already in progress.");
        setError(inProgressError.message);
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
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Cloud profile save failed.";
        setError(message);
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
