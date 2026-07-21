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
