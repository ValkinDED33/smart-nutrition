import { Box, Chip, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import { useLanguage } from "../../shared/language";
import type { AppLanguage } from "../../shared/types/i18n";

const progressOverviewCopy = {
  uk: {
    title: "Загальний прогрес",
    subtitle: "Одна карта для всього, що веде рахунок сьогодні.",
    calories: "Калорії",
    protein: "Білок",
    water: "Вода",
    meals: "Прийоми їжі",
    weightGoal: "Вага до цілі",
    checkIn: "Check-in",
    noTarget: "ціль не задана",
    legend: "Легенда",
    good: "у темпі",
    watch: "потрібна увага",
    missing: "мало даних",
    mealsDetail: (count: number) => `${count}/4 за сьогодні`,
    checkInDetail: (count: number) => `${count} записів`,
  },
  pl: {
    title: "Ogólny postęp",
    subtitle: "Jedna karta dla wszystkiego, co dziś jest liczone.",
    calories: "Kalorie",
    protein: "Białko",
    water: "Woda",
    meals: "Posiłki",
    weightGoal: "Waga do celu",
    checkIn: "Check-in",
    noTarget: "cel nieustawiony",
    legend: "Legenda",
    good: "w tempie",
    watch: "do sprawdzenia",
    missing: "mało danych",
    mealsDetail: (count: number) => `${count}/4 dzisiaj`,
    checkInDetail: (count: number) => `${count} zapisów`,
  },
  en: {
    title: "Overall progress",
    subtitle: "One card for everything that is being counted today.",
    calories: "Calories",
    protein: "Protein",
    water: "Water",
    meals: "Meals",
    weightGoal: "Weight goal",
    checkIn: "Check-in",
    noTarget: "target not set",
    legend: "Legend",
    good: "on pace",
    watch: "needs attention",
    missing: "not enough data",
    mealsDetail: (count: number) => `${count}/4 today`,
    checkInDetail: (count: number) => `${count} entries`,
  },
} as const;

type ProgressTone = "good" | "watch" | "missing";
type ProgressOverviewCopy = (typeof progressOverviewCopy)[AppLanguage];

const getProgressOverviewCopy = (language: AppLanguage): ProgressOverviewCopy => {
  switch (language) {
    case "pl":
      return progressOverviewCopy.pl;
    case "en":
      return progressOverviewCopy.en;
    case "uk":
    default:
      return progressOverviewCopy.uk;
  }
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const getTone = (value: number | null, target = 80): ProgressTone => {
  if (value === null) {
    return "missing";
  }

  return value >= target ? "good" : "watch";
};

const getToneColor = (tone: ProgressTone, color: string) => {
  if (tone === "missing") {
    return "rgba(148, 163, 184, 0.72)";
  }

  if (tone === "watch") {
    return "#f59e0b";
  }

  return color;
};

const formatPercent = (value: number | null) => (value === null ? "-" : `${value}%`);

export const ProgressOverviewCard = () => {
  const { appLanguage } = useLanguage();
  const copy = getProgressOverviewCopy(appLanguage);
  const profile = useSelector((state: RootState) => state.profile);
  const meal = useSelector((state: RootState) => state.meal);
  const water = useSelector((state: RootState) => state.water);
  const latestWeight = profile.weightHistory.at(-1)?.weight ?? 0;
  const todayMealCount = meal.items.filter((item) => {
    const date = new Date(item.eatenAt);
    const today = new Date();

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }).length;
  const caloriesProgress = profile.dailyCalories
    ? clampPercent((meal.totalNutrients.calories / profile.dailyCalories) * 100)
    : null;
  const proteinTarget = profile.dailyCalories ? Math.max(60, Math.round(profile.dailyCalories * 0.075)) : 0;
  const proteinProgress = proteinTarget
    ? clampPercent((meal.totalNutrients.protein / proteinTarget) * 100)
    : null;
  const waterProgress = water.dailyWaterGoal
    ? clampPercent((water.consumedMl / water.dailyWaterGoal) * 100)
    : null;
  const mealsProgress = clampPercent((todayMealCount / 4) * 100);
  const weightProgress =
    latestWeight && profile.targetWeight
      ? clampPercent(
          (1 -
            Math.abs(latestWeight - profile.targetWeight) /
              Math.max(Math.abs((profile.targetWeightStart ?? latestWeight) - profile.targetWeight), 1)) *
            100
        )
      : null;
  const checkInProgress = clampPercent(Math.min(profile.measurementHistory.length, 4) * 25);
  const items = [
    {
      label: copy.calories,
      value: caloriesProgress,
      detail: `${Math.round(meal.totalNutrients.calories)} / ${profile.dailyCalories || 0} kcal`,
      color: "#14b8a6",
      tone: getTone(caloriesProgress),
    },
    {
      label: copy.protein,
      value: proteinProgress,
      detail: `${Math.round(meal.totalNutrients.protein)} / ${proteinTarget || 0} g`,
      color: "#8b5cf6",
      tone: getTone(proteinProgress),
    },
    {
      label: copy.water,
      value: waterProgress,
      detail: `${water.consumedMl} / ${water.dailyWaterGoal} ml`,
      color: "#0ea5e9",
      tone: getTone(waterProgress),
    },
    {
      label: copy.meals,
      value: mealsProgress,
      detail: copy.mealsDetail(todayMealCount),
      color: "#22c55e",
      tone: getTone(mealsProgress, 50),
    },
    {
      label: copy.weightGoal,
      value: weightProgress,
      detail: profile.targetWeight ? `${latestWeight.toFixed(1)} / ${profile.targetWeight.toFixed(1)} kg` : copy.noTarget,
      color: "#f97316",
      tone: getTone(weightProgress),
    },
    {
      label: copy.checkIn,
      value: checkInProgress,
      detail: copy.checkInDetail(profile.measurementHistory.length),
      color: "#ec4899",
      tone: getTone(checkInProgress, 50),
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        background:
          "linear-gradient(135deg, rgba(20, 184, 166, 0.1), rgba(14, 165, 233, 0.07))",
      }}
    >
      <Stack spacing={1.8}>
        <Stack spacing={0.4}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 900 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
            gap: 1.25,
          }}
        >
          {items.map((item) => {
            const barColor = getToneColor(item.tone, item.color);

            return (
              <Paper key={item.label} variant="outlined" sx={{ p: 1.35, borderRadius: 1 }}>
                <Stack spacing={0.75}>
                  <Stack direction="row" justifyContent="space-between" spacing={1}>
                    <Typography sx={{ fontWeight: 850 }}>{item.label}</Typography>
                    <Typography sx={{ fontWeight: 900, color: barColor }}>
                      {formatPercent(item.value)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={item.value ?? 100}
                    sx={{
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: "rgba(148, 163, 184, 0.18)",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 999,
                        backgroundColor: barColor,
                      },
                    }}
                  />
                  <Typography color="text.secondary" variant="body2">
                    {item.detail}
                  </Typography>
                </Stack>
              </Paper>
            );
          })}
        </Box>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
          <Typography variant="body2" sx={{ fontWeight: 850 }}>
            {copy.legend}
          </Typography>
          <Chip size="small" label={copy.good} sx={{ bgcolor: "rgba(20,184,166,0.14)", color: "#0f766e", fontWeight: 800 }} />
          <Chip size="small" label={copy.watch} sx={{ bgcolor: "rgba(245,158,11,0.16)", color: "#92400e", fontWeight: 800 }} />
          <Chip size="small" label={copy.missing} sx={{ bgcolor: "rgba(148,163,184,0.18)", fontWeight: 800 }} />
        </Stack>
      </Stack>
    </Paper>
  );
};

export default ProgressOverviewCard;
