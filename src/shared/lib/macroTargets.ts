import type { Goal } from "../types/user";
import type { DietStyle, MacroTargets } from "../types/profile";

const roundToNearestWhole = (value: number) => Math.max(Math.round(value), 0);

export const calculateMacroTargets = ({
  calories,
  weight,
  goal,
  dietStyle,
}: {
  calories: number;
  weight: number;
  goal: Goal;
  dietStyle: DietStyle;
}): MacroTargets => {
  if (!Number.isFinite(calories) || calories <= 0 || !Number.isFinite(weight) || weight <= 0) {
    return {
      protein: 0,
      fat: 0,
      carbs: 0,
    };
  }

  const baseProteinMultiplier =
    goal === "cut" ? 2 : goal === "bulk" ? 1.9 : 1.7;
  const plantProteinOffset =
    dietStyle === "vegan" ? 0.2 : dietStyle === "vegetarian" ? 0.1 : 0;
  const protein = roundToNearestWhole(weight * (baseProteinMultiplier + plantProteinOffset));

  const baselineFat =
    weight *
    (dietStyle === "low_carb" ? 1 : goal === "cut" ? 0.8 : goal === "bulk" ? 0.85 : 0.82);
  let fat = baselineFat;
  let carbs = Math.max((calories - protein * 4 - fat * 9) / 4, 0);

  if (dietStyle === "low_carb") {
    const carbCap = Math.max(roundToNearestWhole(weight * 1.1), 90);

    if (carbs > carbCap) {
      const caloriesToShift = (carbs - carbCap) * 4;
      carbs = carbCap;
      fat += caloriesToShift / 9;
    }
  } else {
    const preferredFatShare =
      goal === "cut" ? 0.27 : goal === "bulk" ? 0.28 : 0.3;
    const preferredFatCalories = calories * preferredFatShare;
    const currentFatCalories = fat * 9;

    if (currentFatCalories < preferredFatCalories && carbs > 0) {
      const availableCarbCalories = carbs * 4;
      const caloriesToShift = Math.min(
        preferredFatCalories - currentFatCalories,
        availableCarbCalories * 0.35
      );

      fat += caloriesToShift / 9;
      carbs = Math.max(carbs - caloriesToShift / 4, 0);
    }
  }

  return {
    protein,
    fat: roundToNearestWhole(fat),
    carbs: roundToNearestWhole(carbs),
  };
};
