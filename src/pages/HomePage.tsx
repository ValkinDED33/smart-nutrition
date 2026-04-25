import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import type { AppDispatch, RootState } from "../app/store";
import { selectTodayMealTotalNutrients } from "../features/meal/selectors";
import { incrementWater } from "../features/water/waterSlice";
import { useLanguage } from "../shared/language";

const homeCopy = {
  uk: {
    water: "Вода",
    quickActions: "Швидкі дії",
    addFood: "Додати їжу",
    addWater: "Додати воду",
    assistantAdvice: "Порада асистента",
  },
  pl: {
    water: "Woda",
    quickActions: "Szybkie akcje",
    addFood: "Dodaj jedzenie",
    addWater: "Dodaj wodę",
    assistantAdvice: "Porada asystenta",
  },
} as const;

const HomePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const dailyCalories = useSelector((state: RootState) => state.profile.dailyCalories);
  const water = useSelector((state: RootState) => state.water);
  const totals = useSelector(selectTodayMealTotalNutrients);
  const { language, t } = useLanguage();
  const copy = homeCopy[language];

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
        value: `${Math.max(dailyCalories - totals.calories, 0).toFixed(0)} ${t("common.kcal")}`,
      },
      {
        label: copy.water,
        value: `${water.consumedMl} / ${water.dailyTargetMl} ml`,
      },
    ],
    [copy.water, dailyCalories, t, totals.calories, water.consumedMl, water.dailyTargetMl]
  );

  if (!user) {
    return <Typography>{t("dashboard.needLogin")}</Typography>;
  }

  return (
    <Stack spacing={2.5}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 5,
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
              borderRadius: 4,
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

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 4,
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
