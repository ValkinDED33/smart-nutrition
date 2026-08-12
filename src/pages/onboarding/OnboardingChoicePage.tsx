import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import type { RootState } from "../../app/store";
import profileReducer, {
  setAssistantCustomization,
  setProfileLanguage,
} from "../../features/profile/profileSlice";
import { getProfileCloudActionCopy } from "../../features/profile/profileCloudActionCopy";
import { useProfileCloudAction } from "../../features/profile/useProfileCloudAction";
import { clearPreAuthOnboardingDraft } from "../../features/onboarding/model/onboardingDraft";
import { AssistantAvatar } from "../../shared/components/AssistantAvatar";
import { useLanguage } from "../../shared/language";
import { cardSx, shellSx, stepPaths, type OnboardingStepProps } from "./types";

const choiceCopy = {
  uk: {
    title: "Заповнити анкету зараз?",
    body:
      "Це займе кілька хвилин і допоможе одразу налаштувати калорії, цілі та підказки помічника.",
    companion: "Ваш AI-помічник вже готовий підлаштувати план під ваш ритм.",
    chips: ["Калорії без ручної математики", "Вода і нагадування", "Підказки AI"],
    start: "Так, заповнити зараз",
    later: "Пізніше",
    savingLater: "Зберігаю вибір...",
  },
  pl: {
    title: "Uzupełnić ankietę teraz?",
    body:
      "To zajmie kilka minut i od razu pomoże ustawić kalorie, cele oraz podpowiedzi asystenta.",
    companion: "Twój asystent AI jest gotowy dopasować plan do Twojego rytmu.",
    chips: ["Kalorie bez ręcznej matematyki", "Woda i przypomnienia", "Wskazówki AI"],
    start: "Tak, wypełnij teraz",
    later: "Później",
    savingLater: "Zapisuję wybór...",
  },
  en: {
    title: "Complete your profile now?",
    body:
      "It takes a few minutes and helps set calories, goals, and assistant guidance right away.",
    companion: "Your AI assistant is ready to tune the plan around your rhythm.",
    chips: ["Calories without manual math", "Water and reminders", "AI guidance"],
    start: "Yes, do it now",
    later: "Later",
    savingLater: "Saving choice...",
  },
} as const;

const getChoiceCopy = (language: ReturnType<typeof useLanguage>["appLanguage"]) => {
  switch (language) {
    case "pl":
      return choiceCopy.pl;
    case "en":
      return choiceCopy.en;
    case "uk":
    default:
      return choiceCopy.uk;
  }
};

export const OnboardingChoicePage = ({ state }: OnboardingStepProps) => {
  const navigate = useNavigate();
  const user = useSelector((rootState: RootState) => rootState.auth.user);
  const profile = useSelector((rootState: RootState) => rootState.profile);
  const { appLanguage, completeOnboarding } = useLanguage();
  const copy = getChoiceCopy(appLanguage);
  const profileAction = useProfileCloudAction(getProfileCloudActionCopy(appLanguage));

  const finishLater = async () => {
    if (!user || profileAction.saving) {
      if (!user) {
        navigate("/register", { replace: true });
      }
      return;
    }

    const completedAt = new Date().toISOString();
    const nextProfile = profileReducer(
      profileReducer(profile, setProfileLanguage(appLanguage)),
      setAssistantCustomization({
        onboarding: {
          ...profile.assistant.onboarding,
          preferredName:
            profile.assistant.onboarding.preferredName.trim() || user.name.trim(),
          primaryGoalNote: state.primaryGoalNote,
          goalSelections: state.selectedGoals,
          mainFriction: state.mainFriction,
          mainFrictions: state.mainFrictions,
          motivationStyle: state.motivationStyle,
          motivationStyles: state.motivationStyles,
          supportNote: state.supportNote,
          completedAt,
        },
      })
    );

    try {
      await profileAction.runProfileStateSave(nextProfile, completedAt);
      clearPreAuthOnboardingDraft();
      completeOnboarding();
      navigate("/dashboard", { replace: true });
    } catch {
      // useProfileCloudAction exposes the localized error below. Do not navigate
      // until the backend confirms that onboarding can be resumed later.
    }
  };

  return (
    <Box sx={shellSx}>
      <Paper
        elevation={0}
        className="sn-companion-panel"
        sx={{
          ...cardSx,
          position: "relative",
          overflow: "hidden",
          borderColor: "var(--sn-border-strong)",
          background: "var(--sn-companion-hero)",
          "& > *": {
            position: "relative",
            zIndex: 1,
          },
        }}
      >
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
            <Box
              sx={{
                position: "relative",
                display: "grid",
                placeItems: "center",
                flex: "0 0 auto",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  width: 118,
                  height: 118,
                  borderRadius: "50%",
                  background: "var(--sn-portal-ring)",
                  opacity: 0.78,
                },
              }}
            >
              <AssistantAvatar name="Assistant" variant="robot" mood="coach" size={92} active />
            </Box>
            <Stack spacing={1}>
              <Typography variant="overline" sx={{ color: "var(--sn-accent)", fontWeight: 900 }}>
                Smart Nutrition
              </Typography>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 950 }}>
                {copy.title}
              </Typography>
              <Typography sx={{ color: "var(--sn-on-companion-muted)", lineHeight: 1.7 }}>
                {copy.body}
              </Typography>
            </Stack>
          </Stack>

          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              border: "1px solid var(--sn-border-soft)",
              backgroundColor: "var(--sn-surface-glass)",
            }}
          >
            <Typography sx={{ fontWeight: 900, mb: 1 }}>{copy.companion}</Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {copy.chips.map((chip) => (
                <Chip
                  key={chip}
                  label={chip}
                  size="small"
                  sx={{
                    border: "1px solid var(--sn-border-soft)",
                    backgroundColor: "var(--sn-surface-elevated)",
                    color: "var(--sn-text-primary)",
                    fontWeight: 850,
                  }}
                />
              ))}
            </Stack>
          </Box>

          <Stack spacing={1.2}>
            {profileAction.error && (
              <Alert severity="error" sx={{ borderRadius: 1 }}>
                {profileAction.error}
              </Alert>
            )}
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate(stepPaths.gender)}
              disabled={profileAction.saving}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}
            >
              {copy.start}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => void finishLater()}
              disabled={profileAction.saving}
              startIcon={
                profileAction.saving ? <CircularProgress size={18} color="inherit" /> : undefined
              }
              data-onboarding-finish-later="backend-confirmed"
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {profileAction.saving ? copy.savingLater : copy.later}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};
