import { useState } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import type { AssistantMotivationStyle } from "@domain/profile/types";
import { useLanguage } from "../../shared/language";
import {
  cardSx,
  shellSx,
  stepPaths,
  toggleArrayValue,
  type OnboardingStepProps,
} from "./types";

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
  const [selectedMotivationStyles, setSelectedMotivationStyles] = useState<
    AssistantMotivationStyle[]
  >(
    state.motivationStyles.length > 0
      ? state.motivationStyles
      : [state.motivationStyle]
  );
  const [supportNote, setSupportNote] = useState(state.supportNote);
  const allMotivationStylesSelected = motivationOptions.every((style) =>
    selectedMotivationStyles.includes(style)
  );

  const updateSelectedMotivationStyles = (
    motivationStyles: AssistantMotivationStyle[]
  ) => {
    const motivationStyle = motivationStyles[0] ?? "gentle";
    setSelectedMotivationStyles(motivationStyles);
    updateState({ motivationStyle, motivationStyles });
  };

  const toggleMotivationStyle = (nextStyle: AssistantMotivationStyle) => {
    updateSelectedMotivationStyles(
      toggleArrayValue(selectedMotivationStyles, nextStyle)
    );
  };

  const updateSupportNote = (nextNote: string) => {
    setSupportNote(nextNote);
    updateState({ supportNote: nextNote });
  };

  const continueToFinish = () => {
    flushSync(() =>
      updateState({
        motivationStyle: selectedMotivationStyles[0] ?? "gentle",
        motivationStyles: selectedMotivationStyles,
        supportNote,
      })
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

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant={allMotivationStylesSelected ? "contained" : "outlined"}
              onClick={() => updateSelectedMotivationStyles(motivationOptions)}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {t("onboarding.selectAll")}
            </Button>
            <Button
              variant="outlined"
              onClick={() => updateSelectedMotivationStyles([])}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {t("onboarding.clearSelection")}
            </Button>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {motivationOptions.map((motivationStyle) => (
              <Button
                key={motivationStyle}
                variant={
                  selectedMotivationStyles.includes(motivationStyle)
                    ? "contained"
                    : "outlined"
                }
                onClick={() => toggleMotivationStyle(motivationStyle)}
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
              slotProps={{ htmlInput: { maxLength: 220 } }}
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
              disabled={selectedMotivationStyles.length === 0}
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
