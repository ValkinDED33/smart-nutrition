import { useState } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import type { AssistantDietFriction } from "@domain/profile/types";
import { useLanguage } from "../../shared/language";
import {
  cardSx,
  shellSx,
  stepPaths,
  toggleArrayValue,
  type OnboardingFrictionChoice,
  type OnboardingStepProps,
} from "./types";

const frictionOptions: OnboardingFrictionChoice[] = [
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
  const [selectedFrictions, setSelectedFrictions] = useState<OnboardingFrictionChoice[]>(
    state.mainFrictions.length > 0
      ? state.mainFrictions
      : state.mainFriction === "unknown"
        ? []
        : [state.mainFriction]
  );
  const allFrictionsSelected = frictionOptions.every((friction) =>
    selectedFrictions.includes(friction)
  );

  const updateSelectedFrictions = (mainFrictions: OnboardingFrictionChoice[]) => {
    const mainFriction: AssistantDietFriction = mainFrictions[0] ?? "unknown";
    setSelectedFrictions(mainFrictions);
    updateState({ mainFriction, mainFrictions });
  };

  const toggleFriction = (friction: OnboardingFrictionChoice) => {
    updateSelectedFrictions(toggleArrayValue(selectedFrictions, friction));
  };

  const continueToMotivation = () => {
    flushSync(() =>
      updateState({
        mainFriction: selectedFrictions[0] ?? "unknown",
        mainFrictions: selectedFrictions,
      })
    );
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

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant={allFrictionsSelected ? "contained" : "outlined"}
              onClick={() => updateSelectedFrictions(frictionOptions)}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {t("onboarding.selectAll")}
            </Button>
            <Button
              variant="outlined"
              onClick={() => updateSelectedFrictions([])}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {t("onboarding.clearSelection")}
            </Button>
          </Stack>

          <Stack spacing={1.2}>
            {frictionOptions.map((friction) => (
              <Button
                key={friction}
                variant={selectedFrictions.includes(friction) ? "contained" : "outlined"}
                size="large"
                onClick={() => toggleFriction(friction)}
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
              disabled={selectedFrictions.length === 0}
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
