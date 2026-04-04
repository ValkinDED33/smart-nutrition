import { useMemo } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { Button, Chip, Paper, Stack, Typography } from "@mui/material";
import type { RootState } from "../../app/store";
import type { AppDispatch } from "../../app/store";
import { selectMealItems } from "./selectors";
import { useLanguage } from "../../shared/language";
import { addDays, getLocalDateKey } from "../../shared/lib/date";
import { mockProducts } from "../../shared/lib/mockProducts";
import {
  pickPreferredProteinProducts,
  productMatchesPreferences,
} from "../../shared/lib/preferences";
import { addProduct } from "./mealSlice";
import type { MealType } from "../../shared/types/meal";
import type { Product } from "../../shared/types/product";
import { calculateMacroTargets } from "../../shared/lib/macroTargets";

const getSuggestedMealType = (): MealType => {
  const hour = new Date().getHours();

  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour < 21) return "dinner";
  return "snack";
};

export const SmartRecommendations = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => state.profile);
  const items = useSelector(selectMealItems);
  const { t } = useLanguage();

  const todayKey = getLocalDateKey(new Date());
  const todayTotals = items
    .filter((item) => getLocalDateKey(item.eatenAt) === todayKey)
    .reduce(
      (accumulator, item) => {
        const factor = item.quantity / 100;
        accumulator.calories += item.product.nutrients.calories * factor;
        accumulator.protein += item.product.nutrients.protein * factor;
        accumulator.fiber += item.product.nutrients.fiber * factor;
        return accumulator;
      },
      { calories: 0, protein: 0, fiber: 0 }
    );

  const recommendations = useMemo(() => {
    if (!user) return [];

    const proteinTarget = calculateMacroTargets({
      calories: profile.dailyCalories,
      weight: user.weight,
      goal: profile.goal,
      dietStyle: profile.dietStyle,
    }).protein;
    const fiberTarget = 25;
    const dailyCalories = profile.dailyCalories;
    const weekKeys = Array.from({ length: 7 }, (_, index) =>
      getLocalDateKey(addDays(new Date(), -index))
    );
    const weeklyEntries = items.filter((item) => weekKeys.includes(getLocalDateKey(item.eatenAt)));
    const weekCalories =
      weeklyEntries.reduce(
        (sum, item) => sum + (item.product.nutrients.calories * item.quantity) / 100,
        0
      ) / 7;
    const preferences = {
      dietStyle: profile.dietStyle,
      allergies: profile.allergies,
      excludedIngredients: profile.excludedIngredients,
      adaptiveMode: profile.adaptiveMode,
    };
    const proteinFoods = pickPreferredProteinProducts(mockProducts, preferences)
      .map((product) => product.name)
      .join(", ");
    const todayEntries = items.filter((item) => getLocalDateKey(item.eatenAt) === todayKey);
    const loggedDays = weekKeys.filter((dayKey) =>
      items.some((item) => getLocalDateKey(item.eatenAt) === dayKey)
    ).length;
    const next: Array<{
      priority: number;
      tone: "success" | "warning" | "info";
      title: string;
      detail: string;
      actionLabel?: string;
      actionProduct?: Product;
      actionQuantity?: number;
    }> = [];

    if (todayTotals.protein < proteinTarget * 0.75) {
      const gap = Math.max(proteinTarget - todayTotals.protein, 0);
      const primaryProteinProduct = pickPreferredProteinProducts(mockProducts, preferences, 1)[0];
      next.push(
        {
          priority: 100,
          tone: "warning",
          title: `Protein gap: ${gap.toFixed(0)} g`,
          detail: `Add one protein-focused meal or snack now. Best matches for your preferences: ${proteinFoods}.`,
          actionLabel: primaryProteinProduct
            ? `Add 150 g ${primaryProteinProduct.name}`
            : undefined,
          actionProduct: primaryProteinProduct,
          actionQuantity: primaryProteinProduct ? 150 : undefined,
        }
      );
    }

    if (todayTotals.fiber < fiberTarget * 0.7) {
      const fiberFoods = mockProducts
        .filter((product) => productMatchesPreferences(product, preferences))
        .filter((product) => product.nutrients.fiber >= 3)
        .slice(0, 3)
        .map((product) => product.name)
        .join(", ");
      next.push({
        priority: 80,
        tone: "info",
        title: "Fiber is still low",
        detail: `Add vegetables, fruit, or higher-fiber foods like ${fiberFoods}.`,
      });
    }

    if (profile.goal === "cut" && todayTotals.calories > dailyCalories + 150) {
      const leanProduct = pickPreferredProteinProducts(mockProducts, preferences, 1)[0];
      next.push({
        priority: 95,
        tone: "warning",
        title: `Cut correction: +${(todayTotals.calories - dailyCalories).toFixed(0)} kcal`,
        detail: "Keep the next meal light: lean protein, vegetables, and no calorie-dense extras.",
        actionLabel: leanProduct ? `Add 120 g ${leanProduct.name}` : undefined,
        actionProduct: leanProduct,
        actionQuantity: leanProduct ? 120 : undefined,
      });
    }

    if (profile.goal === "bulk" && todayTotals.calories < dailyCalories - 250) {
      const denseSnack = mockProducts
        .filter((product) => productMatchesPreferences(product, preferences))
        .sort(
          (left, right) =>
            right.nutrients.calories + right.nutrients.protein * 3 -
            (left.nutrients.calories + left.nutrients.protein * 3)
        )[0];
      next.push({
        priority: 95,
        tone: "warning",
        title: `Bulk push: ${(dailyCalories - todayTotals.calories).toFixed(0)} kcal left`,
        detail: "Add one dense snack with carbs and protein before the day ends.",
        actionLabel: denseSnack ? `Add 120 g ${denseSnack.name}` : undefined,
        actionProduct: denseSnack,
        actionQuantity: denseSnack ? 120 : undefined,
      });
    }

    if (Math.abs(weekCalories - dailyCalories) > 180) {
      next.push({
        priority: 70,
        tone: "info",
        title: `7-day intake drift: ${Math.abs(weekCalories - dailyCalories).toFixed(0)} kcal`,
        detail:
          profile.adaptiveMode === "automatic"
            ? "Auto-adaptation is active, so keep logging consistently and let the target update."
            : "Your average intake is drifting away from target. Consider applying the adaptive target.",
      });
    }

    if (loggedDays < 4) {
      next.push({
        priority: 85,
        tone: "warning",
        title: "Data quality is still weak",
        detail: `Only ${loggedDays} of the last 7 days have food logs. Recommendations improve when you log more consistently.`,
      });
    }

    if (todayEntries.length <= 1) {
      next.push({
        priority: 75,
        tone: "info",
        title: "Today still looks incomplete",
        detail:
          "You have very few logged meals today. Add missing meals before adjusting calories too aggressively.",
      });
    }

    if (
      profile.goal === "maintain" &&
      loggedDays >= 4 &&
      Math.abs(weekCalories - dailyCalories) <= 120 &&
      todayTotals.protein >= proteinTarget * 0.8
    ) {
      next.push({
        priority: 20,
        tone: "success",
        title: "Weekly balance looks stable",
        detail: t("recommendations.balanced"),
      });
    }

    if (next.length === 0) {
      next.push({
        priority: 10,
        tone: "success",
        title: "Today is well balanced",
        detail: t("recommendations.balanced"),
      });
    }

    return next.sort((left, right) => right.priority - left.priority).slice(0, 4);
  }, [items, profile, t, todayKey, todayTotals.calories, todayTotals.fiber, todayTotals.protein, user]);

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
      <Stack spacing={1.4}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {t("recommendations.title")}
        </Typography>
        {recommendations.length === 0 ? (
          <Typography color="text.secondary">{t("recommendations.empty")}</Typography>
        ) : (
          recommendations.map((recommendation) => (
            <Paper
              key={`${recommendation.title}-${recommendation.detail}`}
              variant="outlined"
              sx={{
                p: 1.6,
                borderRadius: 4,
                borderColor:
                  recommendation.tone === "warning"
                    ? "rgba(245, 158, 11, 0.35)"
                    : recommendation.tone === "success"
                      ? "rgba(34, 197, 94, 0.3)"
                      : "rgba(15, 23, 42, 0.08)",
                backgroundColor:
                  recommendation.tone === "warning"
                    ? "rgba(255, 251, 235, 0.72)"
                    : recommendation.tone === "success"
                      ? "rgba(240, 253, 244, 0.76)"
                      : "rgba(248,250,252,0.9)",
              }}
            >
              <Stack spacing={0.8}>
                <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                  <Typography sx={{ fontWeight: 800 }}>{recommendation.title}</Typography>
                  <Chip
                    size="small"
                    label={recommendation.tone === "warning" ? "Priority" : recommendation.tone === "success" ? "On track" : "Insight"}
                    color={
                      recommendation.tone === "warning"
                        ? "warning"
                        : recommendation.tone === "success"
                          ? "success"
                          : "default"
                    }
                  />
                </Stack>
                <Typography color="text.secondary">{recommendation.detail}</Typography>
                {recommendation.actionProduct && recommendation.actionQuantity && recommendation.actionLabel && (
                  <Button
                    variant="outlined"
                    sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
                    onClick={() => {
                      dispatch(
                        addProduct({
                          product: recommendation.actionProduct!,
                          quantity: recommendation.actionQuantity!,
                          mealType: getSuggestedMealType(),
                          origin: "manual",
                        })
                      );
                    }}
                  >
                    {recommendation.actionLabel}
                  </Button>
                )}
              </Stack>
            </Paper>
          ))
        )}
      </Stack>
    </Paper>
  );
};
