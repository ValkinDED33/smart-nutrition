/**
 * Features Layer - Use Case for Adding Meal
 * 
 * Orchestrates domain, data, and state layers
 */

import type { MealEntry, Product } from '@domain/meal';
import { validateMealEntry, isValidQuantity } from '@domain/meal';
import { MealRules } from '@domain/meal';
import type { IMealRepository } from '@data/meal';
import type { UserProfile } from '@domain/meal';

export interface AddMealCommand {
  product: Product;
  quantity: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  profile: UserProfile;
  currentMeals: MealEntry[];
}

export interface Result<T> {
  isOk: boolean;
  value?: T;
  errors?: string[];
}

export class AddMealUseCase {
  constructor(
    private repository: IMealRepository,
    private generateId: () => string = () => crypto.randomUUID?.() || `meal-${Date.now()}`
  ) {}

  async execute(command: AddMealCommand): Promise<Result<MealEntry>> {
    // 1. Validate input
    if (!isValidQuantity(command.quantity)) {
      return this.fail(['Quantity must be a positive number']);
    }

    // 2. Check business rules
    const mealCalories = (command.product.nutrients.calories * command.quantity) / 100;
    const currentCalories =
      command.currentMeals.reduce(
        (sum, m) => sum + (m.product.nutrients.calories * m.quantity) / 100,
        0
      ) || 0;

    if (!MealRules.canAddMeal(command.profile, currentCalories, mealCalories)) {
      return this.fail(['Daily calorie limit exceeded']);
    }

    // 3. Check exclusions
    if (
      MealRules.shouldExcludeProduct(
        command.product.name,
        command.product.brand,
        command.profile.allergies,
        command.profile.excludedIngredients
      )
    ) {
      return this.fail(['Product contains excluded ingredients or allergens']);
    }

    // 4. Check duplicates
    if (MealRules.looksLikeDuplicate(
      {
        id: 'temp',
        product: command.product,
        quantity: command.quantity,
        mealType: command.mealType,
        eatenAt: new Date(),
        origin: 'manual',
      },
      command.currentMeals
    )) {
      return this.fail(['This meal was just logged (possible duplicate)']);
    }

    // 5. Create entry
    const entry: MealEntry = {
      id: this.generateId(),
      product: command.product,
      quantity: command.quantity,
      mealType: command.mealType,
      eatenAt: new Date(),
      origin: 'manual',
    };

    // 6. Validate complete entry
    const validation = validateMealEntry(entry);
    if (!validation.isValid) {
      return this.fail(validation.errors.map((e) => e.message));
    }

    // 7. Persist
    try {
      const saved = await this.repository.createMeal(entry);
      return this.ok(saved);
    } catch (error) {
      return this.fail(['Failed to save meal']);
    }
  }

  private ok<T>(value: T): Result<T> {
    return { isOk: true, value };
  }

  private fail(errors: string[]): Result<never> {
    return { isOk: false, errors };
  }
}
