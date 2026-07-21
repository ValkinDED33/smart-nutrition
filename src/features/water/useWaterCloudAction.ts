import { useCallback, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../app/store";
import { replaceWaterState, type WaterState } from "./waterSlice";
import { saveWaterStateToCloud } from "./waterCloudSync";

const WATER_SAVE_IN_PROGRESS_ERROR = "Cloud water save is already in progress.";
const USER_WATER_SAVE_ERROR =
  "Water could not be saved. Please try again.";
const USER_WATER_SAVE_IN_PROGRESS_ERROR =
  "Water is already being saved. Please wait a moment.";

type WaterSaveOptions = {
  surfaceFailure?: boolean;
};

export const resolveWaterCloudActionErrorMessage = (error: unknown) =>
  error instanceof Error && error.message === WATER_SAVE_IN_PROGRESS_ERROR
    ? USER_WATER_SAVE_IN_PROGRESS_ERROR
    : USER_WATER_SAVE_ERROR;

export const useWaterCloudAction = () => {
  const dispatch = useDispatch<AppDispatch>();
  const failedWaterRef = useRef<WaterState | null>(null);
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRetry, setHasRetry] = useState(false);

  const runWaterStateSave = useCallback(
    async (
      nextWater: WaterState,
      { surfaceFailure = true }: WaterSaveOptions = {}
    ) => {
      if (savingRef.current) {
        const inProgressError = new Error(WATER_SAVE_IN_PROGRESS_ERROR);
        if (surfaceFailure) {
          setError(resolveWaterCloudActionErrorMessage(inProgressError));
        }
        throw inProgressError;
      }

      savingRef.current = true;
      setSaving(true);
      setError(null);
      setHasRetry(false);

      try {
        await saveWaterStateToCloud(dispatch, nextWater);
        dispatch(replaceWaterState(nextWater));
        failedWaterRef.current = null;
        return nextWater;
      } catch (caughtError) {
        if (surfaceFailure) {
          failedWaterRef.current = nextWater;
          setHasRetry(true);
        }
        if (surfaceFailure) {
          setError(resolveWaterCloudActionErrorMessage(caughtError));
        }
        throw caughtError;
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [dispatch]
  );

  const retryLastWaterSave = useCallback(async () => {
    const pendingWater = failedWaterRef.current;

    if (!pendingWater) {
      return null;
    }

    return runWaterStateSave(pendingWater);
  }, [runWaterStateSave]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    saving,
    error,
    hasError: error !== null,
    hasRetry,
    runWaterStateSave,
    retryLastWaterSave,
    clearError,
  };
};
