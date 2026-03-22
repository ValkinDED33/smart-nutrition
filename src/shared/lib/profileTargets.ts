import { applyGoalDelta } from "./adaptiveGoal";
import { calculateCalories, type CalorieInput } from "./calorieCalculator";
import type { Goal } from "../types/user";

export interface ProfileTargetInput extends CalorieInput {
  goal: Goal;
}

export const calculateProfileTargets = ({
  goal,
  ...calorieInput
}: ProfileTargetInput) => {
  const maintenanceCalories = calculateCalories(calorieInput);
  const targetCalories = applyGoalDelta(maintenanceCalories, goal);

  return {
    maintenanceCalories,
    targetCalories,
  };
};
