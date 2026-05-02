import axios from "axios";
import type { NutrientKey, Product } from "../types/product";
import {
  getClientStorageItem,
  setClientStorageItem,
} from "../lib/clientPersistence";
import { fetchOpenFoodByBarcode } from "./openFood";
import {
  findLocalProductByBarcode,
  getFeaturedProducts,
  searchLocalProducts,
} from "../lib/mockProducts";
import { createEmptyNutrients, type NutrientUnit } from "../lib/nutrients";

type RawProduct = Record<string, unknown>;

const OFF_SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl";
const BARCODE_CACHE_KEY = "smart-nutrition.barcode-cache";
const SEARCH_CACHE_KEY = "smart-nutrition.search-cache";
const SEARCH_CACHE_TTL_MS = 1000 * 60 * 30;

const offKeyByNutrient: Partial<Record<NutrientKey, string>> = {
  calories: "energy-kcal",
  protein: "proteins",
  fat: "fat",
  saturatedFat: "saturated-fat",
  monounsaturatedFat: "monounsaturated-fat",
  polyunsaturatedFat: "polyunsaturated-fat",
  transFat: "trans-fat",
  omega3: "omega-3-fat",
  omega6: "omega-6-fat",
  omega9: "omega-9-fat",
  cholesterol: "cholesterol",
  carbs: "carbohydrates",
  sugars: "sugars",
  fiber: "fiber",
  starch: "starch",
  glucose: "glucose",
  fructose: "fructose",
  sucrose: "sucrose",
  lactose: "lactose",
  water: "water",
  sodium: "sodium",
  potassium: "potassium",
  vitaminA: "vitamin-a",
  vitaminB: "vitamin-b",
  vitaminB1: "vitamin-b1",
  vitaminB2: "vitamin-b2",
  vitaminB3: "vitamin-b3",
  vitaminB5: "vitamin-b5",
  vitaminB6: "vitamin-b6",
  vitaminB7: "vitamin-b7",
  vitaminB9: "vitamin-b9",
  vitaminB12: "vitamin-b12",
  vitaminC: "vitamin-c",
  vitaminD: "vitamin-d",
  vitaminE: "vitamin-e",
  vitaminK: "vitamin-k",
  calcium: "calcium",
  iron: "iron",
  magnesium: "magnesium",
  zinc: "zinc",
  phosphorus: "phosphorus",
  iodine: "iodine",
  selenium: "selenium",
  copper: "copper",
};

const uniqueProducts = (products: Product[]) => {
  const map = new Map<string, Product>();

  products.forEach((product) => {
    const key =
      product.barcode?.trim() ||
      `${product.name.trim().toLowerCase()}-${product.brand?.trim().toLowerCase() ?? ""}`;

    if (!map.has(key)) {
      map.set(key, product);
    }
  });

  return [...map.values()];
};

const readBarcodeCache = (): Record<string, Product> => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = getClientStorageItem(BARCODE_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Product>) : {};
  } catch {
    return {};
  }
};

const readSearchCache = (): Record<string, { savedAt: number; results: Product[] }> => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = getClientStorageItem(SEARCH_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, { savedAt: number; results: Product[] }>) : {};
  } catch {
    return {};
  }
};

const writeSearchCache = (
  cache: Record<string, { savedAt: number; results: Product[] }>
) => {
  if (typeof window === "undefined") {
    return;
  }

  setClientStorageItem(SEARCH_CACHE_KEY, JSON.stringify(cache));
};

const getCachedSearchResults = (query: string): Product[] | null => {
  const cache = readSearchCache();
  const entry = cache[query];

  if (!entry) {
    return null;
  }

  if (Date.now() - entry.savedAt > SEARCH_CACHE_TTL_MS) {
    delete cache[query];
    writeSearchCache(cache);
    return null;
  }

  return entry.results;
};

const cacheSearchResults = (query: string, results: Product[]) => {
  const cache = readSearchCache();
  const nextEntries = Object.entries({
    ...cache,
    [query]: {
      savedAt: Date.now(),
      results,
    },
  }).slice(-80);

  writeSearchCache(Object.fromEntries(nextEntries));
};

