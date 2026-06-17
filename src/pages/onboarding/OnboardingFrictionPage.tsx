import { useState } from "react";
import { flushSync } from "react-dom";
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
  const [selectedFriction, setSelectedFriction] = useState(state.mainFriction);

  const selectFriction = (mainFriction: AssistantDietFriction) => {
    setSelectedFriction(mainFriction);
    updateState({ mainFriction });
  };

  const continueToMotivation = () => {
    flushSync(() => updateState({ mainFriction: selectedFriction }));
    navigate(stepPaths.motivation);
  };

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
                variant={selectedFriction === friction ? "contained" : "outlined"}
                size="large"
                onClick={() => selectFriction(friction)}
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
              onClick={continueToMotivation}
              disabled={selectedFriction === "unknown"}
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
