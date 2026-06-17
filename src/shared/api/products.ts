import type { NutrientKey, Product, ProductSource } from "@domain/products/types";
import { createEmptyNutrients, type NutrientUnit } from "@domain/meal/nutrients";
import {
  getRemoteAuthBaseUrl,
  isCloudSyncActive,
} from "./auth";

type ProductSearchResponse = {
  items?: unknown[];
  code?: string;
  message?: string;
};

type OpenFoodFactsProduct = {
  product_name?: unknown;
  brands?: unknown;
  code?: unknown;
  nutriments?: unknown;
  image_front_url?: unknown;
  categories_tags?: unknown;
};

type OpenFoodFactsSearchResponse = {
  products?: unknown[];
};

type OpenFoodFactsBarcodeResponse = {
  product?: unknown;
  status?: unknown;
};

const PRODUCT_SEARCH_LIMIT = 18;
const FEATURED_PRODUCT_LIMIT = 12;
const PRODUCT_LOOKUP_TIMEOUT_MS = 12_000;
const OPEN_FOOD_FACTS_BASE_URL = "https://world.openfoodfacts.org";
const OPEN_FOOD_FACTS_SEARCH_FIELDS = [
  "product_name",
  "brands",
  "nutriments",
  "image_front_url",
  "code",
  "categories_tags",
].join(",");

export type ProductLookupErrorCode =
  | "PRODUCT_LOOKUP_AUTH_REQUIRED"
  | "PRODUCT_LOOKUP_BACKEND_UNAVAILABLE"
  | "PRODUCT_LOOKUP_FAILED";

export class ProductLookupError extends Error {
  code: ProductLookupErrorCode;
  status?: number;

  constructor(
    code: ProductLookupErrorCode,
    message: string,
    status?: number
  ) {
    super(message);
    this.name = "ProductLookupError";
    this.code = code;
    this.status = status;
  }
}

const productSources = new Set<ProductSource>([
  "USDA",
  "OpenFoodFacts",
  "Manual",
  "Recipe",
]);

const productUnits = new Set<Product["unit"]>(["g", "ml", "piece"]);

const createProductIdentity = (product: Product) =>
  product.barcode?.replace(/\D/g, "") ||
  `${product.name.trim().toLowerCase()}-${product.brand?.trim().toLowerCase() ?? ""}`;

const mergeProductsByIdentity = (products: Product[]) => {
  const merged = new Map<string, Product>();

  products.forEach((product) => {
    const identity = createProductIdentity(product);

    if (!merged.has(identity)) {
      merged.set(identity, product);
    }
  });

  return [...merged.values()];
};

const toString = (value: unknown, fallback = "") =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const toNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value)
    ? value
    : typeof value === "string"
      ? Number.parseFloat(value) || 0
      : 0;

const readOpenFoodFactsNutrient = (
  nutriments: Record<string, unknown>,
  key: string
) => Math.max(toNumber(nutriments[`${key}_100g`] ?? nutriments[key]), 0);

