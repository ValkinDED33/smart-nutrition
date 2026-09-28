import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { ArrowRight, Baby, HeartPulse, UsersRound } from "lucide-react";
import { useLanguage } from "@shared/language";
import type { AppLanguage } from "@shared/types/i18n";

const WOMEN_HEALTH_ROUTE = "/women-health";

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
    eyebrow: "Жiноче здоров'я",
    title: "Цикл, вагiтнiсть, пiсля пологiв i родина",
    body:
      "Повний центр винесено в окремий екран: тиждень i день вагiтностi, партнер, QR, запрошення email, пiдказки i безпечнi пояснення без довгої штори в профiлi.",
    open: "Вiдкрити центр",
    helper: "Один життєвий етап у профiлi, один cloud-контракт, без дублювання.",
    chips: ["цикл", "вагiтнiсть", "партнер", "пiсля пологiв"],
  },
  pl: {
    eyebrow: "Zdrowie kobiet",
    title: "Cykl, ciaza, polog i rodzina",
    body:
      "Pelne centrum jest na osobnym ekranie: tydzien i dzien ciazy, partner, QR, zaproszenie email, wskazowki i bezpieczne wyjasnienia bez dlugiego panelu w profilu.",
    open: "Otworz centrum",
    helper: "Jeden etap zycia w profilu, jeden kontrakt cloud, bez duplikowania.",
    chips: ["cykl", "ciaza", "partner", "polog"],
  },
  en: {
    eyebrow: "Women's health",
    title: "Cycle, pregnancy, postpartum, and family",
    body:
      "The full center now lives on its own screen: pregnancy week and day, partner, QR, email invite, guidance, and safe explanations without a long profile drawer.",
    open: "Open center",
    helper: "One life stage in profile, one cloud contract, no duplicate system.",
    chips: ["cycle", "pregnancy", "partner", "postpartum"],
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

export const WomenHealthEntryCard = () => {
  const { language } = useLanguage();
  const copy = getCopy(language);

  return (
    <Paper
      className="sn-premium-panel"
      data-women-health-entry-card="true"
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
          inset: "auto -12% -62% 42%",
          height: 230,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(236,72,153,0.22), rgba(20,184,166,0.08) 46%, transparent 70%)",
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
              <HeartPulse size={22} />
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
            to={WOMEN_HEALTH_ROUTE}
            variant="contained"
            size="large"
            startIcon={<Baby size={18} />}
            endIcon={<ArrowRight size={18} />}
            sx={{ justifyContent: "center" }}
          >
            {copy.open}
          </Button>
          <Stack direction="row" spacing={0.8} alignItems="center">
            <UsersRound size={16} color="var(--sn-accent)" />
            <Typography color="text.secondary" sx={{ fontSize: 13, lineHeight: 1.35 }}>
              {copy.helper}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default WomenHealthEntryCard;
