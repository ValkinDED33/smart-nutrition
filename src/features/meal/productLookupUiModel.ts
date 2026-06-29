export const MIN_PRODUCT_LOOKUP_QUERY_LENGTH = 2;

export const normalizeProductLookupQuery = (query: string) =>
  query.trim().replace(/\s+/g, " ");

export const shouldRunOnlineProductLookup = (
  query: string,
  minLength = MIN_PRODUCT_LOOKUP_QUERY_LENGTH
) => normalizeProductLookupQuery(query).length >= minLength;

export type ProductLookupUiState =
  | "idle"
  | "searching"
  | "error"
  | "empty"
  | "ready";

export const resolveProductLookupUiState = ({
  query,
  isFetching,
  isError,
  resultCount,
}: {
  query: string;
  isFetching: boolean;
  isError: boolean;
  resultCount: number;
}): ProductLookupUiState => {
  if (!shouldRunOnlineProductLookup(query)) {
    return "idle";
  }

  if (isFetching) {
    return "searching";
  }

  if (isError) {
    return "error";
  }

  return resultCount > 0 ? "ready" : "empty";
};
