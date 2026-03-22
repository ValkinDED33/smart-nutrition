import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { selectMealItems } from "./selectors";
import { useLanguage } from "../../shared/language";

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const WeeklyInsights = () => {
  const items = useSelector(selectMealItems);
  const { language } = useLanguage();

  const text =
    language === "pl"
      ? {
          title: "Analityka 7 dni",
          average: "Średnio / dzień",
          bestDay: "Najmocniejszy dzień",
          protein: "Białko / dzień",
          empty: "Za mało danych do analityki tygodniowej.",
        }
      : {
          title: "Аналітика за 7 днів",
          average: "Середньо / день",
          bestDay: "Найсильніший день",
          protein: "Білок / день",
          empty: "Поки замало даних для тижневої аналітики.",
        };

  const days = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      const entries = items.filter((item) => item.eatenAt.slice(0, 10) === key);
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
        label: date.toLocaleDateString(language === "pl" ? "pl-PL" : "uk-UA", {
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
          {text.title}
        </Typography>
        <Typography color="text.secondary">{text.empty}</Typography>
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
          {text.title}
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
            <Typography color="text.secondary">{text.average}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {(totalWeekCalories / 7).toFixed(0)} kcal
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
            <Typography color="text.secondary">{text.protein}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {(totalWeekProtein / 7).toFixed(1)} g
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
            <Typography color="text.secondary">{text.bestDay}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {bestDay?.label} - {bestDay?.calories.toFixed(0)} kcal
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
                {day.calories.toFixed(0)} kcal
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
};
