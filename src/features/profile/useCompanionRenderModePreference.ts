import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@app/store";
import type { AssistantCompanionRenderMode } from "@domain/profile/types";
import { useLanguage } from "@shared/language";
import { getProfileCloudActionCopy } from "./profileCloudActionCopy";
import { setAssistantCustomization } from "./profileSlice";
import { useProfileCloudAction } from "./useProfileCloudAction";

export type CompanionRenderModePreference = AssistantCompanionRenderMode;

export const useCompanionRenderModePreference = () => {
  const { appLanguage } = useLanguage();
  const profileActionCopy = getProfileCloudActionCopy(appLanguage);
  const profileAction = useProfileCloudAction(profileActionCopy);
  const profile = useSelector((state: RootState) => state.profile);
  const preferredMode = profile.assistant.preferredCompanionRenderMode;
  const [runtime3dError, setRuntime3dError] = useState(false);
  const value: CompanionRenderModePreference = runtime3dError ? "2d" : preferredMode;

  const changeRenderMode = useCallback(
    async (mode: CompanionRenderModePreference) => {
      if (mode === preferredMode || profileAction.saving) {
        return;
      }

      setRuntime3dError(false);
      profileAction.clearError();
      await profileAction
        .runProfileAction(
          setAssistantCustomization({ preferredCompanionRenderMode: mode })
        )
        .catch(() => undefined);
    },
    [preferredMode, profileAction]
  );

  const mark3dRuntimeError = useCallback(() => {
    setRuntime3dError(true);
  }, []);

  return {
    value,
    preferredMode,
    saving: profileAction.saving,
    saveError: profileAction.hasError,
    runtime3dError,
    hasError: profileAction.hasError || runtime3dError,
    changeRenderMode,
    mark3dRuntimeError,
  };
};
