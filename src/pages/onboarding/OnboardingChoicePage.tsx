import { useNavigate } from "react-router-dom";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { AssistantAvatar } from "../../shared/components/AssistantAvatar";
import { useLanguage } from "../../shared/language";
import { cardSx, shellSx, stepPaths } from "./types";

const choiceCopy = {
  uk: {
    title: "Заповнити анкету зараз?",
    body:
      "Це займе кілька хвилин і допоможе одразу налаштувати калорії, цілі та підказки помічника.",
    companion: "Ваш AI-помічник вже готовий підлаштувати план під ваш ритм.",
    chips: ["Калорії без ручної математики", "Вода і нагадування", "Підказки AI"],
    start: "Так, заповнити зараз",
    later: "Пізніше",
  },
  pl: {
    title: "Uzupełnić ankietę teraz?",
    body:
      "To zajmie kilka minut i od razu pomoże ustawić kalorie, cele oraz podpowiedzi asystenta.",
    companion: "Twój asystent AI jest gotowy dopasować plan do Twojego rytmu.",
    chips: ["Kalorie bez ręcznej matematyki", "Woda i przypomnienia", "Wskazówki AI"],
    start: "Tak, wypełnij teraz",
    later: "Później",
  },
  en: {
    title: "Complete your profile now?",
    body:
      "It takes a few minutes and helps set calories, goals, and assistant guidance right away.",
    companion: "Your AI assistant is ready to tune the plan around your rhythm.",
    chips: ["Calories without manual math", "Water and reminders", "AI guidance"],
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
      <Paper
        elevation={0}
        className="sn-companion-panel"
        sx={{
          ...cardSx,
          position: "relative",
          overflow: "hidden",
          borderColor: "var(--sn-border-strong)",
          background: "var(--sn-companion-hero)",
          "& > *": {
            position: "relative",
            zIndex: 1,
          },
        }}
      >
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
            <Box
              sx={{
                position: "relative",
                display: "grid",
                placeItems: "center",
                flex: "0 0 auto",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  width: 118,
                  height: 118,
                  borderRadius: "50%",
                  background: "var(--sn-portal-ring)",
                  opacity: 0.78,
                },
              }}
            >
              <AssistantAvatar name="Assistant" variant="dragon" mood="coach" size={92} active />
            </Box>
            <Stack spacing={1}>
              <Typography variant="overline" sx={{ color: "var(--sn-accent)", fontWeight: 900 }}>
                Smart Nutrition
              </Typography>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 950 }}>
                {copy.title}
              </Typography>
              <Typography sx={{ color: "var(--sn-on-companion-muted)", lineHeight: 1.7 }}>
                {copy.body}
              </Typography>
            </Stack>
          </Stack>

          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              border: "1px solid var(--sn-border-soft)",
              backgroundColor: "var(--sn-surface-glass)",
            }}
          >
            <Typography sx={{ fontWeight: 900, mb: 1 }}>{copy.companion}</Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {copy.chips.map((chip) => (
                <Chip
                  key={chip}
                  label={chip}
                  size="small"
                  sx={{
                    border: "1px solid var(--sn-border-soft)",
                    backgroundColor: "var(--sn-surface-elevated)",
                    color: "var(--sn-text-primary)",
                    fontWeight: 850,
                  }}
                />
              ))}
            </Stack>
          </Box>

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
