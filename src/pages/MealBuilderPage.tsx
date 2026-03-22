import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import { calculateMealTotals } from "../shared/lib/mealCalculator";
import { ProductCard } from "../features/meal/ProductCard";
import { Typography, LinearProgress, Box, Grid, Paper } from "@mui/material";
import { useLanguage } from "../shared/i18n/I18nProvider";

const MealBuilderPage = () => {
  const items = useSelector((state: RootState) => state.meal.items);
  const dailyCalories = useSelector(
    (state: RootState) => state.profile.dailyCalories
  );
  const totals = calculateMealTotals(items);
  const { t } = useLanguage();

  const caloriePercent = dailyCalories
    ? Math.min((totals.calories / dailyCalories) * 100, 100)
    : 0;

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 900 }}>
        {t("meal.title")}
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 5,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.86)",
        }}
      >
        <Typography sx={{ mb: 1.2 }}>
          {t("meal.progress")}: {totals.calories.toFixed(0)} / {dailyCalories}{" "}
          {t("common.kcal")}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={caloriePercent}
          sx={{ height: 12, borderRadius: 999 }}
        />
      </Paper>

      <Grid
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "1fr 1fr 1fr",
          },
          gap: 2,
        }}
      >
        {items.map((item) => (
          <Box key={item.product.id}>
            <ProductCard product={item.product} />
          </Box>
        ))}
      </Grid>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          mt: 4,
          borderRadius: 5,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.86)",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          {t("meal.summary")}
        </Typography>

        <Typography>
          {t("common.kcal")}: {totals.calories.toFixed(0)} | {t("dashboard.protein")}:{" "}
          {totals.protein.toFixed(1)} {t("common.g")} | {t("dashboard.fat")}:{" "}
          {totals.fat.toFixed(1)} {t("common.g")} | {t("dashboard.carbs")}:{" "}
          {totals.carbs.toFixed(1)} {t("common.g")}
        </Typography>

        <Typography sx={{ mt: 1 }}>
          Na: {totals.sodium.toFixed(1)} {t("common.mg")} | K:{" "}
          {totals.potassium.toFixed(1)} {t("common.mg")} | Ca:{" "}
          {totals.calcium.toFixed(1)} {t("common.mg")} | Fe:{" "}
          {totals.iron.toFixed(1)} {t("common.mg")}
        </Typography>
      </Paper>
    </Box>
  );
};

export default MealBuilderPage;
