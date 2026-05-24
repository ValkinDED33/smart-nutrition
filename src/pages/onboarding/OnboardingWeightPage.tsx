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

export const OnboardingWeightPage = ({ state, updateState }: OnboardingStepProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

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
            type="number"
            value={state.weight}
            onChange={(event) =>
              updateState({ weight: clampNumber(Number(event.target.value) || 70, 30, 300) })
            }
            inputProps={{ min: 30, max: 300, step: 0.1, inputMode: "decimal" }}
          />
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
              onClick={() => navigate(stepPaths.finish)}
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
