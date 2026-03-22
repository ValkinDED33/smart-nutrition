import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { selectMealItems } from "./selectors";
import { useLanguage } from "../../shared/language";
import {
  addDays,
  formatLocalDateKey,
  getLocalDateKey,
} from "../../shared/lib/date";

export const WeeklyInsights = () => {
  const items = useSelector(selectMealItems);
  const { language, t } = useLanguage();

  const days = useMemo(() => {
    const today = new Date();

    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(today, -(6 - index));
      const key = getLocalDateKey(date);
      const entries = items.filter((item) => getLocalDateKey(item.eatenAt) === key);
      const totals = entries.reduce(
        (accumulator, item) => {
          const factor = item.quantity / 100;
          accumulator.calories += item.product.nutrients.calories * factor;
          accumulator.protein += item.product.nutrients.protein * factor;
          return accumulator;
        },
        { calories: 0, protein: 0 }
      );

      return {
        key,
        label: formatLocalDateKey(key, language, {
          weekday: "short",
          day: "numeric",
        }),
        ...totals,
      };
    });
  }, [items, language]);

  const totalWeekCalories = days.reduce((sum, day) => sum + day.calories, 0);
  const totalWeekProtein = days.reduce((sum, day) => sum + day.protein, 0);
  const bestDay = [...days].sort((a, b) => b.calories - a.calories)[0];
  const maxCalories = Math.max(...days.map((day) => day.calories), 1);

  if (totalWeekCalories === 0) {
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
          {t("weekly.title")}
        </Typography>
        <Typography color="text.secondary">{t("weekly.empty")}</Typography>
      </Paper>
    );
  }

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
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {t("weekly.title")}
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
            <Typography color="text.secondary">{t("weekly.average")}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {(totalWeekCalories / 7).toFixed(0)} {t("common.kcal")}
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
            <Typography color="text.secondary">{t("weekly.protein")}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {(totalWeekProtein / 7).toFixed(1)} {t("common.g")}
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
            <Typography color="text.secondary">{t("weekly.bestDay")}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {bestDay?.label} - {bestDay?.calories.toFixed(0)} {t("common.kcal")}
            </Typography>
          </Paper>
        </Box>

        <Stack spacing={1}>
          {days.map((day) => (
            <Stack key={day.key} direction="row" spacing={1.5} alignItems="center">
              <Typography sx={{ width: 74, fontWeight: 700 }}>{day.label}</Typography>
              <Box
                sx={{
                  flex: 1,
                  height: 12,
                  borderRadius: 999,
                  backgroundColor: "rgba(15, 23, 42, 0.08)",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: `${(day.calories / maxCalories) * 100}%`,
                    height: "100%",
                    borderRadius: 999,
                    background:
                      "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
                  }}
                />
              </Box>
              <Typography sx={{ width: 84, textAlign: "right" }}>
                {day.calories.toFixed(0)} {t("common.kcal")}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
};
