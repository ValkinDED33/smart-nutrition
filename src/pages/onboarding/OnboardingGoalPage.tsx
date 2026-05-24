import { useNavigate } from "react-router-dom";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { assistantDietFrictions } from "../../core/assistant";
import { useLanguage } from "../../shared/language";
import {
  cardSx,
  goalOptions,
  shellSx,
  stepPaths,
  type OnboardingStepProps,
} from "./types";

const frictionOptions = assistantDietFrictions.filter(
  (friction) => friction !== "unknown"
);

export const OnboardingGoalPage = ({ state, updateState }: OnboardingStepProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <Box sx={shellSx}>
      <Paper elevation={0} sx={cardSx}>
        <Stack spacing={3}>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
            {t("onboarding.goalTitle")}
          </Typography>
          <Stack spacing={1.2}>
            {goalOptions.map((goal) => (
              <Button
                key={goal}
                variant={state.goal === goal ? "contained" : "outlined"}
                size="large"
                onClick={() => updateState({ goal })}
                sx={{ justifyContent: "flex-start", borderRadius: 1, textTransform: "none", fontWeight: 900 }}
              >
                {t(`option.goal.${goal}`)}
              </Button>
            ))}
          </Stack>

          <TextField
            fullWidth
            multiline
            minRows={2}
            value={state.primaryGoalNote}
            label={t("onboarding.goalNoteLabel")}
            placeholder={t("onboarding.goalNotePlaceholder")}
            onChange={(event) => updateState({ primaryGoalNote: event.target.value })}
            inputProps={{ maxLength: 180 }}
          />

          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 800 }}>{t("onboarding.frictionTitle")}</Typography>
            <Typography color="text.secondary">{t("onboarding.frictionBody")}</Typography>
            <Stack spacing={1}>
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
          </Stack>

          <TextField
            fullWidth
            multiline
            minRows={2}
            value={state.supportNote}
            label={t("onboarding.supportNoteLabel")}
            placeholder={t("onboarding.supportNotePlaceholder")}
            onChange={(event) => updateState({ supportNote: event.target.value })}
            inputProps={{ maxLength: 180 }}
          />

          <Stack direction="row" spacing={1.2}>
            <Button
              variant="outlined"
              onClick={() => navigate(stepPaths.age)}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {t("onboarding.back")}
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate(stepPaths.weight)}
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