const writeBarcodeCache = (cache: Record<string, Product>) => {
  if (typeof window === "undefined") {
    return;
  }

  setClientStorageItem(BARCODE_CACHE_KEY, JSON.stringify(cache));
};

const getCachedBarcodeProduct = (barcode: string): Product | null => {
  const cache = readBarcodeCache();
  return cache[barcode] ?? null;
};

const cacheBarcodeProduct = (barcode: string, product: Product) => {
  const cache = readBarcodeCache();
  const nextEntries = Object.entries({
    ...cache,
    [barcode]: product,
  }).slice(-240);

  writeBarcodeCache(Object.fromEntries(nextEntries));
};

const parseNumber = (value: unknown) =>
  typeof value === "string"
    ? Number.parseFloat(value) || 0
    : typeof value === "number"
    ? value
    : 0;

const parseStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

const normalizeCategoryTag = (value: string) =>
  value
    .toLowerCase()
    .replace(/^en:/, "")
    .replace(/[_/]+/g, "-")
    .trim();

const readProductCategory = (data: RawProduct) => {
  const categoryTag = parseStringArray(data.categories_tags)
    .map(normalizeCategoryTag)
    .find(Boolean);

  if (categoryTag) {
    return categoryTag;
  }

  if (typeof data.pnns_groups_2 === "string" && data.pnns_groups_2 !== "unknown") {
    return normalizeCategoryTag(data.pnns_groups_2);
  }

  if (typeof data.pnns_groups_1 === "string" && data.pnns_groups_1 !== "unknown") {
    return normalizeCategoryTag(data.pnns_groups_1);
  }

  return typeof data.categories === "string"
    ? normalizeCategoryTag(data.categories.split(",")[0] ?? "")
    : undefined;
};

const normalizeUnit = (value: string | undefined): string | undefined =>
  value
    ?.toLowerCase()
    .replace("μ", "u")
    .replace("µ", "u")
    .replace("mcg", "ug");

const convertValue = (
  value: number,
  fromUnit: string | undefined,
  toUnit: NutrientUnit
) => {
  const normalizedFrom = normalizeUnit(fromUnit);
  const normalizedTo = normalizeUnit(toUnit);

  if (!normalizedFrom || normalizedFrom === normalizedTo) {
    return value;
  }

  const toMilligrams = (amount: number, unit: string) => {
    if (unit === "g") return amount * 1000;
    if (unit === "mg") return amount;
    if (unit === "ug") return amount / 1000;
    return amount;
  };

  if (normalizedFrom === "kj" && normalizedTo === "kcal") {
    return value / 4.184;
  }

  if (
    normalizedFrom &&
    normalizedTo &&
    ["g", "mg", "ug"].includes(normalizedFrom) &&
    ["g", "mg", "ug"].includes(normalizedTo)
  ) {
    const inMilligrams = toMilligrams(value, normalizedFrom);

    if (normalizedTo === "g") return inMilligrams / 1000;
    if (normalizedTo === "mg") return inMilligrams;
    return inMilligrams * 1000;
  }

  return value;
};

const readOFFNutrient = (
  nutriments: Record<string, unknown> | undefined,
  key: NutrientKey
) => {
  const offKey = offKeyByNutrient[key];
  if (!nutriments || !offKey) return 0;

  const value = parseNumber(
    nutriments[`${offKey}_100g`] ?? nutriments[offKey]
  );
  const unit =
    typeof nutriments[`${offKey}_unit`] === "string"
      ? String(nutriments[`${offKey}_unit`])
      : key === "calories"
      ? "kcal"
      : nutrientTargetUnit(key);

  return convertValue(value, unit, key === "calories" ? "kcal" : nutrientTargetUnit(key));
};

