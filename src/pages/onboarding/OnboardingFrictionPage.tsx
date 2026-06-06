import { useNavigate } from "react-router-dom";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import type { AssistantDietFriction } from "@domain/profile/types";
import { useLanguage } from "../../shared/language";
import { cardSx, shellSx, stepPaths, type OnboardingStepProps } from "./types";

const frictionOptions: Exclude<AssistantDietFriction, "unknown">[] = [
  "emotional_eating",
  "chaotic_schedule",
  "evening_snacking",
  "low_energy",
  "social_pressure",
];

export const OnboardingFrictionPage = ({
  state,
  updateState,
}: OnboardingStepProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <Box sx={shellSx}>
      <Paper elevation={0} sx={cardSx}>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
              {t("onboarding.frictionTitle")}
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {t("onboarding.frictionBody")}
            </Typography>
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
              onClick={() => navigate(stepPaths.goal)}
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
