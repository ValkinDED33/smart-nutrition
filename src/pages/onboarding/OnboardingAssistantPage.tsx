import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { assistantMotivationStyles } from "../../core/assistant";
import { AssistantAvatar } from "../../shared/components/AssistantAvatar";
import { useLanguage } from "../../shared/language";
import type { AssistantMotivationStyle } from "../../shared/types/profile";
import {
  cardSx,
  shellSx,
  stepPaths,
  type OnboardingStepProps,
  type PersonalityPreset,
} from "./types";

const motivationStyleOptions = assistantMotivationStyles;

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

          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 800 }}>{t("onboarding.motivationTitle")}</Typography>
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
          </Stack>

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
