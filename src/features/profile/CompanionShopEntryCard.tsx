import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { Bot, Sparkles, Store } from "lucide-react";
import { useLanguage } from "@shared/language";
import type { AppLanguage } from "@shared/types/i18n";

const SHOP_ROUTE = "/assistant/shop";

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
    eyebrow: "Магазин помічника",
    title: "Образи, скіни і стиль помічника",
    body:
      "Магазин винесено в окремий екран: без довгої штори всередині профілю, але з тим самим cloud-sync і єдиним помічником.",
    open: "Відкрити магазин",
    helper: "Один магазин, одна колекція, без дублювання системи.",
    chips: ["безкоштовні роботи", "колекційні образи", "живий preview"],
  },
  pl: {
    eyebrow: "Sklep asystenta",
    title: "Wygląd, skórki i styl asystenta",
    body:
      "Sklep działa na osobnym ekranie: bez długiego panelu w profilu, ale z tym samym cloud-sync i jednym asystentem.",
    open: "Otwórz sklep",
    helper: "Jeden sklep, jedna kolekcja, bez duplikowania systemu.",
    chips: ["darmowe roboty", "kolekcja wyglądów", "żywy podgląd"],
  },
  en: {
    eyebrow: "Assistant shop",
    title: "Assistant looks, skins, and style",
    body:
      "The shop now lives on its own screen: no long drawer inside profile, with the same cloud sync and one assistant system.",
    open: "Open shop",
    helper: "One shop, one collection, no duplicate system.",
    chips: ["free robots", "collectible looks", "live preview"],
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

export const CompanionShopEntryCard = () => {
  const { language } = useLanguage();
  const copy = getCopy(language);

  return (
    <Paper
      className="sn-premium-panel"
      data-companion-shop-entry="true"
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
          inset: "auto -14% -58% 38%",
          height: 220,
          borderRadius: "50%",
          background: "var(--sn-portal-ring)",
          opacity: 0.52,
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
              <Bot size={22} />
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
            <Typography color="text.secondary" sx={{ maxWidth: 760, lineHeight: 1.55 }}>
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
        <Stack spacing={1} sx={{ minWidth: { xs: "100%", md: 260 } }}>
          <Button
            component={RouterLink}
            to={SHOP_ROUTE}
            variant="contained"
            size="large"
            startIcon={<Store size={18} />}
            sx={{ justifyContent: "center" }}
          >
            {copy.open}
          </Button>
          <Stack direction="row" spacing={0.8} alignItems="center">
            <Sparkles size={16} color="var(--sn-accent)" />
            <Typography color="text.secondary" sx={{ fontSize: 13, lineHeight: 1.35 }}>
              {copy.helper}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default CompanionShopEntryCard;
