import { lazy, Suspense, useState } from "react";
import { Box, Chip, LinearProgress, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import { DailyHistoryExplorer } from "../features/meal/DailyHistoryExplorer";
import { MealDayOverview } from "../features/meal/MealDayOverview";
import { ProductSearch } from "../features/meal/ProductSearch";
import { QuickMealComposer } from "../features/meal/QuickMealComposer";
import { QuickProductShelf } from "../features/meal/QuickProductShelf";
import { selectTodayMealTotalNutrients } from "../features/meal/selectors";
import Loader from "../shared/components/Loader/PacmanLoader";
import { useLanguage } from "../shared/language";
import type { MealType } from "../shared/types/meal";

const BarcodeScanner = lazy(() =>
  import("../features/meal/BarcodeScanner").then((module) => ({
    default: module.BarcodeScanner,
  }))
);

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const FoodPage = () => {
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const dailyCalories = useSelector((state: RootState) => state.profile.dailyCalories);
  const totals = useSelector(selectTodayMealTotalNutrients);
  const { t } = useLanguage();
  const caloriePercent = dailyCalories
    ? Math.min((totals.calories / dailyCalories) * 100, 100)
    : 0;

  const mealLabels: Record<MealType, string> = {
    breakfast: t("mealType.breakfast"),
    lunch: t("mealType.lunch"),
    dinner: t("mealType.dinner"),
    snack: t("mealType.snack"),
  };

  return (
    <Stack spacing={2.5}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 1,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.9)",
        }}
      >
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between">
            <Stack spacing={0.5}>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
                {t("page.food.title")}
              </Typography>
              <Typography color="text.secondary">{t("page.food.subtitle")}</Typography>
            </Stack>
            <Chip
              label={`${totals.calories.toFixed(0)} / ${dailyCalories} ${t("common.kcal")}`}
              color={caloriePercent > 92 ? "warning" : "success"}
              variant="outlined"
            />
          </Stack>
          <LinearProgress
            variant="determinate"
            value={caloriePercent}
            sx={{ height: 12, borderRadius: 999 }}
          />
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, md: 2 },
          borderRadius: 1,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.9)",
        }}
      >
        <ToggleButtonGroup
          exclusive
          value={mealType}
          onChange={(_, value: MealType | null) => {
            if (value) {
              setMealType(value);
            }
          }}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
            gap: 1,
            "& .MuiToggleButtonGroup-grouped": {
              border: "1px solid rgba(15, 23, 42, 0.12)",
              borderRadius: 1,
              m: 0,
              textTransform: "none",
              fontWeight: 800,
            },
          }}
        >
          {mealTypes.map((type) => (
            <ToggleButton key={type} value={type}>
              {mealLabels[type]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.05fr) minmax(340px, 0.95fr)" },
          gap: 2.5,
          alignItems: "start",
        }}
      >
        <Stack spacing={2.5}>
          <ProductSearch mealType={mealType} />
          <QuickProductShelf mealType={mealType} />
          <QuickMealComposer mealType={mealType} />
          <Suspense fallback={<Loader fullScreen={false} size={70} />}>
            <BarcodeScanner mealType={mealType} />
          </Suspense>
        </Stack>

        <Stack spacing={2.5}>
          <MealDayOverview />
          <DailyHistoryExplorer />
        </Stack>
      </Box>
    </Stack>
  );
};

export default FoodPage;
