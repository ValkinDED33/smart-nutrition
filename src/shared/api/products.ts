import type { NutrientKey, Product } from "@domain/products/types";
import {
  createEmptyNutrients,
  setNutrientValue,
} from "@domain/meal/nutrients";
import {
  getRemoteAuthBaseUrl,
  isCloudSyncActive,
} from "./auth";

type ProductSearchResponse = {
  items?: unknown[];
  code?: string;
  message?: string;
};

const PRODUCT_SEARCH_LIMIT = 18;
const FEATURED_PRODUCT_LIMIT = 12;
const PRODUCT_LOOKUP_TIMEOUT_MS = 12_000;

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

const productSources = new Set<Product["source"]>([
  "USDA",
  "OpenFoodFacts",
  "Manual",
  "Recipe",
]);

const productUnits = new Set<Product["unit"]>(["g", "ml", "piece"]);
const productStatuses = new Set<Product["status"]>([
  "pending",
  "approved",
  "rejected",
  "personal",
]);

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

const normalizeOptionalText = (value: unknown, maxLength = 180) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, " ").trim().slice(0, maxLength);

  return normalized || undefined;
};

const normalizeFactToken = (value: unknown, maxLength = 80) => {
  const text = normalizeOptionalText(value, maxLength);

  if (!text) {
    return undefined;
  }

  return text
    .replace(/^[a-z]{2}:/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || undefined;
};

const normalizeStringArray = (value: unknown, maxLength = 80) =>
  Array.isArray(value)
    ? [
        ...new Set(
          value
            .map((item) => normalizeFactToken(item, maxLength))
            .filter((item): item is string => Boolean(item))
        ),
      ].slice(0, 16)
    : undefined;

const normalizeIngredientsTextByLanguage = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const byLanguage = {
    uk: normalizeOptionalText(record.uk, 1200),
    pl: normalizeOptionalText(record.pl, 1200),
    en: normalizeOptionalText(record.en, 1200),
  };
  const entries = Object.entries(byLanguage).filter(([, text]) => Boolean(text));

  return entries.length > 0
    ? (Object.fromEntries(entries) as NonNullable<Product["facts"]>["ingredientsTextByLanguage"])
    : undefined;
};

const normalizeProductFacts = (value: unknown, productUnit: Product["unit"]) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const servingQuantity = toNumber(record.servingQuantity);
  const servingUnit = productUnits.has(record.servingUnit as Product["unit"])
    ? (record.servingUnit as Product["unit"])
    : undefined;
  const facts: Product["facts"] = {
    foodGroup: normalizeFactToken(record.foodGroup, 120),
    carbohydrateTypes: normalizeStringArray(record.carbohydrateTypes),
    proteinTypes: normalizeStringArray(record.proteinTypes),
    fatTypes: normalizeStringArray(record.fatTypes),
    extraCompounds: normalizeStringArray(record.extraCompounds),
    ingredientsText: normalizeOptionalText(record.ingredientsText, 1200),
    ingredientsTextByLanguage: normalizeIngredientsTextByLanguage(
      record.ingredientsTextByLanguage
    ),
    additivesText: normalizeOptionalText(record.additivesText, 900),
    allergens: normalizeStringArray(record.allergens),
    traces: normalizeStringArray(record.traces),
    servingSize: normalizeOptionalText(record.servingSize, 120),
    servingQuantity:
      servingQuantity > 0 && servingUnit === productUnit
        ? Math.min(servingQuantity, 100000)
        : undefined,
    servingUnit: servingUnit === productUnit ? servingUnit : undefined,
  };
  const hasFacts = Object.values(facts).some((fact) =>
    Array.isArray(fact) ? fact.length > 0 : Boolean(fact)
  );

  return hasFacts ? facts : undefined;
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
  const rawUnit = toString(record.unit);
  const unit = productUnits.has(rawUnit as Product["unit"])
    ? (rawUnit as Product["unit"])
    : "g";
  const rawNutrients =
    record.nutrients && typeof record.nutrients === "object" && !Array.isArray(record.nutrients)
      ? (record.nutrients as Record<string, unknown>)
      : {};

  (Object.keys(nutrients) as NutrientKey[]).forEach((key) => {
    const rawValue = Object.entries(rawNutrients).find(
      ([nutrientKey]) => nutrientKey === key
    )?.[1];

    setNutrientValue(nutrients, key, Math.max(toNumber(rawValue), 0));
  });

  return {
    id,
    name,
    unit,
    source: productSources.has(source as Product["source"])
      ? (source as Product["source"])
      : "Manual",
    nutrients,
    brand: toString(record.brand) || undefined,
    barcode: toString(record.barcode) || undefined,
    category: toString(record.category) || undefined,
    imageUrl: toString(record.imageUrl) || undefined,
    status: productStatuses.has(record.status as Product["status"])
      ? (record.status as Product["status"])
      : undefined,
    facts: normalizeProductFacts(record.facts, unit),
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

export const fetchProductByBarcode = async (
  barcode: string
): Promise<Product | null> => {
  const normalizedBarcode = barcode.replace(/\D/g, "");

  if (!normalizedBarcode) {
    return null;
  }

  const products = await fetchBackendProducts({
    query: normalizedBarcode,
    limit: PRODUCT_SEARCH_LIMIT,
  });

  return (
    products.find(
      (product) => product.barcode?.replace(/\D/g, "") === normalizedBarcode
    ) ?? null
  );
};

export const searchProducts = async (query: string): Promise<Product[]> => {
  const normalizedQuery = query.trim();
  const limit = normalizedQuery ? PRODUCT_SEARCH_LIMIT : FEATURED_PRODUCT_LIMIT;
  const backendProducts = await fetchBackendProducts({
    query: normalizedQuery,
    limit,
  });

  return mergeProductsByIdentity(backendProducts).slice(0, limit);
};
