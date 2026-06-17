import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useLanguage } from "../../shared/language";
import {
  cardSx,
  clampNumber,
  parseOnboardingNumber,
  shellSx,
  stepPaths,
  type OnboardingStepProps,
} from "./types";

export const OnboardingWeightPage = ({ state, updateState }: OnboardingStepProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [weightInput, setWeightInput] = useState(String(state.weight).replace(".", ","));
  const parsedWeight = parseOnboardingNumber(weightInput);
  const weightValid =
    parsedWeight !== null && parsedWeight >= 30 && parsedWeight <= 300;

  const updateWeightInput = (nextValue: string) => {
    const safeValue = nextValue
      .replace(/[^\d,.]/g, "")
      .replace(".", ",")
      .replace(/(,.*),/g, "$1")
      .slice(0, 5);
    setWeightInput(safeValue);

    const parsedValue = parseOnboardingNumber(safeValue);
    if (parsedValue !== null && parsedValue >= 30 && parsedValue <= 300) {
      updateState({ weight: clampNumber(parsedValue, 30, 300) });
    }
  };

  const continueToGoal = () => {
    if (parsedWeight === null) {
      return;
    }

    updateState({ weight: clampNumber(parsedWeight, 30, 300) });
    navigate(stepPaths.goal);
  };

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
            type="text"
            value={weightInput}
            onChange={(event) => updateWeightInput(event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
            onKeyDown={(event) => {
              if (event.key === "Enter" && weightValid) {
                continueToGoal();
              }
            }}
            inputProps={{
              inputMode: "decimal",
              enterKeyHint: "next",
            }}
          />
          <Stack direction="row" spacing={1.2}>
            <Button
              variant="outlined"
              onClick={() => navigate(stepPaths.height)}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {t("onboarding.back")}
            </Button>
            <Button
              variant="contained"
              onClick={continueToGoal}
              disabled={!weightValid}
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
