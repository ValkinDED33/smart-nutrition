import type { Goal } from "../types/user";
import type { MealEntry } from "../types/meal";
import { addDays, getLocalDateKey } from "./date";

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const applyGoalDelta = (maintenanceCalories: number, goal: Goal) => {
  if (goal === "cut") return Math.max(maintenanceCalories - 300, 1200);
  if (goal === "bulk") return maintenanceCalories + 250;
  return maintenanceCalories;
};

export const calculateAverageDailyCalories = (items: MealEntry[], days = 7) => {
  const today = startOfDay(new Date());
  const dayKeys = Array.from({ length: days }, (_, index) =>
    getLocalDateKey(addDays(today, -index))
  );

  const totals = dayKeys.map((dayKey) =>
    items
      .filter((item) => getLocalDateKey(item.eatenAt) === dayKey)
      .reduce(
        (sum, item) => sum + (item.product.nutrients.calories * item.quantity) / 100,
        0
      )
  );

  const filledDays = totals.filter((value) => value > 0);
  if (filledDays.length === 0) return 0;

  return filledDays.reduce((sum, value) => sum + value, 0) / filledDays.length;
};

export const calculateAdaptiveCalorieTarget = ({
  maintenanceCalories,
  goal,
  averageIntake,
  weightChange,
}: {
  maintenanceCalories: number;
  goal: Goal;
  averageIntake: number;
  weightChange: number;
}) => {
  const baseTarget = applyGoalDelta(maintenanceCalories, goal);
  const intakeGap = averageIntake > 0 ? averageIntake - baseTarget : 0;

  const weightSignal =
    goal === "cut"
      ? weightChange >= 0
        ? -120
        : 60
      : goal === "bulk"
        ? weightChange <= 0
          ? 120
          : -40
        : 0;

  const intakeSignal =
    goal === "cut"
      ? intakeGap > 150
        ? -80
        : intakeGap < -200
          ? 60
          : 0
      : goal === "bulk"
        ? intakeGap < -150
          ? 100
          : intakeGap > 200
            ? -60
            : 0
        : intakeGap > 250
          ? -50
          : intakeGap < -250
            ? 50
            : 0;

  return Math.max(Math.round(baseTarget + weightSignal + intakeSignal), 1200);
};
