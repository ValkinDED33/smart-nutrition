import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
          <Typography color="text.secondary">{copy.empty}</Typography>
        ) : (
          <Box
            sx={{
              width: "100%",
              height: 260,
            }}
          >
            <ResponsiveContainer>
              <AreaChart
                data={entries}
                margin={{ top: 10, right: 12, bottom: 0, left: -18 }}
              >
                <defs>
                  <linearGradient id="weightTrendFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0f766e" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#65a30d" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.22)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis
                  width={56}
                  domain={[minWeight - range * 0.12, maxWeight + range * 0.12]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) => value.toFixed(1)}
                />
                <Tooltip
                  formatter={(value) => {
                    const numericValue =
                      typeof value === "number" ? value : Number(value ?? 0);

                    return [`${numericValue.toFixed(1)} kg`, copy.latest];
                  }}
                  labelStyle={{ color: "#0f172a", fontWeight: 800 }}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#0f766e"
                  strokeWidth={3}
                  fill="url(#weightTrendFill)"
                  dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};
