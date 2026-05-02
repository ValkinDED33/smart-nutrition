import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import type { RootState } from "../../app/store";
import { useLanguage } from "../../shared/language";
import {
  calculateBmi,
  detectWeightPlateau,
  getBmiStatus,
} from "../../shared/lib/bodyMetrics";
import { formatLocalDateKey, getLocalDateKey } from "../../shared/lib/date";

const weightTrendCopy = {
  uk: {
    title: "Історія ваги",
    subtitle: "Останні check-in у простому графіку для швидкого контролю.",
    empty: "Запишіть вагу кілька разів, щоб побудувати графік.",
    latest: "Остання",
    totalDelta: "Зміна всього",
    recentDelta: "Остання зміна",
    checkIns: "Записи",
    bmi: "BMI",
    plateau: "Plateau",
    underweight: "Нижче норми",
    normal: "Норма",
    overweight: "Вище норми",
    obesity: "Ожиріння",
    plateauHint: (weeks: number) => `Вага майже не змінюється ${weeks} тиж.`,
  },
  pl: {
    title: "Historia wagi",
    subtitle: "Ostatnie check-iny pokazane jako prosty wykres.",
    empty: "Zapisz wagę kilka razy, aby zbudować wykres.",
    latest: "Ostatnia",
    totalDelta: "Zmiana łącznie",
    recentDelta: "Ostatnia zmiana",
    checkIns: "Zapisy",
    bmi: "BMI",
    plateau: "Plateau",
    underweight: "Poniżej normy",
    normal: "Norma",
    overweight: "Powyżej normy",
    obesity: "Otyłość",
    plateauHint: (weeks: number) => `Waga jest prawie płaska od ${weeks} tyg.`,
  },
} as const;

export const WeightTrendCard = () => {
  const { weightHistory } = useSelector((state: RootState) => state.profile);
  const user = useSelector((state: RootState) => state.auth.user);
  const { language } = useLanguage();
  const copy = weightTrendCopy[language];

  const entries = useMemo(() => {
    return weightHistory.slice(-8).map((entry) => {
      const dateKey = getLocalDateKey(entry.date);

      return {
        ...entry,
        dateKey,
        label: formatLocalDateKey(dateKey, language, {
          month: "short",
          day: "numeric",
        }),
      };
    });
  }, [language, weightHistory]);

  const weights = entries.map((entry) => entry.weight);
  const minWeight = weights.length > 0 ? Math.min(...weights) : 0;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
  const range = Math.max(maxWeight - minWeight, 1);
  const latestWeight = entries.at(-1)?.weight ?? 0;
  const totalDelta = entries.length > 1 ? latestWeight - (entries[0]?.weight ?? latestWeight) : 0;
  const recentAnchor = entries.length > 3 ? entries[entries.length - 4]?.weight ?? latestWeight : entries[0]?.weight ?? latestWeight;
  const recentDelta = latestWeight - recentAnchor;
  const bmi = calculateBmi(latestWeight || user?.weight || 0, user?.height || 0);
  const bmiStatus = getBmiStatus(bmi);
  const plateau = detectWeightPlateau(weightHistory);
  const bmiStatusLabel = copy[bmiStatus];

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 1,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={0.6}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

        {entries.length > 0 && (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Typography component="span" sx={{ fontWeight: 700 }}>
              {copy.latest}: {latestWeight.toFixed(1)} kg
            </Typography>
            <Typography component="span" color="text.secondary">
              {copy.totalDelta}: {totalDelta > 0 ? "+" : ""}{totalDelta.toFixed(1)} kg
            </Typography>
            <Typography component="span" color="text.secondary">
              {copy.recentDelta}: {recentDelta > 0 ? "+" : ""}{recentDelta.toFixed(1)} kg
            </Typography>
            <Typography component="span" color="text.secondary">
              {copy.checkIns}: {entries.length}
            </Typography>
            <Chip
              label={`${copy.bmi}: ${bmi.toFixed(1)} • ${bmiStatusLabel}`}
              size="small"
              color={bmiStatus === "normal" ? "success" : bmiStatus === "overweight" ? "warning" : "default"}
            />
            {plateau.hasPlateau && (
              <Chip
                label={`${copy.plateau}: ${copy.plateauHint(plateau.weeksStable || 2)}`}
                size="small"
                variant="outlined"
                color="warning"
              />
            )}
          </Stack>
        )}

        {entries.length < 2 ? (
          <Typography color="text.secondary">{copy.empty}</Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: `repeat(${entries.length}, minmax(0, 1fr))`,
              gap: 1.25,
              alignItems: "end",
              minHeight: 220,
            }}
          >
            {entries.map((entry) => {
              const barHeight = 40 + ((entry.weight - minWeight) / range) * 120;

              return (
                <Stack key={`${entry.date}-${entry.weight}`} spacing={0.8} alignItems="center">
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {entry.weight.toFixed(1)} kg
                  </Typography>
                  <Box
                    sx={{
                      width: "100%",
                      maxWidth: 42,
                      height: barHeight,
                      borderRadius: "18px 18px 6px 6px",
                      background:
                        "linear-gradient(180deg, rgba(15,118,110,0.92) 0%, rgba(101,163,13,0.92) 100%)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {entry.label}
                  </Typography>
                </Stack>
              );
            })}
          </Box>
        )}
      </Stack>
    </Paper>
  );
};
