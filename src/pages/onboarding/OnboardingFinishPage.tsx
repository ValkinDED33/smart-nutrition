import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import {
  hydrateSyncOutbox,
  markSyncError,
  setUser,
} from "../../features/auth/authSlice";
import profileReducer from "../../features/profile/profileSlice";
import {
  applyProfileTargets,
  replaceProfileState,
  setAssistantCustomization,
  setProfileLanguage,
  updateWomenHealth,
} from "../../features/profile/profileSlice";
import { saveProfileAndUserToCloud } from "../../features/profile/profileCloudSync";
import { useLanguage } from "../../shared/language";
import { calculateProfileTargets } from "@domain/profile/profileTargets";
import { trackRuntimeEvent } from "@integration/runtime/analyticsEvent";
import type { AssistantCustomization } from "@domain/profile/types";
import {
  createCompanionRewardAnalyticsPayload,
} from "@features/companion";
import { applyCompanionRewardInCloud } from "@features/companion/companionCloudSync";
import { clearPreAuthOnboardingDraft } from "../../features/onboarding/model/onboardingDraft";
import { enqueueSyncOutbox } from "../../shared/lib/syncOutbox";
import {
  cardSx,
  personalityValues,
  shellSx,
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

  const saveOnboarding = async (nextPath: "/dashboard" | "/profile") => {
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
          }
        : {
            mode: "none" as const,
            pregnancyWeek: null,
            dueDate: null,
            lastPeriodStartDate: null,
            doctorConfirmed: false,
            notes: "",
          };
    const nextProfile = profileReducer(
      profileReducer(
        profileReducer(
          profileReducer(profile, setProfileLanguage(appLanguage)),
          setAssistantCustomization(assistantCustomization)
        ),
        applyProfileTargets(profileTargets)
      ),
      updateWomenHealth(womenHealthProfile)
    );

    try {
      const updatedUser = await saveProfileAndUserToCloud(
        dispatch,
        nextUser,
        nextProfile,
        completedAt
      );

      dispatch(setUser(updatedUser));
      dispatch(replaceProfileState(nextProfile));
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
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("error.genericProfile");
      dispatch(hydrateSyncOutbox(enqueueSyncOutbox(message)));
      dispatch(markSyncError(message));
      setSaveError(t("error.genericProfile"));
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
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              {saveError}
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
            <Button
              variant="outlined"
              size="large"
              onClick={() => void saveOnboarding("/profile")}
              disabled={saving}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}
            >
              {t("onboarding.continueSetup")}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};
