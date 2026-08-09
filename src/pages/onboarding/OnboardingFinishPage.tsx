import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import {
  hydrateSyncOutbox,
  markSyncError,
} from "../../features/auth/authSlice";
import profileReducer from "../../features/profile/profileSlice";
import {
  applyProfileTargets,
  setAssistantCustomization,
  setProfileLanguage,
  updatePersonalDetails,
  updateWomenHealth,
} from "../../features/profile/profileSlice";
import { getProfileCloudActionCopy } from "../../features/profile/profileCloudActionCopy";
import {
  resolveProfileCloudActionErrorMessage,
  useProfileCloudAction,
} from "../../features/profile/useProfileCloudAction";
import { useLanguage } from "../../shared/language";
import { calculateProfileTargets } from "@domain/profile/profileTargets";
import { trackRuntimeEvent } from "@integration/runtime/analyticsEvent";
import type { AssistantCustomization } from "@domain/profile/types";
import {
  createCompanionRewardAnalyticsPayload,
} from "@features/companion";
import { applyCompanionRewardInCloud } from "@features/companion/companionCloudSync";
import {
  clearPreAuthOnboardingDraft,
  writePreAuthOnboardingDraft,
} from "../../features/onboarding/model/onboardingDraft";
import { enqueueSyncOutbox } from "../../shared/lib/syncOutbox";
import {
  cardSx,
  personalityValues,
  shellSx,
  stepPaths,
  type OnboardingStepProps,
} from "./types";

