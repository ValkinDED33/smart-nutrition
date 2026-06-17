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

export const OnboardingHeightPage = ({ state, updateState }: OnboardingStepProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [heightInput, setHeightInput] = useState(String(state.height));
  const parsedHeight = parseOnboardingNumber(heightInput);
  const heightValid =
    parsedHeight !== null && parsedHeight >= 120 && parsedHeight <= 250;

  const updateHeightInput = (nextValue: string) => {
    const safeValue = nextValue.replace(/[^\d]/g, "").slice(0, 3);
    setHeightInput(safeValue);

    const parsedValue = parseOnboardingNumber(safeValue);
    if (parsedValue !== null && parsedValue >= 120 && parsedValue <= 250) {
      updateState({ height: clampNumber(parsedValue, 120, 250) });
    }
  };

  const continueToWeight = () => {
    if (parsedHeight === null) {
      return;
    }

    updateState({ height: clampNumber(parsedHeight, 120, 250) });
    navigate(stepPaths.weight);
  };

  return (
    <Box sx={shellSx}>
      <Paper elevation={0} sx={cardSx}>
        <Stack spacing={3}>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
            {t("onboarding.heightTitle")}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            type="text"
            value={heightInput}
            onChange={(event) => updateHeightInput(event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
            onKeyDown={(event) => {
              if (event.key === "Enter" && heightValid) {
                continueToWeight();
              }
            }}
            inputProps={{
              inputMode: "numeric",
              pattern: "[0-9]*",
              enterKeyHint: "next",
            }}
          />
          <Stack direction="row" spacing={1.2}>
            <Button
              variant="outlined"
              onClick={() => navigate(stepPaths.gender)}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {t("onboarding.back")}
            </Button>
            <Button
              variant="contained"
              onClick={continueToWeight}
              disabled={!heightValid}
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
