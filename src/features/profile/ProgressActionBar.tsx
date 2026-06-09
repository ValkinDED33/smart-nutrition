import copy from "copy-to-clipboard";
import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import screenfull from "screenfull";
import { toast } from "sonner";
import type { RootState } from "../../app/store";
import { selectTodayMealTotalNutrients } from "../meal/selectors";
import { useLanguage } from "../../shared/language";

const pulse = keyframes`
  0% { transform: scale(0.86); opacity: 0.52; }
  50% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.86); opacity: 0.52; }
`;

const ToolbarPanel = styled(Paper)`
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.88);
  padding: 16px;
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
    title: "Швидкі дії прогресу",
    subtitle: "Скопіюйте короткий підсумок або відкрийте аналітику на весь екран.",
    copy: "Копіювати звіт",
    fullscreen: "На весь екран",
    copied: "Звіт скопійовано.",
    fullscreenUnsupported: "Fullscreen недоступний у цьому браузері.",
    calories: "Калорії",
    water: "Вода",
    weight: "Вага",
    reportTitle: "Smart Nutrition progress",
  },
  pl: {
    title: "Szybkie akcje progresu",
    subtitle: "Skopiuj krótkie podsumowanie albo otwórz analitykę pełnoekranowo.",
    copy: "Kopiuj raport",
    fullscreen: "Pełny ekran",
    copied: "Raport skopiowany.",
    fullscreenUnsupported: "Fullscreen jest niedostępny w tej przeglądarce.",
    calories: "Kalorie",
    water: "Woda",
    weight: "Waga",
    reportTitle: "Smart Nutrition progress",
  },
  en: {
    title: "Quick progress actions",
    subtitle: "Copy a short summary or open analytics in full screen.",
    copy: "Copy report",
    fullscreen: "Full screen",
    copied: "Report copied.",
    fullscreenUnsupported: "Fullscreen is not available in this browser.",
    calories: "Calories",
    water: "Water",
    weight: "Weight",
    reportTitle: "Smart Nutrition progress",
  },
} as const;

export const ProgressActionBar = () => {
  const profile = useSelector((state: RootState) => state.profile);
  const water = useSelector((state: RootState) => state.water);
  const authWeight = useSelector((state: RootState) => state.auth.user?.weight);
  const totals = useSelector(selectTodayMealTotalNutrients);
  const { appLanguage, t } = useLanguage();
  const copyText = progressActionCopy[appLanguage];
  const latestWeight = profile.weightHistory.at(-1)?.weight ?? authWeight ?? 0;
  const waterProgress = water.dailyWaterGoal
    ? Math.round((water.consumedMl / water.dailyWaterGoal) * 100)
    : 0;

  const report = [
    copyText.reportTitle,
    `${copyText.calories}: ${Math.round(totals.calories)} / ${profile.dailyCalories} ${t("common.kcal")}`,
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
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
      >
        <Stack spacing={0.6}>
          <Stack direction="row" spacing={1} alignItems="center">
            <StatusDot aria-hidden />
            <Typography sx={{ fontWeight: 900 }}>{copyText.title}</Typography>
          </Stack>
          <Typography color="text.secondary">{copyText.subtitle}</Typography>
        </Stack>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip
            label={`${copyText.water}: ${waterProgress}%`}
            color={waterProgress >= 100 ? "success" : "default"}
            variant="outlined"
          />
          <Button variant="outlined" onClick={handleCopy}>
            {copyText.copy}
          </Button>
          <Button variant="contained" onClick={handleFullscreen}>
            {copyText.fullscreen}
          </Button>
        </Stack>
      </Stack>
    </ToolbarPanel>
  );
};
