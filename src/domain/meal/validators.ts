/**
 * Meal Domain Validators
 * 
 * Pure validation functions
 */

import type { MealEntry, MealTypeValue, ProductUnit } from './types';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate quantity
 */
export function isValidQuantity(quantity: number): boolean {
  return typeof quantity === 'number' && quantity > 0 && Number.isFinite(quantity);
}

/**
 * Validate meal type
 */
export function isValidMealType(value: unknown): value is MealTypeValue {
  return ['breakfast', 'lunch', 'dinner', 'snack'].includes(String(value));
}

/**
 * Validate product unit
 */
export function isValidUnit(value: unknown): value is ProductUnit {
  return ['g', 'ml', 'piece'].includes(String(value));
}

/**
 * Validate meal entry
 */
export function validateMealEntry(
  entry: Partial<MealEntry>
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!entry.id) {
    errors.push({ field: 'id', message: 'ID is required' });
  }

  if (!entry.product) {
    errors.push({ field: 'product', message: 'Product is required' });
  }

  if (!isValidQuantity(entry.quantity ?? 0)) {
    errors.push({
      field: 'quantity',
      message: 'Quantity must be a positive number',
    });
  }

  if (!isValidMealType(entry.mealType)) {
    errors.push({
      field: 'mealType',
      message: 'Invalid meal type',
    });
  }

  if (!entry.eatenAt) {
    errors.push({ field: 'eatenAt', message: 'Eaten at date is required' });
  } else if (!(entry.eatenAt instanceof Date)) {
    errors.push({
      field: 'eatenAt',
      message: 'Eaten at must be a valid Date',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate product name
 */
export function isValidProductName(name: string): boolean {
  return typeof name === 'string' && name.trim().length > 0 && name.length <= 255;
}

/**
 * Validate calorie number
 */
export function isValidCalorie(calorie: number): boolean {
  return typeof calorie === 'number' && calorie >= 0 && Number.isFinite(calorie);
}