const nutrientTargetUnit = (key: NutrientKey): NutrientUnit => {
  const gramKeys: NutrientKey[] = [
    "protein",
    "fat",
    "saturatedFat",
    "monounsaturatedFat",
    "polyunsaturatedFat",
    "transFat",
    "omega3",
    "omega6",
    "omega9",
    "carbs",
    "sugars",
    "fiber",
    "starch",
    "glucose",
    "fructose",
    "sucrose",
    "lactose",
    "water",
  ];
  const microgramKeys: NutrientKey[] = [
    "vitaminA",
    "vitaminB7",
    "vitaminB9",
    "vitaminB12",
    "vitaminD",
    "vitaminK",
    "iodine",
    "selenium",
  ];

  if (gramKeys.includes(key)) return "g";
  if (microgramKeys.includes(key)) return "ug";
  return "mg";
};

const mapToProduct = (data: RawProduct): Product => {
  const nutriments = data.nutriments as Record<string, unknown> | undefined;
  const nutrients = createEmptyNutrients();

  (Object.keys(nutrients) as NutrientKey[]).forEach((key) => {
    if (key === "calories") {
      nutrients[key] =
        readOFFNutrient(nutriments, key) ||
        convertValue(parseNumber(nutriments?.energy_100g), "kj", "kcal");
      return;
    }

    nutrients[key] = readOFFNutrient(nutriments, key);
  });

  return {
    id: String(data._id ?? data.code ?? Date.now()),
    name: String(data.product_name ?? "Unknown product"),
    brand: typeof data.brands === "string" ? data.brands : undefined,
    barcode: typeof data.code === "string" ? data.code : undefined,
    imageUrl:
      typeof data.image_front_small_url === "string"
        ? data.image_front_small_url
        : typeof data.image_small_url === "string"
        ? data.image_small_url
        : typeof data.image_url === "string"
        ? data.image_url
        : undefined,
    unit: "g",
    source: "OpenFoodFacts",
    category: readProductCategory(data),
    nutrients,
  };
};

export const fetchProductByBarcode = async (
  barcode: string
): Promise<Product | null> => {
  const normalizedBarcode = barcode.replace(/\D/g, "");

  if (!normalizedBarcode) {
    return null;
  }

  const localProduct = findLocalProductByBarcode(normalizedBarcode);
  if (localProduct) {
    return localProduct;
  }

  const cachedProduct = getCachedBarcodeProduct(normalizedBarcode);
  if (cachedProduct) {
    return cachedProduct;
  }

  try {
    const off = await fetchOpenFoodByBarcode(normalizedBarcode);
    if (off) {
      const product = mapToProduct({ ...off, code: normalizedBarcode } as RawProduct);
      cacheBarcodeProduct(normalizedBarcode, product);
      return product;
    }

    return null;
  } catch (error) {
    console.error("Product lookup failed:", error);
    return null;
  }
};

export const searchProducts = async (query: string): Promise<Product[]> => {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return getFeaturedProducts(12);
  }

  const localResults = searchLocalProducts(normalizedQuery, 12);
  if (normalizedQuery.length < 2) {
    return localResults;
  }

  const cacheKey = normalizedQuery.toLowerCase();
  const cachedResults = getCachedSearchResults(cacheKey);

  if (cachedResults) {
    return uniqueProducts([...localResults, ...cachedResults]).slice(0, 18);
  }

  try {
    const offResponse = await axios.get(OFF_SEARCH_URL, {
      params: {
        search_terms: normalizedQuery,
        search_simple: 1,
        action: "process",
        json: 1,
        page_size: 12,
        fields:
          "code,product_name,brands,nutriments,image_front_small_url,image_small_url,image_url,categories,categories_tags,pnns_groups_1,pnns_groups_2",
      },
    });

    const offResults = Array.isArray(offResponse.data?.products)
      ? offResponse.data.products
          .map((item: RawProduct) => mapToProduct(item))
          .filter((product: Product) => product.name !== "Unknown product")
      : [];

    const mergedResults = uniqueProducts([...localResults, ...offResults]).slice(0, 18);
    cacheSearchResults(cacheKey, mergedResults);
    return mergedResults;
  } catch (error) {
    console.error("Product search failed:", error);
    return localResults;
  }
};
