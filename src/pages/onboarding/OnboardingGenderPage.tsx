import { useNavigate } from "react-router-dom";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useLanguage } from "../../shared/language";
import type { Gender } from "../../shared/types/user";
import { cardSx, shellSx, stepPaths, type OnboardingStepProps } from "./types";

const genderOptions: Gender[] = ["male", "female"];

export const OnboardingGenderPage = ({ state, updateState }: OnboardingStepProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <Box sx={shellSx}>
      <Paper elevation={0} sx={cardSx}>
        <Stack spacing={3}>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
            {t("onboarding.genderTitle")}
          </Typography>
          <Stack spacing={1.2}>
            {genderOptions.map((gender) => (
              <Button
                key={gender}
                variant={state.gender === gender ? "contained" : "outlined"}
                size="large"
                onClick={() => updateState({ gender })}
                sx={{ justifyContent: "flex-start", borderRadius: 1, textTransform: "none", fontWeight: 900 }}
              >
                {t(`option.gender.${gender}`)}
              </Button>
            ))}
          </Stack>
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
              onClick={() => navigate(stepPaths.height)}
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
