import { useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import type { AppDispatch, RootState } from "../app/store";
import { setUser } from "../features/auth/authSlice";
import {
  applyProfileTargets,
  setAssistantCustomization,
  setProfileLanguage,
} from "../features/profile/profileSlice";
import { updateStoredProfile } from "../shared/api/auth";
import { calculateProfileTargets } from "../shared/lib/profileTargets";
import { AssistantAvatar } from "../shared/components/AssistantAvatar";
import { useLanguage } from "../shared/language";
import { DEFAULT_ASSISTANT_NAME, assistantDietFrictions, assistantMotivationStyles } from "../core/assistant";
import type { AppLanguage } from "../shared/types/i18n";
import type {
  AssistantDietFriction,
  AssistantMotivationStyle,
} from "../shared/types/profile";
import type { Goal } from "../shared/types/user";

type PersonalityPreset = "supportive" | "strict" | "energetic";

interface OnboardingState {
  assistantName: string;
  personality: PersonalityPreset;
  name: string;
  age: number;
  goal: Goal;
  primaryGoalNote: string;
  mainFriction: AssistantDietFriction;
  motivationStyle: AssistantMotivationStyle;
  supportNote: string;
  weight: number;
}

interface OnboardingStepProps {
  state: OnboardingState;
  updateState: (patch: Partial<OnboardingState>) => void;
}

const stepPaths = {
  welcome: "/onboarding",
  assistant: "/onboarding/assistant",
  name: "/onboarding/name",
  goal: "/onboarding/goal",
  friction: "/onboarding/friction",
  motivation: "/onboarding/motivation",
  age: "/onboarding/age",
  weight: "/onboarding/weight",
  finish: "/onboarding/finish",
} as const;

const cardSx = {
  width: "100%",
  maxWidth: 520,
  p: { xs: 2.5, sm: 3.5 },
  borderRadius: 1,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  backgroundColor: "rgba(255,255,255,0.92)",
} as const;

const shellSx = {
  minHeight: { xs: "calc(100vh - 140px)", md: "calc(100vh - 180px)" },
  display: "grid",
  placeItems: "center",
} as const;

const goalOptions: Goal[] = ["cut", "maintain", "bulk"];
const frictionOptions = assistantDietFrictions.filter(
  (friction) => friction !== "unknown"
);
const motivationStyleOptions = assistantMotivationStyles;

const personalityValues: Record<
  PersonalityPreset,
  {
    warmth: number;
    humor: number;
    strictness: number;
    motivation: number;
  }
> = {
  supportive: { warmth: 0.9, humor: 0.4, strictness: 0.2, motivation: 0.8 },
  strict: { warmth: 0.45, humor: 0.1, strictness: 0.85, motivation: 0.7 },
  energetic: { warmth: 0.75, humor: 0.55, strictness: 0.35, motivation: 0.95 },
};

const clampNumber = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const OnboardingWelcomePage = () => {
  const navigate = useNavigate();
  const { appLanguage, languageLabels, setLanguage, t } = useLanguage();
  const dispatch = useDispatch<AppDispatch>();

  const handleLanguageChange = (value: AppLanguage) => {
    setLanguage(value);
    dispatch(setProfileLanguage(value));
  };

  return (
    <Box sx={shellSx}>
      <Paper elevation={0} sx={cardSx}>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 900 }}>
              Smart Nutrition
            </Typography>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
              {t("onboarding.welcomeTitle")}
            </Typography>
            <Typography color="text.secondary">{t("onboarding.welcomeBody")}</Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 800 }}>{t("onboarding.languageTitle")}</Typography>
            <FormControl fullWidth>
              <Select
                value={appLanguage}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  if (nextValue === "uk" || nextValue === "pl" || nextValue === "en") {
                    handleLanguageChange(nextValue);
                  }
                }}
              >
                <MenuItem value="uk">{languageLabels.uk}</MenuItem>
                <MenuItem value="pl">{languageLabels.pl}</MenuItem>
                <MenuItem value="en">{languageLabels.en}</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Button
            variant="contained"
            size="large"
            onClick={() => navigate(stepPaths.assistant)}
            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}
          >
            {t("onboarding.start")}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export const OnboardingAssistantPage = ({ state, updateState }: OnboardingStepProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <Box sx={shellSx}>
      <Paper elevation={0} sx={cardSx}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={2} alignItems="center">
            <AssistantAvatar name={state.assistantName} variant="robot" mood="happy" active />
            <Stack spacing={0.5}>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
                {t("onboarding.assistantTitle")}
              </Typography>
              <Typography color="text.secondary">{t("assistant.hello")}</Typography>
            </Stack>
          </Stack>

          <TextField
            autoFocus
            fullWidth
            value={state.assistantName}
            placeholder={t("onboarding.assistantPlaceholder")}
            onChange={(event) => updateState({ assistantName: event.target.value })}
            inputProps={{ maxLength: 32 }}
          />

          <ToggleButtonGroup
            exclusive
            fullWidth
            value={state.personality}
            onChange={(_, value: PersonalityPreset | null) => {
              if (value) {
                updateState({ personality: value });
              }
            }}
          >
            <ToggleButton value="supportive">{t("assistant.personalities.supportive")}</ToggleButton>
            <ToggleButton value="strict">{t("assistant.personalities.strict")}</ToggleButton>
            <ToggleButton value="energetic">{t("assistant.personalities.energetic")}</ToggleButton>
          </ToggleButtonGroup>

          <Stack direction="row" spacing={1.2}>
            <Button
              variant="outlined"
              onClick={() => navigate(stepPaths.welcome)}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {t("onboarding.back")}
            </Button>
            <Button
              variant="contained"
              disabled={state.assistantName.trim().length < 2}
              onClick={() => navigate(stepPaths.name)}
              sx={{ flex: 1, borderRadius: 999, textTransform: "none", fontWeight: 900 }}
            >
              {t("onboarding.next")}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export const OnboardingNamePage = ({ state, updateState }: OnboardingStepProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <Box sx={shellSx}>
      <Paper elevation={0} sx={cardSx}>
        <Stack spacing={3}>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
            {t("onboarding.nameTitle")}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            value={state.name}
            placeholder={t("onboarding.namePlaceholder")}
            onChange={(event) => updateState({ name: event.target.value })}
            inputProps={{ maxLength: 60 }}
          />
          <Stack direction="row" spacing={1.2}>
            <Button
              variant="outlined"
              onClick={() => navigate(stepPaths.assistant)}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {t("onboarding.back")}
            </Button>
            <Button
              variant="contained"
              disabled={state.name.trim().length < 2}
              onClick={() => navigate(stepPaths.goal)}
              sx={{ flex: 1, borderRadius: 999, textTransform: "none", fontWeight: 900 }}
            >
              {t("onboarding.next")}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export const OnboardingAgePage = ({ state, updateState }: OnboardingStepProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <Box sx={shellSx}>
      <Paper elevation={0} sx={cardSx}>
        <Stack spacing={3}>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
            {t("onboarding.ageTitle")}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            type="number"
            value={state.age}
            onChange={(event) =>
              updateState({ age: clampNumber(Number(event.target.value) || 18, 10, 120) })
            }
            inputProps={{ min: 10, max: 120, inputMode: "numeric" }}
          />
          <Stack direction="row" spacing={1.2}>
            <Button
              variant="outlined"
              onClick={() => navigate(stepPaths.motivation)}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {t("onboarding.back")}
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate(stepPaths.weight)}
              sx={{ flex: 1, borderRadius: 999, textTransform: "none", fontWeight: 900 }}
            >
              {t("onboarding.next")}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export const OnboardingGoalPage = ({ state, updateState }: OnboardingStepProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <Box sx={shellSx}>
      <Paper elevation={0} sx={cardSx}>
        <Stack spacing={3}>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
            {t("onboarding.goalTitle")}
          </Typography>
          <Stack spacing={1.2}>
            {goalOptions.map((goal) => (
              <Button
                key={goal}
                variant={state.goal === goal ? "contained" : "outlined"}
                size="large"
                onClick={() => updateState({ goal })}
                sx={{ justifyContent: "flex-start", borderRadius: 1, textTransform: "none", fontWeight: 900 }}
              >
                {t(`option.goal.${goal}`)}
              </Button>
            ))}
          </Stack>
          <TextField
            fullWidth
            multiline
            minRows={2}
            value={state.primaryGoalNote}
            label={t("onboarding.goalNoteLabel")}
            placeholder={t("onboarding.goalNotePlaceholder")}
            onChange={(event) => updateState({ primaryGoalNote: event.target.value })}
            inputProps={{ maxLength: 180 }}
          />
          <Stack direction="row" spacing={1.2}>
            <Button
              variant="outlined"
              onClick={() => navigate(stepPaths.name)}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {t("onboarding.back")}
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate(stepPaths.friction)}
              sx={{ flex: 1, borderRadius: 999, textTransform: "none", fontWeight: 900 }}
            >
              {t("onboarding.next")}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export const OnboardingFrictionPage = ({ state, updateState }: OnboardingStepProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <Box sx={shellSx}>
      <Paper elevation={0} sx={cardSx}>
        <Stack spacing={3}>
          <Stack spacing={0.8}>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
              {t("onboarding.frictionTitle")}
            </Typography>
            <Typography color="text.secondary">{t("onboarding.frictionBody")}</Typography>
          </Stack>
          <Stack spacing={1.2}>
            {frictionOptions.map((friction) => (
              <Button
                key={friction}
                variant={state.mainFriction === friction ? "contained" : "outlined"}
                size="large"
                onClick={() => updateState({ mainFriction: friction })}
                sx={{
                  justifyContent: "flex-start",
                  borderRadius: 1,
                  textTransform: "none",
                  fontWeight: 900,
                }}
              >
                {t(`onboarding.frictions.${friction}`)}
              </Button>
            ))}
          </Stack>
          <Stack direction="row" spacing={1.2}>
            <Button
              variant="outlined"
              onClick={() => navigate(stepPaths.age)}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {t("onboarding.back")}
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate(stepPaths.motivation)}
              sx={{ flex: 1, borderRadius: 999, textTransform: "none", fontWeight: 900 }}
            >
              {t("onboarding.next")}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export const OnboardingMotivationPage = ({ state, updateState }: OnboardingStepProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <Box sx={shellSx}>
      <Paper elevation={0} sx={cardSx}>
        <Stack spacing={3}>
          <Stack spacing={0.8}>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
              {t("onboarding.motivationTitle")}
            </Typography>
            <Typography color="text.secondary">{t("onboarding.motivationBody")}</Typography>
          </Stack>

          <ToggleButtonGroup
            exclusive
            fullWidth
            value={state.motivationStyle}
            onChange={(_, value: AssistantMotivationStyle | null) => {
              if (value) {
                updateState({ motivationStyle: value });
              }
            }}
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
              gap: 1,
              "& .MuiToggleButtonGroup-grouped": {
                border: "1px solid rgba(15, 23, 42, 0.12)",
                borderRadius: 1,
                m: 0,
                textTransform: "none",
                fontWeight: 800,
              },
            }}
          >
            {motivationStyleOptions.map((style) => (
              <ToggleButton key={style} value={style}>
                {t(`onboarding.motivationStyles.${style}`)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <TextField
            fullWidth
            multiline
            minRows={2}
            value={state.supportNote}
            label={t("onboarding.supportNoteLabel")}
            placeholder={t("onboarding.supportNotePlaceholder")}
            onChange={(event) => updateState({ supportNote: event.target.value })}
            inputProps={{ maxLength: 180 }}
          />

          <Stack direction="row" spacing={1.2}>
            <Button
              variant="outlined"
              onClick={() => navigate(stepPaths.friction)}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {t("onboarding.back")}
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate(stepPaths.age)}
              sx={{ flex: 1, borderRadius: 999, textTransform: "none", fontWeight: 900 }}
            >
              {t("onboarding.next")}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export const OnboardingWeightPage = ({ state, updateState }: OnboardingStepProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <Box sx={shellSx}>
      <Paper elevation={0} sx={cardSx}>
        <Stack spacing={3}>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
            {t("onboarding.weightTitle")}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            type="number"
            value={state.weight}
            onChange={(event) =>
              updateState({ weight: clampNumber(Number(event.target.value) || 70, 30, 300) })
            }
            inputProps={{ min: 30, max: 300, step: 0.1, inputMode: "decimal" }}
          />
          <Stack direction="row" spacing={1.2}>
            <Button
              variant="outlined"
              onClick={() => navigate(stepPaths.goal)}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {t("onboarding.back")}
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate(stepPaths.finish)}
              sx={{ flex: 1, borderRadius: 999, textTransform: "none", fontWeight: 900 }}
            >
              {t("onboarding.next")}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

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

    dispatch(setUser(nextUser));
    dispatch(setProfileLanguage(appLanguage));
    dispatch(
      setAssistantCustomization({
        name: state.assistantName.trim(),
        role: state.personality === "strict" ? "coach" : "assistant",
        tone: state.personality === "strict" ? "focused" : state.personality === "energetic" ? "playful" : "gentle",
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

const OnboardingPage = () => {
  const user = useSelector((rootState: RootState) => rootState.auth.user);
  const profile = useSelector((rootState: RootState) => rootState.profile);
  const initialState = useMemo<OnboardingState>(
    () => ({
      assistantName: profile.assistant.name || DEFAULT_ASSISTANT_NAME,
      personality: "supportive",
      name: profile.assistant.onboarding.preferredName || user?.name || "",
      age: user?.age ?? 25,
      goal: user?.goal ?? profile.goal,
      primaryGoalNote: profile.assistant.onboarding.primaryGoalNote,
      mainFriction: profile.assistant.onboarding.mainFriction,
      motivationStyle: profile.assistant.onboarding.motivationStyle,
      supportNote: profile.assistant.onboarding.supportNote,
      weight: user?.weight ?? profile.weightHistory.at(-1)?.weight ?? 70,
    }),
    [
      profile.assistant.name,
      profile.assistant.onboarding,
      profile.goal,
      profile.weightHistory,
      user,
    ]
  );
  const [state, setState] = useState(initialState);
  const updateState = (patch: Partial<OnboardingState>) =>
    setState((current) => ({ ...current, ...patch }));

  const stepProps = { state, updateState };

  return (
    <Routes>
      <Route index element={<OnboardingWelcomePage />} />
      <Route path="assistant" element={<OnboardingAssistantPage {...stepProps} />} />
      <Route path="name" element={<OnboardingNamePage {...stepProps} />} />
      <Route path="goal" element={<OnboardingGoalPage {...stepProps} />} />
      <Route path="friction" element={<OnboardingFrictionPage {...stepProps} />} />
      <Route path="motivation" element={<OnboardingMotivationPage {...stepProps} />} />
      <Route path="age" element={<OnboardingAgePage {...stepProps} />} />
      <Route path="weight" element={<OnboardingWeightPage {...stepProps} />} />
      <Route path="finish" element={<OnboardingFinishPage {...stepProps} />} />
      <Route path="*" element={<Navigate to={stepPaths.welcome} replace />} />
    </Routes>
  );
};

export default OnboardingPage;
