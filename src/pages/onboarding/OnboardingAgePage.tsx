import { useNavigate } from "react-router-dom";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useLanguage } from "../../shared/language";
import {
  cardSx,
  clampNumber,
  shellSx,
  stepPaths,
  type OnboardingStepProps,
} from "./types";

export const OnboardingAgePage = ({ state, updateState }: OnboardingStepProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

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
            type="number"
            value={state.age}
            onChange={(event) =>
              updateState({ age: clampNumber(Number(event.target.value) || 18, 10, 120) })
            }
            inputProps={{ min: 10, max: 120, inputMode: "numeric" }}
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
              onClick={() => navigate(stepPaths.gender)}
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