const formatOpenFoodFactsCategory = (value: unknown) => {
  const categories = Array.isArray(value) ? value : [];
  const firstCategory = categories.find((category): category is string =>
    typeof category === "string" && category.trim().length > 0
  );

  if (!firstCategory) {
    return undefined;
  }

  return firstCategory
    .replace(/^[a-z]{2}:/i, "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const readOpenFoodFactsProduct = (value: unknown): Product | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as OpenFoodFactsProduct;
  const name = toString(record.product_name);

  if (!name) {
    return null;
  }

  const code = toString(record.code);
  const nutriments =
    record.nutriments && typeof record.nutriments === "object" && !Array.isArray(record.nutriments)
      ? (record.nutriments as Record<string, unknown>)
      : {};
  const nutrients = createEmptyNutrients();
  const category = formatOpenFoodFactsCategory(record.categories_tags);

  nutrients.calories = readOpenFoodFactsNutrient(nutriments, "energy-kcal");
  nutrients.protein = readOpenFoodFactsNutrient(nutriments, "proteins");
  nutrients.fat = readOpenFoodFactsNutrient(nutriments, "fat");
  nutrients.carbs = readOpenFoodFactsNutrient(nutriments, "carbohydrates");
  nutrients.fiber = readOpenFoodFactsNutrient(nutriments, "fiber");
  nutrients.sugars = readOpenFoodFactsNutrient(nutriments, "sugars");
  nutrients.sodium = readOpenFoodFactsNutrient(nutriments, "sodium");

  return {
    id: code
      ? `openfoodfacts-${code}`
      : `openfoodfacts-${name.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}`,
    name,
    unit: "g",
    source: "OpenFoodFacts",
    nutrients,
    brand: toString(record.brands) || undefined,
    barcode: code || undefined,
    category,
    imageUrl: toString(record.image_front_url) || undefined,
    facts: category ? { foodGroup: category } : undefined,
  };
};

const readProduct = (value: unknown): Product | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = toString(record.id);
  const name = toString(record.name);

  if (!id || !name) {
    return null;
  }

  const nutrients = createEmptyNutrients();
  const source = toString(record.source);
  const unit = toString(record.unit);
  const rawNutrients =
    record.nutrients && typeof record.nutrients === "object" && !Array.isArray(record.nutrients)
      ? (record.nutrients as Record<string, unknown>)
      : {};

  (Object.keys(nutrients) as NutrientKey[]).forEach((key) => {
    nutrients[key] = Math.max(toNumber(rawNutrients[key]), 0);
  });

  return {
    id,
    name,
    unit: productUnits.has(unit as Product["unit"]) ? (unit as Product["unit"]) : "g",
    source: productSources.has(source as ProductSource)
      ? (source as ProductSource)
      : "Manual",
    nutrients,
    brand: toString(record.brand) || undefined,
    barcode: toString(record.barcode) || undefined,
    category: toString(record.category) || undefined,
    imageUrl: toString(record.imageUrl) || undefined,
    facts:
      record.facts && typeof record.facts === "object" && !Array.isArray(record.facts)
        ? (record.facts as Product["facts"])
        : undefined,
  };
};

const requireProductBackendBaseUrl = () => {
  if (!isCloudSyncActive()) {
    throw new ProductLookupError(
      "PRODUCT_LOOKUP_AUTH_REQUIRED",
      "Backend session is required for product lookup."
    );
  }

  const baseUrl = getRemoteAuthBaseUrl();

  if (!baseUrl) {
    throw new ProductLookupError(
      "PRODUCT_LOOKUP_BACKEND_UNAVAILABLE",
      "Backend unavailable for product lookup."
    );
  }

  return baseUrl.replace(/\/+$/, "");
};

const createAbortSignal = (timeoutMs: number) => {
  const controller = new AbortController();
  const timerId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    clear: () => globalThis.clearTimeout(timerId),
  };
};

