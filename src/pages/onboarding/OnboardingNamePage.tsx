import { useNavigate } from "react-router-dom";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useLanguage } from "../../shared/language";
import { cardSx, shellSx, stepPaths, type OnboardingStepProps } from "./types";

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
