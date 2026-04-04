import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import type { RootState } from "../../app/store";
import { selectMealItems } from "./selectors";
import { addDays, formatLocalDateKey, getLocalDateKey } from "../../shared/lib/date";
import { useLanguage } from "../../shared/language";

const monthlyCopy = {
  uk: {
    title: "30-day analytics",
    subtitle: "A compact monthly view with adherence and calorie deviations.",
    averageCalories: "Average calories",
    averageProtein: "Average protein",
    adherence: "Adherence",
    biggestDeviation: "Biggest deviation",
    noData: "Add more days to unlock the monthly view.",
  },
  pl: {
    title: "30-day analytics",
    subtitle: "A compact monthly view with adherence and calorie deviations.",
    averageCalories: "Average calories",
    averageProtein: "Average protein",
    adherence: "Adherence",
    biggestDeviation: "Biggest deviation",
    noData: "Add more days to unlock the monthly view.",
  },
} as const;

const getCellColor = (ratio: number) => {
  if (ratio === 0) return "rgba(148, 163, 184, 0.12)";
  if (ratio < 0.9) return "rgba(14, 165, 233, 0.2)";
  if (ratio <= 1.1) return "rgba(34, 197, 94, 0.24)";
  if (ratio <= 1.25) return "rgba(250, 204, 21, 0.28)";
  return "rgba(239, 68, 68, 0.28)";
};

export const MonthlyAnalyticsCard = () => {
  const items = useSelector(selectMealItems);
  const dailyCalories = useSelector((state: RootState) => state.profile.dailyCalories);
  const { language, t } = useLanguage();
  const copy = monthlyCopy[language];

  const days = useMemo(() => {
    const today = new Date();

    return Array.from({ length: 30 }, (_, index) => {
      const date = addDays(today, -(29 - index));
      const key = getLocalDateKey(date);
      const entries = items.filter((item) => getLocalDateKey(item.eatenAt) === key);
      const calories = entries.reduce(
        (sum, item) => sum + (item.product.nutrients.calories * item.quantity) / 100,
        0
      );
      const protein = entries.reduce(
        (sum, item) => sum + (item.product.nutrients.protein * item.quantity) / 100,
        0
      );

      return {
        key,
        label: formatLocalDateKey(key, language, { day: "numeric", month: "short" }),
        calories,
        protein,
        ratio: dailyCalories > 0 ? calories / dailyCalories : 0,
      };
    });
  }, [dailyCalories, items, language]);

  const activeDays = days.filter((day) => day.calories > 0);

  if (activeDays.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 6,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.86)",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
          {copy.title}
        </Typography>
        <Typography color="text.secondary">{copy.noData}</Typography>
      </Paper>
    );
  }

  const averageCalories =
    activeDays.reduce((sum, day) => sum + day.calories, 0) / activeDays.length;
  const averageProtein =
    activeDays.reduce((sum, day) => sum + day.protein, 0) / activeDays.length;
  const adherenceDays = activeDays.filter(
    (day) => day.ratio >= 0.9 && day.ratio <= 1.1
  ).length;
  const biggestDeviation = [...activeDays].sort(
    (left, right) =>
      Math.abs(right.calories - dailyCalories) - Math.abs(left.calories - dailyCalories)
  )[0] ?? activeDays[0]!;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 6,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={2.5}>
        <Stack spacing={0.6}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
            gap: 1.5,
          }}
        >
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
            <Typography color="text.secondary">{copy.averageCalories}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {averageCalories.toFixed(0)} {t("common.kcal")}
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
            <Typography color="text.secondary">{copy.averageProtein}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {averageProtein.toFixed(1)} {t("common.g")}
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
            <Typography color="text.secondary">{copy.adherence}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {adherenceDays}/{activeDays.length}
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
            <Typography color="text.secondary">{copy.biggestDeviation}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              {biggestDeviation.label}
            </Typography>
            <Typography color="text.secondary">
              {(biggestDeviation.calories - dailyCalories).toFixed(0)} {t("common.kcal")}
            </Typography>
          </Paper>
        </Box>

        <Stack spacing={1}>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label="Blue: under target" size="small" />
            <Chip label="Green: on target" size="small" />
            <Chip label="Yellow/Red: over target" size="small" />
          </Stack>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(10, minmax(0, 1fr))",
              gap: 1,
            }}
          >
            {days.map((day) => (
              <Box
                key={day.key}
                sx={{
                  minHeight: 46,
                  borderRadius: 3,
                  border: "1px solid rgba(15, 23, 42, 0.08)",
                  backgroundColor: getCellColor(day.ratio),
                  p: 0.75,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {day.key.slice(-2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {day.calories > 0 ? day.calories.toFixed(0) : "-"}
                </Typography>
              </Box>
            ))}
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
};
