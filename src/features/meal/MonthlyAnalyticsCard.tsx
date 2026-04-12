import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Box, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import type { RootState } from "../../app/store";
import { selectMealItems } from "./selectors";
import { addDays, formatLocalDateKey, getLocalDateKey } from "../../shared/lib/date";
import { useLanguage } from "../../shared/language";
import { calculateMacroTargets } from "../../shared/lib/macroTargets";

const monthlyCopy = {
  uk: {
    title: "Аналітика за 30 днів",
    subtitle: "Відстежуйте дотримання цілі, відхилення калорій і баланс макросів за останній місяць.",
    averageCalories: "Середні калорії",
    averageProtein: "Середній білок",
    adherence: "Влучання в ціль",
    streak: "Серія логів",
    noData: "Додайте більше днів, щоб відкрити місячний огляд.",
    calendarLegendUnder: "Синій: нижче цілі",
    calendarLegendOn: "Зелений: у межах цілі",
    calendarLegendOver: "Жовтий/червоний: вище цілі",
    deviationTitle: "Найбільші відхилення",
    deviationSubtitle: "Найпомітніші профіцит і дефіцит допомагають пояснити тижневий тренд.",
    surplus: "Найбільший профіцит",
    deficit: "Найглибший дефіцит",
    noSurplus: "Поки немає дня вище цілі",
    noDeficit: "Поки немає дня нижче цілі",
    macroHeatmapTitle: "Теплова карта макросів",
    macroHeatmapSubtitle: "Останні дні з логами порівняно з вашими денними цілями по макросах.",
    protein: "Білок",
    fat: "Жири",
    carbs: "Вуглеводи",
    legendLow: "Нижче цілі",
    legendOn: "У межах цілі",
    legendHigh: "Вище цілі",
    dayLabel: "День",
    days: "дні",
  },
  pl: {
    title: "Analityka 30 dni",
    subtitle: "Sprawdź trzymanie celu, odchylenia kalorii i balans makroskładników z ostatniego miesiąca.",
    averageCalories: "Średnie kalorie",
    averageProtein: "Średnie białko",
    adherence: "Trzymanie celu",
    streak: "Seria logowania",
    noData: "Dodaj więcej dni, aby odblokować widok miesięczny.",
    calendarLegendUnder: "Niebieski: poniżej celu",
    calendarLegendOn: "Zielony: w celu",
    calendarLegendOver: "Żółty/czerwony: powyżej celu",
    deviationTitle: "Największe odchylenia",
    deviationSubtitle: "Najmocniejsze nadwyżki i deficyty pomagają wyjaśnić tygodniowy trend.",
    surplus: "Największa nadwyżka",
    deficit: "Najgłębszy deficyt",
    noSurplus: "Brak dnia powyżej celu",
    noDeficit: "Brak dnia poniżej celu",
    macroHeatmapTitle: "Mapa cieplna makro",
    macroHeatmapSubtitle: "Ostatnie zapisane dni porównane z Twoimi dziennymi celami makro.",
    protein: "Białko",
    fat: "Tłuszcz",
    carbs: "Węglowodany",
    legendLow: "Poniżej celu",
    legendOn: "W celu",
    legendHigh: "Powyżej celu",
    dayLabel: "Dzień",
    days: "dni",
  },
} as const;

const getCalorieColor = (ratio: number) => {
  if (ratio === 0) return "rgba(148, 163, 184, 0.12)";
  if (ratio < 0.9) return "rgba(14, 165, 233, 0.2)";
  if (ratio <= 1.1) return "rgba(34, 197, 94, 0.24)";
  if (ratio <= 1.25) return "rgba(250, 204, 21, 0.28)";
  return "rgba(239, 68, 68, 0.28)";
};

const getMacroColor = (ratio: number) => {
  if (ratio === 0) return "rgba(148, 163, 184, 0.12)";
  if (ratio < 0.8) return "rgba(14, 165, 233, 0.18)";
  if (ratio <= 1.15) return "rgba(34, 197, 94, 0.2)";
  return "rgba(245, 158, 11, 0.22)";
};

