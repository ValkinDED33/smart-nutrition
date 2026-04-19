import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import { Avatar, Box, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { useLanguage } from "../shared/language";
import { WeeklyInsights } from "../features/meal/WeeklyInsights";
import { selectTodayMealTotalNutrients } from "../features/meal/selectors";
import { MealDayOverview } from "../features/meal/MealDayOverview";
import { YesterdayRepeater } from "../features/meal/YesterdayRepeater";
import { DailyMicronutrientsCard } from "../features/meal/DailyMicronutrientsCard";
import { AdaptiveGoalCard } from "../features/profile/AdaptiveGoalCard";
import { SmartRecommendations } from "../features/meal/SmartRecommendations";
import { MonthlyAnalyticsCard } from "../features/meal/MonthlyAnalyticsCard";
import { selectDailyMacroProgress } from "../features/profile/selectors";
import { NutritionCoachCard } from "../features/meal/NutritionCoachCard";
import { AssistantRuntimeCard } from "../features/assistant/AssistantRuntimeCard";
import { WaterTracker } from "../features/water/WaterTracker";

const macroGoalCopy = {
  uk: {
    sectionTitle: "Цілі за макроелементами",
    sectionSubtitle: "Порівнюйте фактичні білки, жири та вуглеводи зі своєю денною ціллю.",
    target: "Ціль",
    remaining: "Залишилось",
  },
  pl: {
    sectionTitle: "Cele makroskładników",
    sectionSubtitle: "Porównuj faktyczne białko, tłuszcze i węglowodany z celem dziennym.",
    target: "Cel",
    remaining: "Pozostało",
  },
} as const;

const DashboardPage = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const dailyCalories = useSelector((state: RootState) => state.profile.dailyCalories);
  const totalMacros = useSelector(selectTodayMealTotalNutrients);
  const macroProgress = useSelector(selectDailyMacroProgress);
  const { t, language } = useLanguage();

  if (!user) {
    return <Typography>{t("dashboard.needLogin")}</Typography>;
  }

  const localizedMacroCopy = macroGoalCopy[language];
  const remainingCalories = Math.max(dailyCalories - totalMacros.calories, 0);
  const progress = dailyCalories
    ? Math.min((totalMacros.calories / dailyCalories) * 100, 100)
    : 0;

  const stats = [
    { label: t("dashboard.dailyGoal"), value: `${dailyCalories} ${t("common.kcal")}` },
    {
      label: t("dashboard.consumed"),
      value: `${totalMacros.calories.toFixed(0)} ${t("common.kcal")}`,
    },
    {
      label: t("dashboard.remaining"),
      value: `${remainingCalories.toFixed(0)} ${t("common.kcal")}`,
    },
    { label: t("dashboard.goal"), value: t(`option.goal.${user.goal}`) },
  ];

  const macros = [
    {
      label: t("dashboard.protein"),
      current: macroProgress.protein.current,
      target: macroProgress.protein.target,
      progress: macroProgress.protein.progress,
    },
    {
      label: t("dashboard.fat"),
      current: macroProgress.fat.current,
      target: macroProgress.fat.target,
      progress: macroProgress.fat.progress,
    },
    {
      label: t("dashboard.carbs"),
      current: macroProgress.carbs.current,
      target: macroProgress.carbs.target,
      progress: macroProgress.carbs.progress,
    },
  ].map((macro) => ({
    ...macro,
    remaining: Math.max(macro.target - macro.current, 0),
  }));

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 7,
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(15,118,110,0.9) 100%)",
          color: "white",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={user.avatar} sx={{ width: 72, height: 72 }}>
              {user.name[0]}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900 }}>
                {t("dashboard.welcome", { name: user.name })}
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.78)", maxWidth: 540 }}>
                {t("dashboard.subtitle")}
              </Typography>
            </Box>
          </Stack>
          <Stack spacing={0.5} sx={{ color: "rgba(255,255,255,0.82)" }}>
            <Typography>
              {t("dashboard.age")}: {user.age}
            </Typography>
            <Typography>
              {t("dashboard.weight")}: {user.weight} {t("common.kg")}
            </Typography>
            <Typography>
              {t("dashboard.height")}: {user.height} {t("common.cm")}
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
        }}
      >
        {stats.map((item) => (
          <Paper
            key={item.label}
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 5,
              border: "1px solid rgba(15, 23, 42, 0.08)",
              backgroundColor: "rgba(255,255,255,0.84)",
            }}
          >
            <Typography color="text.secondary" sx={{ mb: 0.6 }}>
              {item.label}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {item.value}
            </Typography>
          </Paper>
        ))}
      </Box>

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
          {t("meal.progress")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 1.5 }}>
          {totalMacros.calories.toFixed(0)} / {dailyCalories} {t("common.kcal")}
        </Typography>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 12, borderRadius: 999 }} />
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 6,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.86)",
        }}
      >
        <Stack spacing={2}>
          <Stack spacing={0.6}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {localizedMacroCopy.sectionTitle}
            </Typography>
            <Typography color="text.secondary">{localizedMacroCopy.sectionSubtitle}</Typography>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              gap: 2,
            }}
          >
            {macros.map((macro) => (
              <Paper
                key={macro.label}
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 5,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(239,246,255,0.86) 100%)",
                  border: "1px solid rgba(15, 23, 42, 0.08)",
                }}
              >
                <Typography color="text.secondary">{macro.label}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.4 }}>
                  {macro.current.toFixed(1)} / {macro.target.toFixed(0)} {t("common.g")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {localizedMacroCopy.target}: {macro.target.toFixed(0)} {t("common.g")} |{" "}
                  {localizedMacroCopy.remaining}: {macro.remaining.toFixed(1)} {t("common.g")}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={macro.progress}
                  sx={{ height: 8, mt: 1.2, borderRadius: 999 }}
                />
              </Paper>
            ))}
          </Box>
        </Stack>
      </Paper>

      <WaterTracker />

      <DailyMicronutrientsCard />
      <YesterdayRepeater />
      <MealDayOverview />
      <WeeklyInsights />
      <MonthlyAnalyticsCard />
      <AssistantRuntimeCard />
      <NutritionCoachCard />
      <SmartRecommendations />
      <AdaptiveGoalCard />
    </Stack>
  );
};

export default DashboardPage;
