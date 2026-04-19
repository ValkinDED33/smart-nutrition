/**
 * Data Layer - Cache
 *
 * Generic cache interface and implementations
 */

import type { MealEntry } from "@domain/meal";

export interface ICache<T> {
  get(key: string): T | null;
  set(key: string, value: T, ttlMs?: number): void;
  delete(key: string): void;
  clear(): void;
  has(key: string): boolean;
}

export class MemoryCache<T> implements ICache<T> {
  private cache = new Map<string, { value: T; expiresAt?: number }>();

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    this.cache.set(key, {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

/**
 * Meal-specific cache with optimization
 */
export class MealCache {
  private dailyCache = new Map<string, MealEntry[]>();
  private rangeCache = new Map<string, MealEntry[]>();

  getDailyMeals(dateKey: string): MealEntry[] | null {
    return this.dailyCache.get(dateKey) ?? null;
  }

  setDailyMeals(dateKey: string, meals: MealEntry[]): void {
    this.dailyCache.set(dateKey, meals);
  }

  getRangeMeals(startKey: string, endKey: string): MealEntry[] | null {
    return this.rangeCache.get(`${startKey}:${endKey}`) ?? null;
  }

  setRangeMeals(startKey: string, endKey: string, meals: MealEntry[]): void {
    this.rangeCache.set(`${startKey}:${endKey}`, meals);
  }

  invalidateDailyMeals(dateKey: string): void {
    this.dailyCache.delete(dateKey);
  }

  invalidateAllDaily(): void {
    this.dailyCache.clear();
  }

  invalidateAllRanges(): void {
    this.rangeCache.clear();
  }

  clear(): void {
    this.dailyCache.clear();
    this.rangeCache.clear();
  }
}
