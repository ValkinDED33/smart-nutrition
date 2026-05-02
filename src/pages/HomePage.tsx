import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Box, Button, Chip, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import type { AppDispatch, RootState } from "../app/store";
import { selectTodayMealTotalNutrients } from "../features/meal/selectors";
import { incrementWater } from "../features/water/waterSlice";
import { useLanguage } from "../shared/language";
import { selectDailyMacroProgress } from "../features/profile/selectors";

const homeCopy = {
  uk: {
    water: "Вода",
    quickActions: "Швидкі дії",
    addFood: "Додати їжу",
    addWater: "Додати воду",
    assistantAdvice: "Порада асистента",
    todayFocus: "Фокус на сьогодні",
    calorieBalance: "Баланс калорій",
    macroProgress: "БЖУ прогрес",
    currentWeight: "Поточна вага",
    waterProgress: "Вода сьогодні",
    emptyMealTitle: "Ще немає їжі за сьогодні",
    emptyMealBody: "Додайте перший прийом їжі, щоб побачити реальний баланс дня.",
    aiStart: "Почніть з одного прийому їжі. Після першого запису я підкажу, що краще додати далі.",
    aiWater: "Вода нижче темпа дня. Додайте один стакан зараз, а їжу залишимо без стресу.",
    aiProtein: "Білок поки нижче плану. Наступний прийом краще зібрати навколо яєць, йогурту, сиру або курки.",
    aiLimit: "Калорії вже близько до плану. Далі краще білок, овочі і легка вечеря.",
    aiGood: "День виглядає рівно. Тримайте темп і не забувайте про воду.",
  },
  pl: {
    water: "Woda",
    quickActions: "Szybkie akcje",
    addFood: "Dodaj jedzenie",
    addWater: "Dodaj wodę",
    assistantAdvice: "Porada asystenta",
    todayFocus: "Fokus na dziś",
    calorieBalance: "Bilans kalorii",
    macroProgress: "Postęp makro",
    currentWeight: "Aktualna waga",
    waterProgress: "Woda dzisiaj",
    emptyMealTitle: "Brak jedzenia na dziś",
    emptyMealBody: "Dodaj pierwszy posiłek, aby zobaczyć realny bilans dnia.",
    aiStart: "Zacznij od jednego posiłku. Po pierwszym wpisie podpowiem, co najlepiej dodać dalej.",
    aiWater: "Woda jest poniżej tempa dnia. Dodaj teraz jedną szklankę, a jedzenie zostawimy bez stresu.",
    aiProtein: "Białko jest jeszcze nisko. Następny posiłek oprzyj o jajka, jogurt, twaróg albo kurczaka.",
    aiLimit: "Kalorie są już blisko planu. Dalej najlepiej białko, warzywa i lekka kolacja.",
    aiGood: "Dzień wygląda równo. Utrzymaj tempo i pamiętaj o wodzie.",
  },
} as const;

const HomePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const dailyCalories = useSelector((state: RootState) => state.profile.dailyCalories);
  const water = useSelector((state: RootState) => state.water);
  const totals = useSelector(selectTodayMealTotalNutrients);
  const macroProgress = useSelector(selectDailyMacroProgress);
  const { language, t } = useLanguage();
  const copy = homeCopy[language];
  const calorieProgress = dailyCalories
    ? Math.min((totals.calories / dailyCalories) * 100, 100)
    : 0;
  const remainingCalories = Math.max(dailyCalories - totals.calories, 0);
  const waterProgress = water.dailyTargetMl
    ? Math.min((water.consumedMl / water.dailyTargetMl) * 100, 100)
    : 0;
  const macroItems = [
    {
      label: t("dashboard.protein"),
      value: macroProgress.protein.current,
      target: macroProgress.protein.target,
      progress: macroProgress.protein.progress,
      color: "#0f766e",
    },
    {
      label: t("dashboard.fat"),
      value: macroProgress.fat.current,
      target: macroProgress.fat.target,
      progress: macroProgress.fat.progress,
      color: "#f97316",
    },
    {
      label: t("dashboard.carbs"),
      value: macroProgress.carbs.current,
      target: macroProgress.carbs.target,
      progress: macroProgress.carbs.progress,
      color: "#2563eb",
    },
  ];

  const stats = useMemo(
    () => [
      {
        label: t("dashboard.dailyGoal"),
        value: `${dailyCalories} ${t("common.kcal")}`,
      },
      {
        label: t("dashboard.consumed"),
        value: `${totals.calories.toFixed(0)} ${t("common.kcal")}`,
      },
      {
        label: t("dashboard.remaining"),
        value: `${remainingCalories.toFixed(0)} ${t("common.kcal")}`,
      },
      {
        label: copy.water,
        value: `${water.consumedMl} / ${water.dailyTargetMl} ml`,
      },
    ],
    [
      copy.water,
      dailyCalories,
      remainingCalories,
      t,
      totals.calories,
      water.consumedMl,
      water.dailyTargetMl,
    ]
  );

  const aiAdvice = useMemo(
    () => {
      if (totals.calories <= 0) {
        return copy.aiStart;
      }

      if (waterProgress < 45) {
        return copy.aiWater;
      }

      if (macroProgress.protein.progress < 55) {
        return copy.aiProtein;
      }

      if (calorieProgress > 92) {
        return copy.aiLimit;
      }

      return copy.aiGood;
    },
    [
      calorieProgress,
      copy.aiGood,
      copy.aiLimit,
      copy.aiProtein,
      copy.aiStart,
      copy.aiWater,
      macroProgress.protein.progress,
      totals.calories,
      waterProgress,
    ]
  );

  if (!user) {
    return <Typography>{t("dashboard.needLogin")}</Typography>;
  }

  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.4, md: 3 },
          borderRadius: 1,
          color: "white",
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(15,118,110,0.92) 100%)",
        }}
      >
        <Stack spacing={1}>
          <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.72)" }}>
            Smart Nutrition
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            {t("dashboard.welcome", { name: user.name })}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.8)" }}>
            {t("dashboard.subtitle")}
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label={`${t("dashboard.goal")}: ${t(`option.goal.${user.goal}`)}`} />
            <Chip label={`${t("dashboard.weight")}: ${user.weight} ${t("common.kg")}`} />
            <Chip label={`${copy.todayFocus}: ${remainingCalories.toFixed(0)} ${t("common.kcal")}`} />
          </Stack>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
          gap: 1.5,
        }}
      >
        {stats.map((item) => (
          <Paper
            key={item.label}
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 1,
              border: "1px solid rgba(15, 23, 42, 0.08)",
              backgroundColor: "rgba(255,255,255,0.88)",
            }}
          >
            <Typography color="text.secondary" variant="body2">
              {item.label}
            </Typography>
            <Typography sx={{ fontWeight: 900, mt: 0.5 }}>{item.value}</Typography>
          </Paper>
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" },
          gap: 2,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: 1,
            border: "1px solid rgba(15, 23, 42, 0.08)",
            backgroundColor: "rgba(255,255,255,0.9)",
          }}
        >
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
            >
              <Stack spacing={0.4}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  {copy.calorieBalance}
                </Typography>
                <Typography color="text.secondary">
                  {totals.calories.toFixed(0)} / {dailyCalories} {t("common.kcal")}
                </Typography>
              </Stack>
              <Chip
                label={`${Math.round(calorieProgress)}%`}
                color={calorieProgress > 92 ? "warning" : "success"}
                variant="outlined"
              />
            </Stack>

            <LinearProgress
              variant="determinate"
              value={calorieProgress}
              sx={{
                height: 14,
                borderRadius: 999,
                bgcolor: "rgba(15,23,42,0.08)",
                "& .MuiLinearProgress-bar": {
                  bgcolor: calorieProgress > 92 ? "#f97316" : "#0f766e",
                },
              }}
            />

            {totals.calories <= 0 ? (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                <Stack spacing={0.5}>
                  <Typography sx={{ fontWeight: 900 }}>{copy.emptyMealTitle}</Typography>
                  <Typography color="text.secondary">{copy.emptyMealBody}</Typography>
                </Stack>
              </Paper>
            ) : null}
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: 1,
            border: "1px solid rgba(15, 23, 42, 0.08)",
            backgroundColor: "rgba(255,255,255,0.9)",
          }}
        >
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              {copy.macroProgress}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 1.2,
              }}
            >
              {macroItems.map((macro) => (
                <Stack key={macro.label} spacing={1} alignItems="center" textAlign="center">
                  <Box
                    sx={{
                      width: { xs: 76, sm: 92 },
                      height: { xs: 76, sm: 92 },
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      background: `conic-gradient(${macro.color} ${macro.progress * 3.6}deg, rgba(226,232,240,0.9) 0deg)`,
                    }}
                  >
                    <Box
                      sx={{
                        width: { xs: 58, sm: 70 },
                        height: { xs: 58, sm: 70 },
                        borderRadius: "50%",
                        bgcolor: "rgba(255,255,255,0.98)",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Typography sx={{ fontWeight: 900, color: macro.color }}>
                        {Math.round(macro.progress)}%
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 900 }}>{macro.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {macro.value.toFixed(0)} / {macro.target.toFixed(0)} {t("common.g")}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Box>
          </Stack>
        </Paper>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          gap: 2,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 1,
            border: "1px solid rgba(15, 23, 42, 0.08)",
            backgroundColor: "rgba(255,255,255,0.9)",
          }}
        >
          <Stack spacing={1.2}>
            <Typography sx={{ fontWeight: 900 }}>{copy.waterProgress}</Typography>
            <Typography color="text.secondary">
              {water.consumedMl} / {water.dailyTargetMl} ml
            </Typography>
            <LinearProgress
              variant="determinate"
              value={waterProgress}
              sx={{ height: 10, borderRadius: 999 }}
            />
            <Button
              variant="outlined"
              onClick={() => dispatch(incrementWater(water.glassSizeMl))}
              sx={{ alignSelf: "flex-start" }}
            >
              +{water.glassSizeMl} ml
            </Button>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 1,
            border: "1px solid rgba(15, 23, 42, 0.08)",
            backgroundColor: "rgba(255,255,255,0.9)",
          }}
        >
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 900 }}>{copy.currentWeight}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              {user.weight} {t("common.kg")}
            </Typography>
            <Typography color="text.secondary">
              {t("dashboard.goal")}: {t(`option.goal.${user.goal}`)}
            </Typography>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 1,
            border: "1px solid rgba(15, 23, 42, 0.08)",
            backgroundColor: "rgba(255,255,255,0.9)",
          }}
        >
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 900 }}>{copy.assistantAdvice}</Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {aiAdvice}
            </Typography>
            <Button
              variant="text"
              onClick={() => navigate("/ai")}
              sx={{ alignSelf: "flex-start" }}
            >
              AI Coach
            </Button>
          </Stack>
        </Paper>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 1,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.88)",
        }}
      >
        <Stack spacing={1.5}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {copy.quickActions}
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button
              variant="contained"
              onClick={() => navigate("/meals")}
              sx={{
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 800,
                background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
              }}
            >
              {copy.addFood}
            </Button>
            <Button
              variant="outlined"
              onClick={() => dispatch(incrementWater(water.glassSizeMl))}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {copy.addWater}
            </Button>
            <Button
              variant="text"
              onClick={() => navigate("/ai")}
              sx={{ textTransform: "none", fontWeight: 800 }}
            >
              {copy.assistantAdvice}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default HomePage;
