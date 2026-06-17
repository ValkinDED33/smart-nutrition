import { useState } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import type { AssistantMotivationStyle } from "@domain/profile/types";
import { useLanguage } from "../../shared/language";
import { cardSx, shellSx, stepPaths, type OnboardingStepProps } from "./types";

const motivationOptions: AssistantMotivationStyle[] = [
  "gentle",
  "direct",
  "energetic",
];

export const OnboardingMotivationPage = ({
  state,
  updateState,
}: OnboardingStepProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedMotivationStyle, setSelectedMotivationStyle] = useState(state.motivationStyle);
  const [supportNote, setSupportNote] = useState(state.supportNote);

  const selectMotivationStyle = (nextStyle: AssistantMotivationStyle) => {
    setSelectedMotivationStyle(nextStyle);
    updateState({ motivationStyle: nextStyle });
  };

  const updateSupportNote = (nextNote: string) => {
    setSupportNote(nextNote);
    updateState({ supportNote: nextNote });
  };

  const continueToFinish = () => {
    flushSync(() =>
      updateState({ motivationStyle: selectedMotivationStyle, supportNote })
    );
    navigate(stepPaths.finish);
  };

  return (
    <Box sx={shellSx}>
      <Paper elevation={0} sx={cardSx}>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
              {t("onboarding.motivationTitle")}
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {t("onboarding.motivationBody")}
            </Typography>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {motivationOptions.map((motivationStyle) => (
              <Button
                key={motivationStyle}
                variant={
                  selectedMotivationStyle === motivationStyle
                    ? "contained"
                    : "outlined"
                }
                onClick={() => selectMotivationStyle(motivationStyle)}
                sx={{ flex: 1, borderRadius: 1, textTransform: "none", fontWeight: 900 }}
              >
                {t(`onboarding.motivationStyles.${motivationStyle}`)}
              </Button>
            ))}
          </Stack>

          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 900 }}>
              {t("onboarding.supportNoteLabel")}
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              value={supportNote}
              placeholder={t("onboarding.supportNotePlaceholder")}
              onChange={(event) => updateSupportNote(event.target.value)}
              inputProps={{ maxLength: 220 }}
            />
          </Stack>

          <Stack direction="row" spacing={1.2}>
            <Button
              variant="outlined"
              onClick={() => navigate(stepPaths.friction)}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {t("onboarding.back")}
            </Button>
            <Button
              variant="contained"
              onClick={continueToFinish}
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
