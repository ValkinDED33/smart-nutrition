import type { NutrientKey, Product, ProductSource } from "../types/product";
import { createEmptyNutrients, type NutrientUnit } from "../lib/nutrients";
import {
  getRemoteAuthBaseUrl,
  isCloudSyncActive,
} from "./auth";

type ProductSearchResponse = {
  items?: unknown[];
};

const PRODUCT_SEARCH_LIMIT = 18;
const FEATURED_PRODUCT_LIMIT = 12;

const productSources = new Set<ProductSource>([
  "USDA",
  "OpenFoodFacts",
  "Manual",
  "Recipe",
]);

const productUnits = new Set<Product["unit"]>(["g", "ml", "piece"]);

const toString = (value: unknown, fallback = "") =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const toNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value)
    ? value
    : typeof value === "string"
      ? Number.parseFloat(value) || 0
      : 0;

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
    throw new Error("Backend session is required for product lookup.");
  }

  const baseUrl = getRemoteAuthBaseUrl();

  if (!baseUrl) {
    throw new Error("Backend unavailable for product lookup.");
  }

  return baseUrl.replace(/\/+$/, "");
};

const fetchBackendProducts = async ({
  query,
  limit,
}: {
  query: string;
  limit: number;
}) => {
  const baseUrl = requireProductBackendBaseUrl();
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });
  const response = await fetch(`${baseUrl}/products/search?${params.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Product lookup failed.");
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

  return fetchBackendProducts({
    query: normalizedQuery,
    limit: normalizedQuery ? PRODUCT_SEARCH_LIMIT : FEATURED_PRODUCT_LIMIT,
  });
};

export type { NutrientUnit };
