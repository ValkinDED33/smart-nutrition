export type Gender = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

interface CalorieInput {
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

export function calculateCalories(data: CalorieInput): number {
  const { gender, weight, height, age, activity } = data;

  let bmr: number;

  if (gender === "male") {
    bmr = 88.36 + 13.4 * weight + 4.8 * height - 5.7 * age;
  } else {
    bmr = 447.6 + 9.2 * weight + 3.1 * height - 4.3 * age;
  }

  return Math.round(bmr * activityMultiplier[activity]);
}
