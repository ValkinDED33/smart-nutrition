import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { ArrowRight, BellRing, CalendarCheck, MessageCircle } from "lucide-react";
import { useLanguage } from "@shared/language";
import type { AppLanguage } from "@shared/types/i18n";

const REMINDERS_ROUTE = "/reminders";

const copyByLanguage: Record<
  AppLanguage,
  {
    eyebrow: string;
    title: string;
    body: string;
    open: string;
    helper: string;
    chips: string[];
  }
> = {
  uk: {
    eyebrow: "Нагадування i задачi",
    title: "Подiї, таблетки, вода, тиск i Telegram",
    body:
      "Повний органайзер винесено в окремий екран: задачi, гнучкi нагадування, лiки, днi народження i Telegram-доставка без довгої секцiї в налаштуваннях.",
    open: "Вiдкрити органайзер",
    helper: "Один центр нагадувань для застосунку i Telegram.",
    chips: ["лiки", "тиск", "Telegram", "днi народження"],
  },
  pl: {
    eyebrow: "Przypomnienia i zadania",
    title: "Wydarzenia, tabletki, woda, cisnienie i Telegram",
    body:
      "Pelny organizer jest na osobnym ekranie: zadania, elastyczne przypomnienia, leki, urodziny i dostawa Telegram bez dlugiej sekcji w ustawieniach.",
    open: "Otworz organizer",
    helper: "Jedno centrum przypomnien dla aplikacji i Telegrama.",
    chips: ["leki", "cisnienie", "Telegram", "urodziny"],
  },
  en: {
    eyebrow: "Reminders and tasks",
    title: "Events, pills, water, pressure, and Telegram",
    body:
      "The full organizer now lives on its own screen: tasks, flexible reminders, medication, birthdays, and Telegram delivery without a long settings section.",
    open: "Open organizer",
    helper: "One reminder center for the app and Telegram.",
    chips: ["medication", "pressure", "Telegram", "birthdays"],
  },
};

const getCopy = (language: AppLanguage) => {
  switch (language) {
    case "uk":
      return copyByLanguage.uk;
    case "pl":
      return copyByLanguage.pl;
    case "en":
    default:
      return copyByLanguage.en;
  }
};

export const ReminderCenterEntryCard = () => {
  const { language } = useLanguage();
  const copy = getCopy(language);

  return (
    <Paper
      className="sn-premium-panel"
      data-reminder-center-entry="true"
      variant="outlined"
      sx={{
        position: "relative",
        overflow: "hidden",
        p: { xs: 2, md: 2.6 },
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: "auto -18% -68% 40%",
          height: 240,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(14,165,233,0.2), rgba(132,204,22,0.08) 46%, transparent 72%)",
          pointerEvents: "none",
        },
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        sx={{ position: "relative", zIndex: 1 }}
      >
        <Stack spacing={1.25} sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 1,
                display: "grid",
                placeItems: "center",
                color: "var(--sn-accent)",
                backgroundColor: "var(--sn-accent-soft)",
              }}
            >
              <BellRing size={22} />
            </Box>
            <Typography
              sx={{
                color: "var(--sn-accent)",
                fontSize: 12,
                fontWeight: 950,
                textTransform: "uppercase",
                letterSpacing: 0,
              }}
            >
              {copy.eyebrow}
            </Typography>
          </Stack>
          <Stack spacing={0.75}>
            <Typography component="h2" variant="h5" sx={{ fontWeight: 950 }}>
              {copy.title}
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 780, lineHeight: 1.55 }}>
              {copy.body}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {copy.chips.map((chip) => (
              <Chip
                key={chip}
                label={chip}
                size="small"
                sx={{ fontWeight: 850, backgroundColor: "var(--sn-accent-soft)" }}
              />
            ))}
          </Stack>
        </Stack>
        <Stack spacing={1} sx={{ minWidth: { xs: "100%", md: 270 } }}>
          <Button
            component={RouterLink}
            to={REMINDERS_ROUTE}
            variant="contained"
            size="large"
            startIcon={<CalendarCheck size={18} />}
            endIcon={<ArrowRight size={18} />}
            sx={{ justifyContent: "center" }}
          >
            {copy.open}
          </Button>
          <Stack direction="row" spacing={0.8} alignItems="center">
            <MessageCircle size={16} color="var(--sn-accent)" />
            <Typography color="text.secondary" sx={{ fontSize: 13, lineHeight: 1.35 }}>
              {copy.helper}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default ReminderCenterEntryCard;
