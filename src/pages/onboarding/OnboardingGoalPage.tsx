import { useNavigate } from "react-router-dom";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useLanguage } from "../../shared/language";
import {
  cardSx,
  derivePrimaryGoal,
  goalOptions,
  shellSx,
  stepPaths,
  toggleArrayValue,
  type OnboardingGoalChoice,
  type OnboardingStepProps,
} from "./types";

export const OnboardingGoalPage = ({ state, updateState }: OnboardingStepProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const selectedGoals = state.selectedGoals;

  const updateSelectedGoals = (nextGoals: OnboardingGoalChoice[]) => {
    const nextPrimary = derivePrimaryGoal(nextGoals);
    updateState({
      selectedGoals: nextGoals,
      goal: nextPrimary.goal,
      primaryGoalNote: nextPrimary.primaryGoalNote,
    });
  };

  const toggleGoal = (goal: OnboardingGoalChoice) => {
    updateSelectedGoals(toggleArrayValue(selectedGoals, goal));
  };

  const allGoalsSelected = goalOptions.every((goal) => selectedGoals.includes(goal));

  return (
    <Box sx={shellSx}>
      <Paper elevation={0} sx={cardSx}>
        <Stack spacing={3}>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
            {t("onboarding.goalTitle")}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant={allGoalsSelected ? "contained" : "outlined"}
              onClick={() => updateSelectedGoals(goalOptions)}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {t("onboarding.selectAll")}
            </Button>
            <Button
              variant="outlined"
              onClick={() => updateSelectedGoals([])}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {t("onboarding.clearSelection")}
            </Button>
          </Stack>
          <Stack spacing={1.2}>
            {goalOptions.map((goal) => (
              <Button
                key={goal}
                variant={selectedGoals.includes(goal) ? "contained" : "outlined"}
                size="large"
                onClick={() => toggleGoal(goal)}
                sx={{ justifyContent: "flex-start", borderRadius: 1, textTransform: "none", fontWeight: 900 }}
              >
                {t(`option.goal.${goal}`)}
              </Button>
            ))}
          </Stack>

          <Stack direction="row" spacing={1.2}>
            <Button
              variant="outlined"
              onClick={() => navigate(stepPaths.weight)}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {t("onboarding.back")}
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate(stepPaths.finish)}
              disabled={selectedGoals.length === 0}
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