const formatDeviation = (value: number, unit: string) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(0)} ${unit}`;

export const MonthlyAnalyticsCard = () => {
  const items = useSelector(selectMealItems);
  const profile = useSelector((state: RootState) => state.profile);
  const user = useSelector((state: RootState) => state.auth.user);
  const { language, t } = useLanguage();
  const copy = monthlyCopy[language];

  const macroTargets = useMemo(() => {
    if (!user) {
      return { protein: 0, fat: 0, carbs: 0 };
    }

    return calculateMacroTargets({
      calories: profile.dailyCalories,
      weight: user.weight,
      goal: profile.goal,
      dietStyle: profile.dietStyle,
    });
  }, [profile.dailyCalories, profile.dietStyle, profile.goal, user]);

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
      const fat = entries.reduce(
        (sum, item) => sum + (item.product.nutrients.fat * item.quantity) / 100,
        0
      );
      const carbs = entries.reduce(
        (sum, item) => sum + (item.product.nutrients.carbs * item.quantity) / 100,
        0
      );

      return {
        key,
        label: formatLocalDateKey(key, language, { day: "numeric", month: "short" }),
        calories,
        protein,
        fat,
        carbs,
        calorieRatio: profile.dailyCalories > 0 ? calories / profile.dailyCalories : 0,
        proteinRatio: macroTargets.protein > 0 ? protein / macroTargets.protein : 0,
        fatRatio: macroTargets.fat > 0 ? fat / macroTargets.fat : 0,
        carbsRatio: macroTargets.carbs > 0 ? carbs / macroTargets.carbs : 0,
      };
    });
  }, [
    items,
    language,
    macroTargets.carbs,
    macroTargets.fat,
    macroTargets.protein,
    profile.dailyCalories,
  ]);

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
    (day) => day.calorieRatio >= 0.9 && day.calorieRatio <= 1.1
  ).length;
  const adherenceRate = activeDays.length > 0 ? (adherenceDays / activeDays.length) * 100 : 0;

  let loggingStreak = 0;
  for (const day of [...days].reverse()) {
    if (day.calories <= 0) {
      break;
    }
    loggingStreak += 1;
  }

  const strongestSurplus =
    [...activeDays]
      .filter((day) => day.calories > profile.dailyCalories)
      .sort((left, right) => right.calories - left.calories)[0] ?? null;
  const deepestDeficit =
    [...activeDays]
      .filter((day) => day.calories < profile.dailyCalories)
      .sort((left, right) => left.calories - right.calories)[0] ?? null;
  const recentMacroDays = activeDays.slice(-10).reverse();

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
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
            },
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
              {adherenceRate.toFixed(0)}%
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
            <Typography color="text.secondary">{copy.streak}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {loggingStreak} {copy.days}
            </Typography>
          </Paper>
        </Box>

        <Stack spacing={1}>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label={copy.calendarLegendUnder} size="small" />
            <Chip label={copy.calendarLegendOn} size="small" />
            <Chip label={copy.calendarLegendOver} size="small" />
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
                  backgroundColor: getCalorieColor(day.calorieRatio),
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

        <Divider />

        <Stack spacing={0.6}>
          <Typography sx={{ fontWeight: 800 }}>{copy.deviationTitle}</Typography>
          <Typography color="text.secondary">{copy.deviationSubtitle}</Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: 1.5,
          }}
        >
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
            <Typography color="text.secondary">{copy.surplus}</Typography>
            {strongestSurplus ? (
              <>
                <Typography sx={{ fontWeight: 800 }}>{strongestSurplus.label}</Typography>
                <Typography color="text.secondary">
                  {formatDeviation(
                    strongestSurplus.calories - profile.dailyCalories,
                    t("common.kcal")
                  )}
                </Typography>
              </>
            ) : (
              <Typography color="text.secondary">{copy.noSurplus}</Typography>
            )}
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
            <Typography color="text.secondary">{copy.deficit}</Typography>
            {deepestDeficit ? (
              <>
                <Typography sx={{ fontWeight: 800 }}>{deepestDeficit.label}</Typography>
                <Typography color="text.secondary">
                  {formatDeviation(
                    deepestDeficit.calories - profile.dailyCalories,
                    t("common.kcal")
                  )}
                </Typography>
              </>
            ) : (
              <Typography color="text.secondary">{copy.noDeficit}</Typography>
            )}
          </Paper>
        </Box>

        <Divider />

        <Stack spacing={1.2}>
          <Stack spacing={0.6}>
            <Typography sx={{ fontWeight: 800 }}>{copy.macroHeatmapTitle}</Typography>
            <Typography color="text.secondary">{copy.macroHeatmapSubtitle}</Typography>
          </Stack>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label={copy.legendLow} size="small" />
            <Chip label={copy.legendOn} size="small" />
            <Chip label={copy.legendHigh} size="small" />
          </Stack>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "minmax(72px, auto) repeat(3, minmax(0, 1fr))",
              gap: 1,
              alignItems: "stretch",
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              {copy.dayLabel}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              {copy.protein}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              {copy.fat}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              {copy.carbs}
            </Typography>

            {recentMacroDays.map((day) => (
              <Box key={day.key} sx={{ display: "contents" }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1,
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {day.label}
                  </Typography>
                </Paper>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1,
                    borderRadius: 3,
                    backgroundColor: getMacroColor(day.proteinRatio),
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {day.protein.toFixed(0)} {t("common.g")}
                  </Typography>
                </Paper>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1,
                    borderRadius: 3,
                    backgroundColor: getMacroColor(day.fatRatio),
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {day.fat.toFixed(0)} {t("common.g")}
                  </Typography>
                </Paper>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1,
                    borderRadius: 3,
                    backgroundColor: getMacroColor(day.carbsRatio),
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {day.carbs.toFixed(0)} {t("common.g")}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
};
