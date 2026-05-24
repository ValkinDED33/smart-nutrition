import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import { setUser } from "../../features/auth/authSlice";
import {
  applyProfileTargets,
  setAssistantCustomization,
  setProfileLanguage,
} from "../../features/profile/profileSlice";
import { updateStoredProfile } from "../../shared/api/auth";
import { useLanguage } from "../../shared/language";
import { calculateProfileTargets } from "../../shared/lib/profileTargets";
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
  const { appLanguage, completeOnboarding, t } = useLanguage();

  const saveOnboarding = (nextPath: "/dashboard" | "/profile") => {
    if (!user) {
      navigate("/register", { replace: true });
      return;
    }

    const trimmedName = state.name.trim();
    const nextUser = {
      ...user,
      name: trimmedName,
      age: state.age,
      weight: state.weight,
      goal: state.goal,
    };
    const { maintenanceCalories, targetCalories } = calculateProfileTargets({
      age: state.age,
      weight: state.weight,
      height: user.height,
      gender: user.gender,
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

    dispatch(setUser(nextUser));
    dispatch(setProfileLanguage(appLanguage));
    dispatch(
      setAssistantCustomization({
        name: state.assistantName.trim(),
        role:
          state.personality === "strict" || state.personality === "scientific"
            ? "coach"
            : "assistant",
        tone: assistantTone === "supportive" ? "gentle" : assistantTone,
        humorEnabled: personality.humor >= 0.4,
        proactiveHintsEnabled: personality.motivation >= 0.7,
        onboarding: {
          preferredName: trimmedName,
          primaryGoalNote: state.primaryGoalNote,
          mainFriction: state.mainFriction,
          motivationStyle: state.motivationStyle,
          supportNote: state.supportNote,
          completedAt: new Date().toISOString(),
        },
      })
    );
    dispatch(
      applyProfileTargets({
        goal: state.goal,
        weight: state.weight,
        maintenanceCalories,
        targetCalories,
        targetWeight: null,
        dietStyle: "balanced",
        allergies: [],
        excludedIngredients: [],
        adaptiveMode: "automatic",
      })
    );
    void updateStoredProfile(nextUser).catch(() => undefined);
    completeOnboarding();
    navigate(nextPath, { replace: true });
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

          <Stack spacing={1.2}>
            <Button
              variant="contained"
              size="large"
              onClick={() => saveOnboarding("/dashboard")}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}
            >
              {t("onboarding.enterApp")}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => saveOnboarding("/profile")}
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
