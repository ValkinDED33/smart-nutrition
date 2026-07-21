import type { MealType } from "@domain/meal/types";
import type { Product } from "@domain/products/types";

export const shouldShowQuickSearchDeadEnd = ({
  query,
  isSearching,
  isError,
  suggestionCount,
}: {
  query: string;
  isSearching: boolean;
  isError: boolean;
  suggestionCount: number;
}) => query.trim().length >= 3 && !isSearching && !isError && suggestionCount === 0;

export const createInitialFoodCommandQuantity = (): number | "" => "";

export type FoodCommandFocus = "protein" | "food" | null;

export type FoodCommandUnit = Product["unit"];

export interface ParsedFoodCommand {
  query: string;
  quantity: number;
  unit: FoodCommandUnit;
  mealType: MealType | null;
}

const FOOD_ACTION_PATTERN =
  /(^|\s)(добавь|добави|додай|запиши|занеси|записати|додати|з'їв|зʼїв|зїла|їла|съел|съела|ел|ела|ate|add|log)(\s|$)/i;

const FOOD_QUANTITY_PATTERN =
  /(?:^|\s)(\d+(?:[.,]\d+)?)\s*(g|гр|гр\.|г|gram|grams|ml|мл|мл\.|milliliter|milliliters|piece|pieces|шт|штука|штуки|порц|порция|порції|порція)(?=\s|$)/i;

const FOOD_MEAL_TYPE_PATTERNS: Array<[MealType, RegExp]> = [
  ["breakfast", /(^|\s)(breakfast|сніданок|завтрак|śniadanie)(?=\s|$)/i],
  ["lunch", /(^|\s)(lunch|обід|обед|lancz)(?=\s|$)/i],
  ["dinner", /(^|\s)(dinner|вечеря|ужин|kolacja)(?=\s|$)/i],
  ["snack", /(^|\s)(snack|перекус|przekąska)(?=\s|$)/i],
];

const FOOD_COMMAND_FILLER_PATTERN =
  /(^|\s)(добавь|добави|додай|запиши|занеси|записати|додати|з'їв|зʼїв|зїла|їла|съел|съела|ел|ела|ate|add|log|на|for|to|meal|food)(?=\s|$)/gi;

const FOOD_MEAL_TYPE_CLEANUP_PATTERN =
  /(^|\s)(breakfast|сніданок|завтрак|śniadanie|lunch|обід|обед|lancz|dinner|вечеря|ужин|kolacja|snack|перекус|przekąska)(?=\s|$)/gi;

const normalizeCommandText = (value: string) =>
  value.trim().replace(/\s+/g, " ");

const normalizeCommandUnit = (value: string): FoodCommandUnit => {
  const normalizedUnit = value.trim().toLowerCase();

  if (
    normalizedUnit === "ml" ||
    normalizedUnit === "мл" ||
    normalizedUnit === "мл." ||
    normalizedUnit === "milliliter" ||
    normalizedUnit === "milliliters"
  ) {
    return "ml";
  }

  if (
    normalizedUnit === "piece" ||
    normalizedUnit === "pieces" ||
    normalizedUnit === "шт" ||
    normalizedUnit === "штука" ||
    normalizedUnit === "штуки" ||
    normalizedUnit === "порц" ||
    normalizedUnit === "порция" ||
    normalizedUnit === "порції" ||
    normalizedUnit === "порція"
  ) {
    return "piece";
  }

  return "g";
};

const readFoodCommandMealType = (value: string): MealType | null => {
  const matchedMealType = FOOD_MEAL_TYPE_PATTERNS.find(([, pattern]) =>
    pattern.test(value)
  );

  return matchedMealType?.[0] ?? null;
};

export const parseFoodCommandText = (value: string): ParsedFoodCommand | null => {
  const normalizedValue = normalizeCommandText(value);

  if (!FOOD_ACTION_PATTERN.test(normalizedValue)) {
    return null;
  }

  const quantityMatch = normalizedValue.match(FOOD_QUANTITY_PATTERN);

  if (!quantityMatch) {
    return null;
  }

  const quantityText = quantityMatch[1];
  const unitText = quantityMatch[2];

  if (!quantityText || !unitText) {
    return null;
  }

  const quantity = Number(quantityText.replace(",", "."));

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return null;
  }

  const mealType = readFoodCommandMealType(normalizedValue);
  const query = normalizeCommandText(
    normalizedValue
      .replace(FOOD_QUANTITY_PATTERN, " ")
      .replace(FOOD_COMMAND_FILLER_PATTERN, " ")
      .replace(FOOD_MEAL_TYPE_CLEANUP_PATTERN, " ")
  );

  if (query.length < 2) {
    return null;
  }

  return {
    query,
    quantity,
    unit: normalizeCommandUnit(unitText),
    mealType,
  };
};

export const isFoodCommandUnitCompatible = (
  commandUnit: FoodCommandUnit,
  productUnit: FoodCommandUnit
) => commandUnit === productUnit;

export const normalizeFoodCommandFocus = (value: string | null): FoodCommandFocus => {
  if (value === "protein") {
    return "protein";
  }

  if (value === "food") {
    return "food";
  }

  return null;
};

export const createFoodCommandFocusQuery = (focus: FoodCommandFocus) => {
  if (focus === "protein") {
    return "protein";
  }

  return "";
};

export const createNutritionGoogleSearchUrl = (query: string) => {
  const normalizedQuery = query.trim().replace(/\s+/g, " ");

  return normalizedQuery.length >= 3
    ? `https://www.google.com/search?q=${encodeURIComponent(
        `${normalizedQuery} nutrition facts calories protein`
      )}`
    : "#";
};
