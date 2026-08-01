import { useNavigate } from "react-router-dom";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useLanguage } from "../../shared/language";
import { cardSx, shellSx, stepPaths, type OnboardingStepProps } from "./types";

export const OnboardingNamePage = ({ state, updateState }: OnboardingStepProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const trimmedName = state.name.trim();
  const canContinue = trimmedName.length >= 2;
  const handleNext = () => {
    if (!canContinue) {
      return;
    }

    updateState({ name: trimmedName });
    navigate(stepPaths.age);
  };

  return (
    <Box sx={shellSx}>
      <Paper elevation={0} sx={cardSx}>
        <Stack
          component="form"
          spacing={3}
          onSubmit={(event) => {
            event.preventDefault();
            handleNext();
          }}
        >
          <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
            {t("onboarding.nameTitle")}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            value={state.name}
            placeholder={t("onboarding.namePlaceholder")}
            onChange={(event) => updateState({ name: event.target.value })}
            autoComplete="name"
            slotProps={{ htmlInput: { maxLength: 60, enterKeyHint: "next" } }}
          />
          <Stack direction="row" spacing={1.2}>
            <Button
              variant="outlined"
              onClick={() =>
                navigate(state.gender === "female" ? stepPaths.womenHealth : stepPaths.gender)
              }
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {t("onboarding.back")}
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={!canContinue}
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
