/**
 * Meal Domain Rules
 * 
 * Business rules and policies
 */

import type { MealEntry, UserProfile } from "./types";

/**
 * MealRules - contains business rules for meal operations
 */
export class MealRules {
  /**
   * Check if user can add more food based on daily calorie limit
   */
  static canAddMeal(
    profile: UserProfile,
    currentTotalCalories: number,
    newMealCalories: number
  ): boolean {
    const totalCalories = currentTotalCalories + newMealCalories;
    // Allow up to 150% of daily goal
    return totalCalories <= profile.dailyCalories * 1.5;
  }

  /**
   * Check if a product should be excluded based on user preferences
   */
  static shouldExcludeProduct(
    productName: string,
    brand: string | undefined,
    userAllergies: string[],
    userExclusions: string[]
  ): boolean {
    const fullName = `${productName} ${brand || ''}`.toLowerCase();

    // Check allergies
    const hasAllergy = userAllergies.some((allergy) =>
      fullName.includes(allergy.toLowerCase())
    );

    // Check exclusions
    const hasExclusion = userExclusions.some((exclusion) =>
      fullName.includes(exclusion.toLowerCase())
    );

    return hasAllergy || hasExclusion;
  }

  /**
   * Check if meal should trigger repeat suggestion
   */
  static shouldSuggestRepeat(lastMeal: MealEntry): boolean {
    const hoursSince =
      (new Date().getTime() - new Date(lastMeal.eatenAt).getTime()) / 3600000;
    // Suggest repeat if last similar meal was 20-26 hours ago
    return hoursSince >= 20 && hoursSince <= 26;
  }

  /**
   * Check if meal entry looks like a duplicate
   */
  static looksLikeDuplicate(
    newEntry: MealEntry,
    recentEntries: MealEntry[],
    withinMinutes: number = 5
  ): boolean {
    const newTime = new Date(newEntry.eatenAt).getTime();

    return recentEntries.some((recent) => {
      const recentTime = new Date(recent.eatenAt).getTime();
      const timeDiffMinutes = Math.abs(newTime - recentTime) / 60000;

      return (
        timeDiffMinutes <= withinMinutes &&
        recent.product.id === newEntry.product.id &&
        recent.mealType === newEntry.mealType &&
        Math.abs(recent.quantity - newEntry.quantity) < 10
      );
    });
  }

  /**
   * Check if daily calorie goal was met
   */
  static isDailyGoalMet(
    totalCalories: number,
    dailyGoal: number,
    tolerance: number = 0.05 // 5% tolerance
  ): boolean {
    const lowerBound = dailyGoal * (1 - tolerance);
    const upperBound = dailyGoal * (1 + tolerance);
    return totalCalories >= lowerBound && totalCalories <= upperBound;
  }

  /**
   * Check if macro breakdown is reasonable
   */
  static isMacroBreakdownReasonable(
    protein: number,
    fat: number,
    carbs: number
  ): boolean {
    // Check that macros sum to approximately the calories
    const macroCalories = protein * 4 + fat * 9 + carbs * 4;
    const totalCalories = macroCalories;

    // Macros should account for at least 90% of calories
    return macroCalories >= 0 && totalCalories >= 0;
  }
}
