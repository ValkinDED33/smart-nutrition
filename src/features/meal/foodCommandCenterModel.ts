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

export const createNutritionGoogleSearchUrl = (query: string) => {
  const normalizedQuery = query.trim().replace(/\s+/g, " ");

  return normalizedQuery.length >= 3
    ? `https://www.google.com/search?q=${encodeURIComponent(
        `${normalizedQuery} nutrition facts calories protein`
      )}`
    : "#";
};
