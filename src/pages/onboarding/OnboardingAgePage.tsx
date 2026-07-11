import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useLanguage } from "../../shared/language";
import {
  cardSx,
  clampNumber,
  parseOnboardingNumber,
  sanitizeOnboardingIntegerInput,
  selectOnboardingInputValue,
  shellSx,
  stepPaths,
  type OnboardingStepProps,
} from "./types";

export const OnboardingAgePage = ({ state, updateState }: OnboardingStepProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [ageInput, setAgeInput] = useState(String(state.age));
  const parsedAge = parseOnboardingNumber(ageInput);
  const ageValid = parsedAge !== null && parsedAge >= 10 && parsedAge <= 120;

  const updateAgeInput = (nextValue: string) => {
    const safeValue = sanitizeOnboardingIntegerInput(nextValue);
    setAgeInput(safeValue);

    const parsedValue = parseOnboardingNumber(safeValue);
    if (parsedValue !== null && parsedValue >= 10 && parsedValue <= 120) {
      updateState({ age: clampNumber(parsedValue, 10, 120) });
    }
  };

  const continueToHeight = () => {
    if (parsedAge === null) {
      return;
    }

    updateState({ age: clampNumber(parsedAge, 10, 120) });
    navigate(state.gender === "female" ? stepPaths.womenHealth : stepPaths.height);
  };

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
            type="text"
            value={ageInput}
            onChange={(event) => updateAgeInput(event.target.value)}
            onFocus={(event) => selectOnboardingInputValue(event.target)}
            onClick={(event) => selectOnboardingInputValue(event.currentTarget)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && ageValid) {
                continueToHeight();
              }
            }}
            slotProps={{
              htmlInput: {
                inputMode: "numeric",
                pattern: "[0-9]*",
                enterKeyHint: "next",
              },
            }}
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
              onClick={continueToHeight}
              disabled={!ageValid}
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
