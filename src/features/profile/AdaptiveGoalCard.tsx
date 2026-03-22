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
  const { language } = useLanguage();
  const { maintenanceCalories, goal, adaptiveCalories, weightHistory } = useSelector(
    (state: RootState) => state.profile
  );
  const items = useSelector(selectMealItems);

  const text =
    language === "pl"
      ? {
          title: "Adaptacyjny cel kalorii",
          subtitle:
            "Na podstawie spożycia i zmian masy ciała system proponuje bardziej trafny cel dzienny.",
          current: "Aktualny cel",
          suggested: "Rekomendowany cel",
          average: "Średnie spożycie",
          apply: "Zastosuj rekomendację",
        }
      : {
          title: "Адаптивна ціль калорій",
          subtitle:
            "На основі споживання і змін ваги система пропонує точнішу денну ціль.",
          current: "Поточна ціль",
          suggested: "Рекомендована ціль",
          average: "Середнє споживання",
          apply: "Застосувати рекомендацію",
        };

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
          {text.title}
        </Typography>
        <Typography color="text.secondary">{text.subtitle}</Typography>
        <Typography>
          {text.current}: {adaptiveCalories ?? maintenanceCalories} kcal
        </Typography>
        <Typography>
          {text.suggested}: {suggestedCalories} kcal
        </Typography>
        <Typography color="text.secondary">
          {text.average}: {averageIntake.toFixed(0)} kcal
        </Typography>
        <Button
          variant="contained"
          onClick={() => dispatch(setAdaptiveCalories(suggestedCalories))}
          sx={{ alignSelf: "flex-start" }}
        >
          {text.apply}
        </Button>
      </Stack>
    </Paper>
  );
};