const fetchBackendProducts = async ({
  query,
  limit,
}: {
  query: string;
  limit: number;
}) => {
  const baseUrl = requireProductBackendBaseUrl();
  const timeout = createAbortSignal(PRODUCT_LOOKUP_TIMEOUT_MS);
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });
  let response: Response;

  try {
    response = await fetch(`${baseUrl}/products/search?${params.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
      signal: timeout.signal,
    });
  } catch (error) {
    throw new ProductLookupError(
      "PRODUCT_LOOKUP_BACKEND_UNAVAILABLE",
      error instanceof Error && error.name === "AbortError"
        ? "Product lookup timed out."
        : "Product lookup backend is unavailable."
    );
  } finally {
    timeout.clear();
  }

  if (!response.ok) {
    let payload: ProductSearchResponse = {};

    try {
      payload = (await response.json()) as ProductSearchResponse;
    } catch {
      payload = {};
    }

    throw new ProductLookupError(
      response.status === 401
        ? "PRODUCT_LOOKUP_AUTH_REQUIRED"
        : "PRODUCT_LOOKUP_FAILED",
      payload.message ?? "Product lookup failed.",
      response.status
    );
  }

  const payload = (await response.json()) as ProductSearchResponse;

  return Array.isArray(payload.items)
    ? payload.items.map(readProduct).filter((item): item is Product => item !== null)
    : [];
};

const fetchOpenFoodFactsSearch = async ({
  query,
  limit,
}: {
  query: string;
  limit: number;
}) => {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  const timeout = createAbortSignal(PRODUCT_LOOKUP_TIMEOUT_MS);
  const params = new URLSearchParams({
    search_terms: normalizedQuery,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: String(Math.max(1, Math.min(limit, PRODUCT_SEARCH_LIMIT))),
    fields: OPEN_FOOD_FACTS_SEARCH_FIELDS,
  });

  try {
    const response = await fetch(`${OPEN_FOOD_FACTS_BASE_URL}/cgi/search.pl?${params.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: timeout.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as OpenFoodFactsSearchResponse;

    return Array.isArray(payload.products)
      ? payload.products
          .map(readOpenFoodFactsProduct)
          .filter((item): item is Product => item !== null)
      : [];
  } catch {
    return null;
  } finally {
    timeout.clear();
  }
};

const fetchOpenFoodFactsByBarcode = async (barcode: string) => {
  const normalizedBarcode = barcode.replace(/\D/g, "");

  if (!normalizedBarcode) {
    return null;
  }

  const timeout = createAbortSignal(PRODUCT_LOOKUP_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${OPEN_FOOD_FACTS_BASE_URL}/api/v2/product/${normalizedBarcode}.json?fields=${OPEN_FOOD_FACTS_SEARCH_FIELDS}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: timeout.signal,
      }
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as OpenFoodFactsBarcodeResponse;

    if (payload.status === 0) {
      return null;
    }

    return readOpenFoodFactsProduct(payload.product);
  } catch {
    return null;
  } finally {
    timeout.clear();
  }
};

const canUseDirectOnlineFallback = (error: unknown) =>
  error instanceof ProductLookupError &&
  error.code !== "PRODUCT_LOOKUP_AUTH_REQUIRED";

export const fetchProductByBarcode = async (
  barcode: string
): Promise<Product | null> => {
  const normalizedBarcode = barcode.replace(/\D/g, "");

  if (!normalizedBarcode) {
    return null;
  }

  let products: Product[];

  try {
    products = await fetchBackendProducts({
      query: normalizedBarcode,
      limit: PRODUCT_SEARCH_LIMIT,
    });
  } catch (error) {
    if (!canUseDirectOnlineFallback(error)) {
      throw error;
    }

    return fetchOpenFoodFactsByBarcode(normalizedBarcode);
  }

  return (
    products.find(
      (product) => product.barcode?.replace(/\D/g, "") === normalizedBarcode
    ) ?? null
  );
};

export const searchProducts = async (query: string): Promise<Product[]> => {
  const normalizedQuery = query.trim();
  const limit = normalizedQuery ? PRODUCT_SEARCH_LIMIT : FEATURED_PRODUCT_LIMIT;
  let backendProducts: Product[];

  try {
    backendProducts = await fetchBackendProducts({
      query: normalizedQuery,
      limit,
    });
  } catch (error) {
    if (!canUseDirectOnlineFallback(error) || !normalizedQuery) {
      throw error;
    }

    const fallbackProducts = await fetchOpenFoodFactsSearch({
      query: normalizedQuery,
      limit,
    });

    if (fallbackProducts === null) {
      throw error;
    }

    return mergeProductsByIdentity(fallbackProducts).slice(0, limit);
  }

  return mergeProductsByIdentity(backendProducts).slice(0, limit);
};

export type { NutrientUnit };
