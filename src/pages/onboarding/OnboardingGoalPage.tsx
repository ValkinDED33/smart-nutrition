import { useNavigate } from "react-router-dom";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useLanguage } from "../../shared/language";
import {
  cardSx,
  goalOptions,
  shellSx,
  stepPaths,
  type OnboardingStepProps,
} from "./types";

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
                variant={
                  goal === "healthy"
                    ? state.goal === "maintain" && state.primaryGoalNote === "healthy"
                      ? "contained"
                      : "outlined"
                    : state.goal === goal && state.primaryGoalNote !== "healthy"
                      ? "contained"
                      : "outlined"
                }
                size="large"
                onClick={() =>
                  goal === "healthy"
                    ? updateState({ goal: "maintain", primaryGoalNote: "healthy" })
                    : updateState({ goal, primaryGoalNote: "" })
                }
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
              onClick={() => navigate(stepPaths.friction)}
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
