import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Paper, Stack, Typography } from "@mui/material";
import type { RootState } from "../../app/store";
import { selectMealItems } from "./selectors";
import { useLanguage } from "../../shared/language";
import { getLocalDateKey } from "../../shared/lib/date";

export const SmartRecommendations = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const dailyCalories = useSelector(
    (state: RootState) => state.profile.dailyCalories
  );
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
        return accumulator;
      },
      { calories: 0, protein: 0 }
    );

  const recommendations = useMemo(() => {
    if (!user) return [];

    const proteinTarget = user.weight * 1.6;
    const next: string[] = [];

    if (todayTotals.protein < proteinTarget * 0.6) {
      next.push(t("recommendations.lowProtein"));
    }

    if (todayTotals.calories > dailyCalories * 0.85) {
      next.push(t("recommendations.highCalories"));
    }

    if (next.length === 0) {
      next.push(t("recommendations.balanced"));
    }

    return next;
  }, [dailyCalories, t, todayTotals.calories, todayTotals.protein, user]);

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
            <Typography key={recommendation} color="text.secondary">
              - {recommendation}
            </Typography>
          ))
        )}
      </Stack>
    </Paper>
  );
};