export const OnboardingFinishPage = ({ state }: OnboardingStepProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector((rootState: RootState) => rootState.auth.user);
  const profile = useSelector((rootState: RootState) => rootState.profile);
  const companion = useSelector((rootState: RootState) => rootState.companion);
  const { appLanguage, completeOnboarding, t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const profileActionCopy = getProfileCloudActionCopy(appLanguage);
  const profileAction = useProfileCloudAction(profileActionCopy);
  const canContinuePersonalization = !state.personalizationCompleted;
  const recoveryBackPath = state.personalizationCompleted
    ? stepPaths.motivation
    : stepPaths.goal;

  const preserveDraft = () => {
    writePreAuthOnboardingDraft({
      language: appLanguage,
      assistantName: state.assistantName.trim(),
      assistantAvatar: state.assistantAvatar,
      assistantPersonality:
        state.personality === "strict"
          ? "focused"
          : state.personality === "energetic"
            ? "playful"
            : state.personality === "supportive"
              ? "gentle"
              : state.personality,
      userName: state.name.trim(),
      age: state.age,
      gender: state.gender,
      womenHealthMode: state.gender === "female" ? state.womenHealthMode : "none",
      pregnancyWeek:
        state.gender === "female" && state.womenHealthMode === "pregnant"
          ? state.pregnancyWeek
          : null,
      pregnancyDay:
        state.gender === "female" &&
        state.womenHealthMode === "pregnant" &&
        state.pregnancyWeek !== null
          ? state.pregnancyDay ?? 0
          : null,
      dueDate:
        state.gender === "female" && state.womenHealthMode === "pregnant"
          ? state.dueDate
          : "",
      lastPeriodStartDate:
        state.gender === "female" &&
        (state.womenHealthMode === "pregnant" ||
          state.womenHealthMode === "trying_to_conceive")
          ? state.lastPeriodStartDate
          : "",
      doctorConfirmed:
        state.gender === "female" &&
        (state.womenHealthMode === "pregnant" ||
          state.womenHealthMode === "trying_to_conceive")
          ? state.doctorConfirmed
          : false,
      womenHealthNotes: state.gender === "female" ? state.womenHealthNotes : "",
      motherEyeColor: state.gender === "female" ? state.motherEyeColor : "unknown",
      partnerEyeColor:
        state.gender === "female" ? state.partnerEyeColor : "unknown",
      motherZodiac: state.gender === "female" ? state.motherZodiac : "unknown",
      fatherZodiac: state.gender === "female" ? state.fatherZodiac : "unknown",
      motherChineseZodiac:
        state.gender === "female" ? state.motherChineseZodiac : "unknown",
      fatherChineseZodiac:
        state.gender === "female" ? state.fatherChineseZodiac : "unknown",
      height: state.height,
      weight: state.weight,
      goal: state.goal,
      selectedGoals: state.selectedGoals,
      primaryGoalNote: state.primaryGoalNote,
      mainFriction: state.mainFriction,
      mainFrictions: state.mainFrictions,
      motivationStyle: state.motivationStyle,
      motivationStyles: state.motivationStyles,
      supportNote: state.supportNote,
      personalizationCompleted: state.personalizationCompleted,
    });
  };

  const continuePersonalization = () => {
    setSaveError(null);
    preserveDraft();
    navigate(stepPaths.friction);
  };

  const saveOnboarding = async (nextPath: "/dashboard") => {
    if (!user) {
      navigate("/register", { replace: true });
      return;
    }

    if (saving) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    const trimmedName = state.name.trim();
    const nextUser = {
      ...user,
      name: trimmedName,
      age: state.age,
      gender: state.gender,
      height: state.height,
      weight: state.weight,
      goal: state.goal,
    };
    const { maintenanceCalories, targetCalories } = calculateProfileTargets({
      age: state.age,
      weight: state.weight,
      height: state.height,
      gender: state.gender,
      activity: user.activity,
      goal: state.goal,
    });
    const personality = personalityValues[state.personality];
    const assistantTone =
      state.personality === "strict"
        ? "focused"
        : state.personality === "energetic"
        ? "playful"
        : state.personality;
    const completedAt = new Date().toISOString();
    const assistantCustomization = {
      name: state.assistantName.trim(),
      assistantName: state.assistantName.trim(),
      companionKind: state.assistantAvatar,
      assistantAvatar: state.assistantAvatar,
      role:
        state.personality === "strict" || state.personality === "scientific"
          ? "coach"
          : "assistant",
      tone: assistantTone === "supportive" ? "gentle" : assistantTone,
      assistantPersonality: assistantTone === "supportive" ? "gentle" : assistantTone,
      assistantMood: "happy",
      assistantMemory: {
        goals: [
          state.goal,
          state.primaryGoalNote,
          ...state.selectedGoals,
        ].filter(Boolean),
        preferences: [
          trimmedName ? `prefers being called ${trimmedName}` : "",
          `assistant avatar: ${state.assistantAvatar}`,
          `communication style: ${state.personality}`,
          state.motivationStyles.length > 0
            ? `support styles: ${state.motivationStyles.join(", ")}`
            : "",
        ].filter(Boolean),
        conversationHighlights: state.mainFrictions.map(
          (friction) => `onboarding friction: ${friction}`
        ),
        lastSyncedAt: completedAt,
      },
      humorEnabled: personality.humor >= 0.4,
      proactiveHintsEnabled: personality.motivation >= 0.7,
      onboarding: {
        preferredName: trimmedName,
        primaryGoalNote: state.primaryGoalNote,
        goalSelections: state.selectedGoals,
        mainFriction: state.mainFriction,
        mainFrictions: state.mainFrictions,
        motivationStyle: state.motivationStyle,
        motivationStyles: state.motivationStyles,
        supportNote: state.supportNote,
        completedAt,
      },
    } satisfies Partial<AssistantCustomization>;
    const profileTargets = {
      goal: state.goal,
      weight: state.weight,
      maintenanceCalories,
      targetCalories,
      targetWeight: null,
      dietStyle: "balanced" as const,
      allergies: [],
      excludedIngredients: [],
      adaptiveMode: "automatic" as const,
    };
    const womenHealthProfile =
      state.gender === "female"
        ? {
            mode: state.womenHealthMode,
            pregnancyWeek:
              state.womenHealthMode === "pregnant" ? state.pregnancyWeek : null,
            pregnancyDay:
              state.womenHealthMode === "pregnant" && state.pregnancyWeek !== null
                ? state.pregnancyDay ?? 0
                : null,
            dueDate:
              state.womenHealthMode === "pregnant" && state.dueDate
                ? new Date(state.dueDate).toISOString()
                : null,
            lastPeriodStartDate:
              (state.womenHealthMode === "pregnant" ||
                state.womenHealthMode === "trying_to_conceive") &&
              state.lastPeriodStartDate
                ? new Date(state.lastPeriodStartDate).toISOString()
                : null,
            doctorConfirmed:
              state.womenHealthMode === "pregnant" ||
              state.womenHealthMode === "trying_to_conceive"
                ? state.doctorConfirmed
                : false,
            notes: state.womenHealthNotes,
            partnerEyeColor: state.partnerEyeColor,
            motherZodiac: state.motherZodiac,
            fatherZodiac: state.fatherZodiac,
            motherChineseZodiac: state.motherChineseZodiac,
            fatherChineseZodiac: state.fatherChineseZodiac,
          }
        : {
            mode: "none" as const,
            pregnancyWeek: null,
            pregnancyDay: null,
            dueDate: null,
            lastPeriodStartDate: null,
            doctorConfirmed: false,
            notes: "",
            partnerEyeColor: "unknown" as const,
            motherZodiac: "unknown" as const,
            fatherZodiac: "unknown" as const,
            motherChineseZodiac: "unknown" as const,
            fatherChineseZodiac: "unknown" as const,
          };
    const applyOnboardingProfilePatch = (baseProfile: typeof profile) =>
      profileReducer(
        profileReducer(
          profileReducer(
            profileReducer(
              profileReducer(baseProfile, setProfileLanguage(appLanguage)),
              setAssistantCustomization(assistantCustomization)
            ),
            updatePersonalDetails({
              eyeColor:
                state.gender === "female"
                  ? state.motherEyeColor
                  : baseProfile.personalDetails.eyeColor,
            })
          ),
          applyProfileTargets(profileTargets)
        ),
        updateWomenHealth(womenHealthProfile)
      );
    const nextProfile = applyOnboardingProfilePatch(profile);

    try {
      await profileAction.runProfileAndUserSave(
        nextUser,
        nextProfile,
        completedAt,
        applyOnboardingProfilePatch
      );
      clearPreAuthOnboardingDraft();
      completeOnboarding();
      let companionRewardPayload = {};

      try {
        await applyCompanionRewardInCloud(
          dispatch,
          { companion },
          "onboarding_completed"
        );
        companionRewardPayload =
          createCompanionRewardAnalyticsPayload("onboarding_completed");
      } catch {
        // Profile/onboarding were saved successfully. The sync slice carries
        // the companion reward failure, so we do not block entry into the app.
      }

      trackRuntimeEvent("onboarding_completed", {
        nextPath,
        goal: state.goal,
        selectedGoals: state.selectedGoals.join(","),
        mainFriction: state.mainFriction,
        mainFrictions: state.mainFrictions.join(","),
        motivationStyle: state.motivationStyle,
        motivationStyles: state.motivationStyles.join(","),
        womenHealthMode: state.gender === "female" ? state.womenHealthMode : "none",
        doctorConfirmed: state.gender === "female" && state.doctorConfirmed,
        assistantAvatar: state.assistantAvatar,
        assistantPersonality: state.personality,
        hasPrimaryGoalNote: Boolean(state.primaryGoalNote.trim()),
        hasSupportNote: Boolean(state.supportNote.trim()),
        ...companionRewardPayload,
      });
      navigate(nextPath, { replace: true });
    } catch (caughtError) {
      preserveDraft();
      const message = resolveProfileCloudActionErrorMessage(
        caughtError,
        {
          ...profileActionCopy,
          saveFailed: t("error.genericProfile"),
        }
      );
      dispatch(hydrateSyncOutbox(enqueueSyncOutbox(message)));
      dispatch(markSyncError(message));
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={shellSx}>
      <Paper elevation={0} sx={cardSx}>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
              {t("onboarding.finishTitle")}
            </Typography>
            <Typography color="text.secondary">{t("onboarding.finishBody")}</Typography>
            <Typography color="text.secondary">{t("assistant.memoryReady")}</Typography>
          </Stack>
          {saveError && (
            <Alert
              severity="error"
              sx={{ borderRadius: 1 }}
              data-onboarding-save-recovery="true"
            >
              <Stack spacing={1.2}>
                <Typography sx={{ fontWeight: 800 }}>{saveError}</Typography>
                <Typography variant="body2">
                  {t("onboarding.saveRecoveryBody")}
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => void saveOnboarding("/dashboard")}
                    disabled={saving}
                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}
                  >
                    {saving ? t("auth.resetSaving") : t("onboarding.retrySave")}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setSaveError(null);
                      preserveDraft();
                      navigate(recoveryBackPath);
                    }}
                    disabled={saving}
                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}
                  >
                    {t("onboarding.backToAnswers")}
                  </Button>
                </Stack>
              </Stack>
            </Alert>
          )}

          <Stack spacing={1.2}>
            <Button
              variant="contained"
              size="large"
              onClick={() => void saveOnboarding("/dashboard")}
              disabled={saving}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}
            >
              {saving ? t("auth.resetSaving") : t("onboarding.enterApp")}
            </Button>
            {canContinuePersonalization && (
              <Button
                variant="outlined"
                size="large"
                onClick={continuePersonalization}
                disabled={saving}
                data-onboarding-continue-personalization="true"
                sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}
              >
                {t("onboarding.continueSetup")}
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};
