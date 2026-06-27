import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AssistantAvatar } from "@shared/components/AssistantAvatar";
import { LanguageMenuButton } from "@shared/components/LanguageMenuButton";
import { useLanguage } from "../../shared/language";
import {
  cardSx,
  assistantAvatarOptions,
  shellSx,
  stepPaths,
  type PersonalityPreset,
  type OnboardingStepProps,
} from "./types";

const assistantAvatarLabels = {
  uk: {
    cat: "Кіт",
    dog: "Собака",
    fox: "Лис",
    panda: "Панда",
    owl: "Сова",
    dragon: "Дракон",
    robot: "Робот",
    human: "Тренер",
    capybara: "Капібара",
  },
  pl: {
    cat: "Kot",
    dog: "Pies",
    fox: "Lis",
    panda: "Panda",
    owl: "Sowa",
    dragon: "Smok",
    robot: "Robot",
    human: "Trener",
    capybara: "Kapibara",
  },
  en: {
    cat: "Cat",
    dog: "Dog",
    fox: "Fox",
    panda: "Panda",
    owl: "Owl",
    dragon: "Dragon",
    robot: "Robot",
    human: "Trainer",
    capybara: "Capybara",
  },
} as const;

export const OnboardingAssistantPage = ({ state, updateState }: OnboardingStepProps) => {
  const navigate = useNavigate();
  const { appLanguage, languageLabels, setLanguage, t } = useLanguage();
  const avatarLabels = assistantAvatarLabels[appLanguage];
  const personalityOptions: PersonalityPreset[] = [
    "supportive",
    "strict",
    "scientific",
    "energetic",
  ];

  return (
    <Box sx={shellSx}>
      <Paper elevation={0} sx={cardSx}>
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
            <AssistantAvatar name={state.assistantName} variant={state.assistantAvatar} mood="happy" size={96} />
            <Stack spacing={0.8}>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
                {t("onboarding.assistantTitle")}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: "1.08rem", lineHeight: 1.55 }}>
                {t("onboarding.assistantBody")}
              </Typography>
            </Stack>
          </Stack>

          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 900 }}>{t("onboarding.avatarQuestion")}</Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(5, minmax(0, 1fr))" },
                gap: 1,
              }}
            >
              {assistantAvatarOptions.map((avatar) => (
                <Button
                  key={avatar}
                  variant={state.assistantAvatar === avatar ? "contained" : "outlined"}
                  onClick={() => updateState({ assistantAvatar: avatar })}
                  sx={{
                    minHeight: 92,
                    borderRadius: 1,
                    textTransform: "none",
                    fontWeight: 900,
                  }}
                >
                  <Stack spacing={0.7} alignItems="center">
                    <AssistantAvatar
                      name={state.assistantName}
                      variant={avatar}
                      mood="happy"
                      size={42}
                    />
                    <span>{avatarLabels[avatar]}</span>
                  </Stack>
                </Button>
              ))}
            </Box>
          </Stack>

          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 900 }}>{t("onboarding.personalityQuestion")}</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              {personalityOptions.map((personality) => (
                <Button
                  key={personality}
                  variant={state.personality === personality ? "contained" : "outlined"}
                  onClick={() => updateState({ personality })}
                  sx={{ flex: 1, borderRadius: 1, textTransform: "none", fontWeight: 900 }}
                >
                  {t(`assistant.style.${personality}`)}
                </Button>
              ))}
            </Stack>
          </Stack>

          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 900 }}>{t("onboarding.assistantQuestion")}</Typography>
            <TextField
              autoFocus
              fullWidth
              value={state.assistantName}
              placeholder={t("onboarding.assistantPlaceholder")}
              onChange={(event) => updateState({ assistantName: event.target.value })}
              inputProps={{ maxLength: 32 }}
            />
          </Stack>

          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 900 }}>{t("onboarding.languageTitle")}</Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-start",
              }}
            >
              <LanguageMenuButton
                id="onboarding-language-menu-button"
                value={appLanguage}
                labels={languageLabels}
                ariaLabel={t("navigation.languageAria")}
                onChange={setLanguage}
                sx={{
                  minWidth: 104,
                  borderRadius: 1,
                  justifyContent: "center",
                }}
              />
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.2}>
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
