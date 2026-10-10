import copy from "copy-to-clipboard";
import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { Copy, Maximize2 } from "lucide-react";
import { useSelector } from "react-redux";
import screenfull from "screenfull";
import { toast } from "sonner";
import type { RootState } from "../../app/store";
import { selectTodayMealTotalNutrients } from "../meal/selectors";
import { useLanguage } from "../../shared/language";
import type { AppLanguage } from "../../shared/types/i18n";

const COMMON_KCAL_KEY = "common.kcal";

const pulse = keyframes`
  0% { transform: scale(0.86); opacity: 0.52; }
  50% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.86); opacity: 0.52; }
`;

const ToolbarPanel = styled(Paper)`
  border: 1px solid var(--sn-border-soft);
  border-radius: 8px;
  background: var(--sn-surface-glass);
  box-shadow: var(--sn-shadow-card);
  padding: 10px;

  @media (min-width: 900px) {
    padding: 16px;
  }
`;

const StatusDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #14b8a6;
  display: inline-block;
  animation: ${pulse} 1.8s ease-in-out infinite;
`;

const progressActionCopy = {
  uk: {
    reportTitle: "Прогрес Smart Nutrition",
    title: "Швидкі дії прогресу",
    subtitle: "Скопіюйте короткий підсумок або відкрийте аналітику на весь екран.",
    copy: "Копіювати звіт",
    copyShort: "Копія",
    fullscreen: "На весь екран",
    fullscreenShort: "Екран",
    copied: "Звіт скопійовано.",
    fullscreenUnsupported: "Fullscreen недоступний у цьому браузері.",
    calories: "Калорії",
    water: "Вода",
    weight: "Вага",
  },
  pl: {
    reportTitle: "Postęp Smart Nutrition",
    title: "Szybkie akcje progresu",
    subtitle: "Skopiuj krótkie podsumowanie albo otwórz analitykę pełnoekranowo.",
    copy: "Kopiuj raport",
    copyShort: "Kopia",
    fullscreen: "Pełny ekran",
    fullscreenShort: "Ekran",
    copied: "Raport skopiowany.",
    fullscreenUnsupported: "Fullscreen jest niedostępny w tej przeglądarce.",
    calories: "Kalorie",
    water: "Woda",
    weight: "Waga",
  },
  en: {
    reportTitle: "Smart Nutrition progress",
    title: "Quick progress actions",
    subtitle: "Copy a short summary or open analytics in full screen.",
    copy: "Copy report",
    copyShort: "Copy",
    fullscreen: "Full screen",
    fullscreenShort: "Screen",
    copied: "Report copied.",
    fullscreenUnsupported: "Fullscreen is not available in this browser.",
    calories: "Calories",
    water: "Water",
    weight: "Weight",
  },
} as const;

type ProgressActionCopy = (typeof progressActionCopy)[AppLanguage];

const getProgressActionCopy = (language: AppLanguage): ProgressActionCopy => {
  switch (language) {
    case "pl":
      return progressActionCopy.pl;
    case "en":
      return progressActionCopy.en;
    case "uk":
    default:
      return progressActionCopy.uk;
  }
};

export const ProgressActionBar = () => {
  const profile = useSelector((state: RootState) => state.profile);
  const water = useSelector((state: RootState) => state.water);
  const authWeight = useSelector((state: RootState) => state.auth.user?.weight);
  const totals = useSelector(selectTodayMealTotalNutrients);
  const { appLanguage, t } = useLanguage();
  const copyText = getProgressActionCopy(appLanguage);
  const latestWeight = profile.weightHistory.at(-1)?.weight ?? authWeight ?? 0;
  const waterProgress = water.dailyWaterGoal
    ? Math.round((water.consumedMl / water.dailyWaterGoal) * 100)
    : 0;

  const report = [
    copyText.reportTitle,
    `${copyText.calories}: ${Math.round(totals.calories)} / ${profile.dailyCalories} ${t(COMMON_KCAL_KEY)}`,
    `${copyText.water}: ${water.consumedMl} / ${water.dailyWaterGoal} ml (${waterProgress}%)`,
    `${copyText.weight}: ${latestWeight.toFixed(1)} ${t("common.kg")}`,
  ].join("\n");

  const handleCopy = () => {
    copy(report);
    toast.success(copyText.copied);
  };

  const handleFullscreen = () => {
    if (!screenfull.isEnabled) {
      toast.error(copyText.fullscreenUnsupported);
      return;
    }

    void screenfull.toggle(document.documentElement);
  };

  return (
    <ToolbarPanel elevation={0}>
      <Stack
        direction={{ xs: "row", md: "row" }}
        spacing={{ xs: 0.85, md: 1.5 }}
        justifyContent="space-between"
        alignItems="center"
      >
        <Stack spacing={{ xs: 0.15, md: 0.6 }} sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <StatusDot aria-hidden />
            <Typography sx={{ fontWeight: 900, fontSize: { xs: 13.5, md: 16 } }} noWrap>
              {copyText.title}
            </Typography>
          </Stack>
          <Typography
            color="text.secondary"
            sx={{ display: { xs: "none", md: "block" } }}
          >
            {copyText.subtitle}
          </Typography>
        </Stack>
        <Stack
          direction="row"
          spacing={{ xs: 0.5, md: 1 }}
          useFlexGap
          flexWrap="nowrap"
          sx={{ flexShrink: 0 }}
        >
          <Chip
            label={`${copyText.water}: ${waterProgress}%`}
            color={waterProgress >= 100 ? "success" : "default"}
            variant="outlined"
            size="small"
          />
          <Button variant="outlined" onClick={handleCopy} size="small" startIcon={<Copy size={15} />}>
            <Typography component="span" sx={{ display: { xs: "none", sm: "inline" }, fontWeight: 900 }}>
              {copyText.copy}
            </Typography>
            <Typography component="span" sx={{ display: { xs: "inline", sm: "none" }, fontWeight: 900 }}>
              {copyText.copyShort}
            </Typography>
          </Button>
          <Button variant="contained" onClick={handleFullscreen} size="small" startIcon={<Maximize2 size={15} />}>
            <Typography component="span" sx={{ display: { xs: "none", sm: "inline" }, fontWeight: 900 }}>
              {copyText.fullscreen}
            </Typography>
            <Typography component="span" sx={{ display: { xs: "inline", sm: "none" }, fontWeight: 900 }}>
              {copyText.fullscreenShort}
            </Typography>
          </Button>
        </Stack>
      </Stack>
    </ToolbarPanel>
  );
};
