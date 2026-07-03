import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import type { RootState } from "../../app/store";
import { useLanguage } from "../../shared/language";
import {
  calculateBmi,
  detectWeightPlateau,
  getBmiStatus,
} from "@domain/profile/bodyMetrics";
import { formatLocalDateKey, getLocalDateKey } from "../../shared/lib/date";
import { EmptyState } from "@shared/ui";

const weightTrendCopy = {
  uk: {
    title: "Історія ваги",
    subtitle: "Останні check-in у простому графіку для швидкого контролю.",
    empty: "Запишіть вагу кілька разів, щоб побудувати графік.",
    emptyHint: "Перші два check-in відкриють тренд, BMI і підказки про plateau.",
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
    emptyHint: "Pierwsze dwa check-iny odblokują trend, BMI i podpowiedzi plateau.",
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
  en: {
    title: "Weight history",
    subtitle: "Recent check-ins in a simple chart for quick review.",
    empty: "Log your weight a few times to build the chart.",
    emptyHint: "The first two check-ins unlock trend, BMI, and plateau hints.",
    latest: "Latest",
    totalDelta: "Total change",
    recentDelta: "Recent change",
    checkIns: "Entries",
    bmi: "BMI",
    plateau: "Plateau",
    underweight: "Underweight",
    normal: "Normal",
    overweight: "Overweight",
    obesity: "Obesity",
    plateauHint: (weeks: number) => `Weight has barely changed for ${weeks} weeks.`,
  },
} as const;

export const WeightTrendCard = () => {
  const { weightHistory } = useSelector((state: RootState) => state.profile);
  const user = useSelector((state: RootState) => state.auth.user);
  const { appLanguage } = useLanguage();
  const copy = weightTrendCopy[appLanguage];

  const entries = useMemo(() => {
    return weightHistory.slice(-8).map((entry) => {
      const dateKey = getLocalDateKey(entry.date);

      return {
        ...entry,
        dateKey,
        label: formatLocalDateKey(dateKey, appLanguage, {
          month: "short",
          day: "numeric",
        }),
      };
    });
  }, [appLanguage, weightHistory]);

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
  const chart = useMemo(() => {
    if (entries.length < 2) {
      return null;
    }

    const width = 640;
    const height = 240;
    const padding = {
      top: 20,
      right: 18,
      bottom: 36,
      left: 58,
    };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const minY = minWeight - range * 0.12;
    const maxY = maxWeight + range * 0.12;
    const ySpan = Math.max(maxY - minY, 1);
    const denominator = Math.max(entries.length - 1, 1);
    const points = entries.map((entry, index) => {
      const x = padding.left + (chartWidth * index) / denominator;
      const y = padding.top + chartHeight - ((entry.weight - minY) / ySpan) * chartHeight;

      return {
        ...entry,
        x,
        y,
      };
    });
    const linePath = points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
      .join(" ");
    const areaPath = [
      `M ${points[0]?.x.toFixed(1)} ${padding.top + chartHeight}`,
      linePath.replace(/^M /, "L "),
      `L ${points.at(-1)?.x.toFixed(1)} ${padding.top + chartHeight}`,
      "Z",
    ].join(" ");
    const yTicks = [maxY, minY + ySpan / 2, minY].map((value) => ({
      value,
      y: padding.top + chartHeight - ((value - minY) / ySpan) * chartHeight,
    }));

    return {
      width,
      height,
      padding,
      chartWidth,
      chartHeight,
      points,
      linePath,
      areaPath,
      yTicks,
    };
  }, [entries, maxWeight, minWeight, range]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        backgroundColor: "var(--sn-surface-glass)",
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={0.6}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
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
          <EmptyState title={copy.empty} description={copy.emptyHint} />
        ) : (
          <Box
            sx={{
              width: "100%",
              minWidth: 0,
              height: { xs: 220, sm: 240, md: 260 },
              minHeight: 220,
              overflow: "hidden",
            }}
          >
            {chart ? (
              <Box
                component="svg"
                role="img"
                aria-label={`${copy.title}: ${entries.length} ${copy.checkIns.toLowerCase()}`}
                viewBox={`0 0 ${chart.width} ${chart.height}`}
                preserveAspectRatio="none"
                sx={{ width: "100%", height: "100%", display: "block" }}
              >
                <defs>
                  <linearGradient id="weightTrendFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0f766e" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#65a30d" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                {chart.yTicks.map((tick) => (
                  <g key={tick.value.toFixed(2)}>
                    <line
                      x1={chart.padding.left}
                      x2={chart.padding.left + chart.chartWidth}
                      y1={tick.y}
                      y2={tick.y}
                      stroke="rgba(148,163,184,0.22)"
                      strokeWidth="1"
                    />
                    <text
                      x={chart.padding.left - 12}
                      y={tick.y + 4}
                      textAnchor="end"
                      fontSize="13"
                      fill="rgba(15,23,42,0.58)"
                    >
                      {tick.value.toFixed(1)}
                    </text>
                  </g>
                ))}
                <path d={chart.areaPath} fill="url(#weightTrendFill)" />
                <path
                  d={chart.linePath}
                  fill="none"
                  stroke="#0f766e"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3.5"
                />
                {chart.points.map((point) => (
                  <g key={`${point.date}-${point.weight}`}>
                    <title>{`${point.label}: ${point.weight.toFixed(1)} kg`}</title>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="4.5"
                      fill="#ffffff"
                      stroke="#0f766e"
                      strokeWidth="2.5"
                    />
                    <text
                      x={point.x}
                      y={chart.height - 9}
                      textAnchor="middle"
                      fontSize="13"
                      fill="rgba(15,23,42,0.58)"
                    >
                      {point.label}
                    </text>
                  </g>
                ))}
              </Box>
            ) : null}
          </Box>
        )}
      </Stack>
    </Paper>
  );
};
