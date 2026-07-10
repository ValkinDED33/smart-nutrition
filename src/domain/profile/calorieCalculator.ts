import type { ActivityLevel, Gender } from "@domain/user/types";

export interface CalorieInput {
  gender: Gender;
  weight: number;
  height: number;
  age: number;
  activity: ActivityLevel;
}

const activityMultiplier: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const getActivityMultiplier = (activity: ActivityLevel) => {
  switch (activity) {
    case "light":
      return activityMultiplier.light;
    case "moderate":
      return activityMultiplier.moderate;
    case "active":
      return activityMultiplier.active;
    case "very_active":
      return activityMultiplier.very_active;
    case "sedentary":
    default:
      return activityMultiplier.sedentary;
  }
};

export const calculateCalories = (data: CalorieInput): number => {
  const { gender, weight, height, age, activity } = data;

  const bmr =
    gender === "male"
      ? 88.36 + 13.4 * weight + 4.8 * height - 5.7 * age
      : 447.6 + 9.2 * weight + 3.1 * height - 4.3 * age;

  return Math.round(bmr * getActivityMultiplier(activity));
};
