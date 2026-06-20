import type { Product } from "@domain/products/types";
import { searchCatalogProducts } from "@domain/products/productCatalog";
import { createProductKey } from "./productIdentity";

interface ProductSuggestionInput {
  query: string;
  onlineProducts?: Product[];
  savedProducts?: Product[];
  recentProducts?: Product[];
  personalBarcodeProducts?: Product[];
  limit?: number;
}

const normalizeSearchText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

const productMatchesQuery = (product: Product, normalizedQuery: string) => {
  if (!normalizedQuery) {
    return true;
  }

  const searchableText = normalizeSearchText(
    [
      product.name,
      product.brand,
      product.category,
      product.barcode,
      product.facts?.foodGroup,
    ]
      .filter(Boolean)
      .join(" ")
  );

  return searchableText.includes(normalizedQuery);
};

const pushUniqueProducts = (
  target: Product[],
  seen: Set<string>,
  products: Product[],
  normalizedQuery: string,
  limit: number
) => {
  products.forEach((product) => {
    if (target.length >= limit || !productMatchesQuery(product, normalizedQuery)) {
      return;
    }

    const key = createProductKey(product);

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    target.push(product);
  });
};

export const getProductSuggestions = ({
  query,
  onlineProducts = [],
  savedProducts = [],
  recentProducts = [],
  personalBarcodeProducts = [],
  limit = 12,
}: ProductSuggestionInput): Product[] => {
  const normalizedQuery = normalizeSearchText(query);
  const result: Product[] = [];
  const seen = new Set<string>();
  const safeLimit = Math.max(1, Math.min(limit, 24));

  pushUniqueProducts(result, seen, onlineProducts, normalizedQuery, safeLimit);
  pushUniqueProducts(result, seen, savedProducts, normalizedQuery, safeLimit);
  pushUniqueProducts(result, seen, recentProducts, normalizedQuery, safeLimit);
  pushUniqueProducts(result, seen, personalBarcodeProducts, normalizedQuery, safeLimit);

  if (result.length < safeLimit) {
    pushUniqueProducts(
      result,
      seen,
      searchCatalogProducts(normalizedQuery, safeLimit),
      normalizedQuery,
      safeLimit
    );
  }

  return result;
};
