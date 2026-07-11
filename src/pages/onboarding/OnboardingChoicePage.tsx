import { useNavigate } from "react-router-dom";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useLanguage } from "../../shared/language";
import { cardSx, shellSx, stepPaths } from "./types";

const choiceCopy = {
  uk: {
    title: "Заповнити анкету зараз?",
    body:
      "Це займе кілька хвилин і допоможе одразу налаштувати калорії, цілі та підказки помічника.",
    start: "Так, заповнити зараз",
    later: "Пізніше",
  },
  pl: {
    title: "Uzupełnić ankietę teraz?",
    body:
      "To zajmie kilka minut i od razu pomoże ustawić kalorie, cele oraz podpowiedzi asystenta.",
    start: "Tak, wypełnij teraz",
    later: "Później",
  },
  en: {
    title: "Complete your profile now?",
    body:
      "It takes a few minutes and helps set calories, goals, and assistant guidance right away.",
    start: "Yes, do it now",
    later: "Later",
  },
} as const;

const getChoiceCopy = (language: ReturnType<typeof useLanguage>["appLanguage"]) => {
  switch (language) {
    case "pl":
      return choiceCopy.pl;
    case "en":
      return choiceCopy.en;
    case "uk":
    default:
      return choiceCopy.uk;
  }
};

export const OnboardingChoicePage = () => {
  const navigate = useNavigate();
  const { appLanguage } = useLanguage();
  const copy = getChoiceCopy(appLanguage);

  return (
    <Box sx={shellSx}>
      <Paper elevation={0} sx={cardSx}>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 900 }}>
              Smart Nutrition
            </Typography>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
              {copy.title}
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {copy.body}
            </Typography>
          </Stack>

          <Stack spacing={1.2}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate(stepPaths.gender)}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}
            >
              {copy.start}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate("/dashboard", { replace: true })}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {copy.later}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};
