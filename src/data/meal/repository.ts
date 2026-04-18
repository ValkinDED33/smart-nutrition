/**
 * Data Layer - Meal Repository
 * 
 * Interface and implementations for data persistence
 */

import type { MealEntry } from '@domain/meal';

export interface IMealRepository {
  // Query
  getMeals(dateKey: string): Promise<MealEntry[]>;
  getMealsByRange(startDate: Date, endDate: Date): Promise<MealEntry[]>;
  getMealById(id: string): Promise<MealEntry | null>;

  // Command
  createMeal(entry: MealEntry): Promise<MealEntry>;
  updateMeal(id: string, updates: Partial<MealEntry>): Promise<MealEntry>;
  deleteMeal(id: string): Promise<void>;

  // Cache
  clearCache(): void;
}

export class LocalMealRepository implements IMealRepository {
  private meals: MealEntry[] = [];

  async getMeals(dateKey: string): Promise<MealEntry[]> {
    return this.meals.filter((m) => {
      const entryDate = new Date(m.eatenAt);
      const entryDateKey = entryDate.toISOString().split('T')[0];
      return entryDateKey === dateKey;
    });
  }

  async getMealsByRange(startDate: Date, endDate: Date): Promise<MealEntry[]> {
    return this.meals.filter((m) => {
      const mealTime = new Date(m.eatenAt).getTime();
      return mealTime >= startDate.getTime() && mealTime <= endDate.getTime();
    });
  }

  async getMealById(id: string): Promise<MealEntry | null> {
    return this.meals.find((m) => m.id === id) || null;
  }

  async createMeal(entry: MealEntry): Promise<MealEntry> {
    this.meals.push(entry);
    return entry;
  }

  async updateMeal(id: string, updates: Partial<MealEntry>): Promise<MealEntry> {
    const index = this.meals.findIndex((m) => m.id === id);
    if (index === -1) throw new Error(`Meal ${id} not found`);

    const updated = { ...this.meals[index], ...updates };
    this.meals[index] = updated;
    return updated;
  }

  async deleteMeal(id: string): Promise<void> {
    this.meals = this.meals.filter((m) => m.id !== id);
  }

  clearCache(): void {
    // No cache for local repo
  }

  // Utility for testing
  setMeals(meals: MealEntry[]): void {
    this.meals = meals;
  }
}
