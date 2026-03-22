interface User {
  weight: number;
  height: number;
  age: number;
  gender: "male" | "female";
  activity: "sedentary" | "light" | "moderate" | "active" | "very";
}

const activityMultiplier = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very: 1.9,
} as const;

export const calculateDailyNorms = (user: User) => {
  const { weight, height, age, gender, activity } = user;

  // Используем const, так как bmr больше не изменяется
  const bmr =
    10 * weight + 6.25 * height - 5 * age + (gender === "male" ? 5 : -161);

  const calories = bmr * activityMultiplier[activity];

  return {
    calories: Math.round(calories),
    protein: Math.round(weight * 1.6), // 1.6 г на кг
    fat: Math.round((calories * 0.25) / 9), // 25% калорий
    carbs: Math.round((calories * 0.5) / 4), // 50% калорий
    sodium: 2300,
    potassium: 3500,
    calcium: 1000,
    iron: gender === "female" ? 18 : 8,
    magnesium: gender === "male" ? 400 : 310,
    zinc: gender === "male" ? 11 : 8,
  };
};
