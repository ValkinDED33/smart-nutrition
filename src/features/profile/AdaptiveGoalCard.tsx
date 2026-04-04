import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Paper, Stack, Typography } from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import { selectMealItems } from "../meal/selectors";
import { setAdaptiveCalories } from "./profileSlice";
import {
  calculateAdaptiveCalorieTarget,
  calculateAverageDailyCalories,
} from "../../shared/lib/adaptiveGoal";
import { useLanguage } from "../../shared/language";

export const AdaptiveGoalCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useLanguage();
  const { maintenanceCalories, goal, adaptiveCalories, weightHistory, adaptiveMode } = useSelector(
    (state: RootState) => state.profile
  );
  const items = useSelector(selectMealItems);

  const averageIntake = calculateAverageDailyCalories(items);
  const weightChange = useMemo(() => {
    if (weightHistory.length < 2) return 0;
    const first = weightHistory[0]?.weight ?? 0;
    const last = weightHistory.at(-1)?.weight ?? 0;
    return last - first;
  }, [weightHistory]);

  const suggestedCalories = calculateAdaptiveCalorieTarget({
    maintenanceCalories,
    goal,
    averageIntake,
    weightChange,
  });

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
          {t("adaptive.title")}
        </Typography>
        <Typography color="text.secondary">{t("adaptive.subtitle")}</Typography>
        <Typography>
          {t("adaptive.current")}: {adaptiveCalories ?? maintenanceCalories} {t("common.kcal")}
        </Typography>
        <Typography>
          {t("adaptive.suggested")}: {suggestedCalories} {t("common.kcal")}
        </Typography>
        <Typography color="text.secondary">
          {t("adaptive.average")}: {averageIntake.toFixed(0)} {t("common.kcal")}
        </Typography>
        <Typography color="text.secondary">
          {adaptiveMode === "automatic"
            ? "Automatic mode keeps the target aligned with your trend."
            : "Manual mode waits for you to apply changes yourself."}
        </Typography>
        <Button
          variant="contained"
          onClick={() => dispatch(setAdaptiveCalories(suggestedCalories))}
          sx={{ alignSelf: "flex-start" }}
        >
          {t("adaptive.apply")}
        </Button>
      </Stack>
    </Paper>
  );
};
