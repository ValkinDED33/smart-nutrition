const OPEN_FOOD_FACTS_PROVIDER = "openfoodfacts";
const USDA_PROVIDER = "usda";
const OPEN_FOOD_FACTS_BASE_URLS = [
  "https://world.openfoodfacts.org",
  "https://world.openfoodfacts.net",
];
const USDA_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
const FEATURED_QUERIES = ["oats", "chicken breast", "greek yogurt", "banana"];
const BARCODE_PATTERN = /^\d{8,14}$/;
const COMMON_PRODUCT_QUERY_ALIASES = new Map([
  ["куриное филе", ["chicken breast", "chicken fillet"]],
  ["куряче філе", ["chicken breast", "chicken fillet"]],
  ["куряче филе", ["chicken breast", "chicken fillet"]],
  ["куриная грудка", ["chicken breast"]],
  ["куряча грудка", ["chicken breast"]],
  ["рис вареный", ["cooked rice", "rice cooked"]],
  ["рис варений", ["cooked rice", "rice cooked"]],
  ["вареный рис", ["cooked rice", "rice cooked"]],
  ["варений рис", ["cooked rice", "rice cooked"]],
  ["огурец", ["cucumber"]],
  ["огірок", ["cucumber"]],
  ["помидор", ["tomato"]],
  ["помідор", ["tomato"]],
  ["томат", ["tomato"]],
  ["яйцо", ["egg"]],
  ["яйце", ["egg"]],
  ["гречка", ["buckwheat"]],
  ["гречана каша", ["buckwheat cooked"]],
  ["овсянка", ["oats", "oatmeal"]],
  ["вівсянка", ["oats", "oatmeal"]],
  ["творог", ["cottage cheese"]],
  ["сир кисломолочний", ["cottage cheese"]],
  ["картофель", ["potato"]],
  ["картопля", ["potato"]],
  ["яблоко", ["apple"]],
  ["яблуко", ["apple"]],
  ["банан", ["banana"]],
  ["лосось", ["salmon"]],
  ["тунец", ["tuna"]],
  ["тунець", ["tuna"]],
  ["молоко", ["milk"]],
  ["сыр", ["cheese"]],
  ["сир", ["cheese"]],
  ["filet z kurczaka", ["chicken breast", "chicken fillet"]],
  ["pierś z kurczaka", ["chicken breast"]],
  ["piers z kurczaka", ["chicken breast"]],
  ["ryż gotowany", ["cooked rice", "rice cooked"]],
  ["ryz gotowany", ["cooked rice", "rice cooked"]],
  ["gotowany ryż", ["cooked rice", "rice cooked"]],
  ["gotowany ryz", ["cooked rice", "rice cooked"]],
  ["ogórek", ["cucumber"]],
  ["ogorek", ["cucumber"]],
  ["pomidor", ["tomato"]],
  ["jajko", ["egg"]],
  ["kasza gryczana", ["buckwheat cooked", "buckwheat"]],
  ["owsianka", ["oats", "oatmeal"]],
  ["płatki owsiane", ["oats", "oatmeal"]],
  ["platki owsiane", ["oats", "oatmeal"]],
  ["twaróg", ["cottage cheese"]],
  ["twarog", ["cottage cheese"]],
  ["ziemniak", ["potato"]],
  ["jabłko", ["apple"]],
  ["jablko", ["apple"]],
  ["łosoś", ["salmon"]],
  ["losos", ["salmon"]],
  ["tuńczyk", ["tuna"]],
  ["tunczyk", ["tuna"]],
  ["mleko", ["milk"]],
  ["ser", ["cheese"]],
]);

export class ProductLookupProviderError extends Error {
  constructor(message = "External product lookup is unavailable.") {
    super(message);
    this.name = "ProductLookupProviderError";
    this.code = "PRODUCT_LOOKUP_PROVIDER_UNAVAILABLE";
    this.statusCode = 502;
  }
}

const toSafeErrorMessage = (value) => {
  const message = String(value ?? "").replace(/\s+/g, " ").trim();
  return message ? message.slice(0, 220) : null;
};

const normalizeText = (value, { maxLength = 160 } = {}) =>
  String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maxLength);

const normalizeLookupKey = (value) =>
  normalizeText(value, { maxLength: 120 })
    .toLocaleLowerCase("uk-UA")
    .replace(/ё/g, "е")
    .replace(/[’']/g, "")
    .trim();

const uniqueSearchQueries = (queries) => {
  const seen = new Set();

  return queries.filter((query) => {
    const normalized = normalizeLookupKey(query);

    if (!normalized || seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
};

const expandSearchQueries = (search) => {
  const normalizedSearch = normalizeText(search, { maxLength: 120 });

  if (!normalizedSearch) {
    return FEATURED_QUERIES.slice(0, Math.min(FEATURED_QUERIES.length, 4));
  }

  const aliasKey = normalizeLookupKey(normalizedSearch);
  const aliases = COMMON_PRODUCT_QUERY_ALIASES.get(aliasKey) ?? [];

  return uniqueSearchQueries([normalizedSearch, ...aliases]).slice(0, 4);
};

const normalizeOptionalText = (value, maxLength = 160) => {
  const nextValue = normalizeText(value, { maxLength });
  return nextValue || null;
};

const toNumber = (value, fallback = 0) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
};

const clampNumber = (value, { min = 0, max = 100000 } = {}) =>
  Math.min(Math.max(value, min), max);

const readPositiveInteger = (value, fallback) => {
  const nextValue = Number(value);
  return Number.isInteger(nextValue) && nextValue > 0 ? nextValue : fallback;
};

const normalizeImageUrl = (value) => {
  if (typeof value !== "string" || value.length > 500) {
    return null;
  }

  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
};

const createNutrients = ({
  calories = 0,
  protein = 0,
  fat = 0,
  saturatedFat = 0,
  transFat = 0,
  carbs = 0,
  fiber = 0,
  sugars = 0,
  sodium = 0,
} = {}) => ({
  calories: clampNumber(calories),
  protein: clampNumber(protein),
  fat: clampNumber(fat),
  saturatedFat: clampNumber(saturatedFat),
  transFat: clampNumber(transFat),
  carbs: clampNumber(carbs),
  fiber: clampNumber(fiber),
  sugars: clampNumber(sugars),
  sodium: clampNumber(sodium),
});

const hasUsefulNutrition = (nutrients) =>
  nutrients.calories > 0 ||
  nutrients.protein > 0 ||
  nutrients.fat > 0 ||
  nutrients.carbs > 0;

const firstCsvValue = (value) =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .find(Boolean) ?? null;

const cleanCategory = (value) =>
  normalizeOptionalText(String(value ?? "").replace(/^[a-z]{2}:/i, "").replace(/-/g, " "), 120);

const OPEN_FOOD_FACTS_FIELDS = [
  "code",
  "product_name",
  "product_name_en",
  "generic_name",
  "abbreviated_product_name",
  "brands",
  "categories",
  "categories_tags",
  "labels_tags",
  "quantity",
  "serving_size",
  "serving_quantity",
  "ingredients_text",
  "ingredients_text_en",
  "ingredients_text_pl",
  "ingredients_text_uk",
  "image_front_url",
  "image_url",
  "nutriments",
].join(",");

const LIQUID_CATEGORY_PATTERN =
  /\b(beverage|beverages|drink|drinks|soft drinks?|soda|cola|water|juice|nectar|energy drink|iced tea|tea-based beverage|coffee drinks?)\b/i;
const LIQUID_SIZE_PATTERN = /\b\d+(?:[.,]\d+)?\s*(?:ml|milliliters?|millilitres?|l|liters?|litres?)\b/i;

const parseOpenFoodFactsQuantity = (value) => {
  const text = normalizeText(value, { maxLength: 80 });
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*(ml|milliliters?|millilitres?|l|liters?|litres?|g|grams?|kg|kilograms?)\b/i);

  if (!match) {
    return null;
  }

  const amount = Number(match[1].replace(",", "."));
  const unit = match[2].toLowerCase();

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  if (unit === "l" || unit.startsWith("liter") || unit.startsWith("litre")) {
    return { quantity: Math.round(amount * 1000), unit: "ml" };
  }

  if (unit === "kg" || unit.startsWith("kilogram")) {
    return { quantity: Math.round(amount * 1000), unit: "g" };
  }

  return {
    quantity: Math.round(amount),
    unit: unit.startsWith("ml") || unit.startsWith("milli") ? "ml" : "g",
  };
};

const readOpenFoodFactsServing = (rawProduct) =>
  parseOpenFoodFactsQuantity(rawProduct.serving_size) ??
  parseOpenFoodFactsQuantity(rawProduct.quantity) ??
  null;

const hasNutrimentForBaseUnit = (nutriments, unit) =>
  Object.keys(nutriments).some((key) => key.endsWith(`_100${unit}`));

const resolveOpenFoodFactsUnit = ({ rawProduct, category, nutriments }) => {
  const serving = readOpenFoodFactsServing(rawProduct);
  const categories = [
    category,
    rawProduct.categories,
    ...(Array.isArray(rawProduct.categories_tags) ? rawProduct.categories_tags : []),
  ]
    .filter(Boolean)
    .join(" ");
  const hasLiquidNutrients = hasNutrimentForBaseUnit(nutriments, "ml");
  const hasLiquidSize =
    serving?.unit === "ml" ||
    LIQUID_SIZE_PATTERN.test(String(rawProduct.quantity ?? "")) ||
    LIQUID_SIZE_PATTERN.test(String(rawProduct.serving_size ?? ""));

  return hasLiquidNutrients || hasLiquidSize || LIQUID_CATEGORY_PATTERN.test(categories)
    ? "ml"
    : "g";
};

const readNutrimentPerBase = (nutriments, key, unit, fallback = 0) => {
  const unitValue = toNumber(nutriments[`${key}_100${unit}`], NaN);

  if (Number.isFinite(unitValue)) {
    return unitValue;
  }

  const gramValue = toNumber(nutriments[`${key}_100g`], NaN);

  if (Number.isFinite(gramValue)) {
    return gramValue;
  }

  return toNumber(nutriments[key], fallback);
};

const readOpenFoodFactsEnergyKcal = (nutriments, unit) => {
  const unitEnergyKcal = toNumber(nutriments[`energy-kcal_100${unit}`], NaN);

  if (Number.isFinite(unitEnergyKcal)) {
    return unitEnergyKcal;
  }

  const gramEnergyKcal = toNumber(nutriments["energy-kcal_100g"], NaN);

  if (Number.isFinite(gramEnergyKcal)) {
    return gramEnergyKcal;
  }

  const directEnergyKcal = toNumber(nutriments["energy-kcal"], NaN);

  if (Number.isFinite(directEnergyKcal)) {
    return directEnergyKcal;
  }

  const unitEnergyKj = toNumber(nutriments[`energy_100${unit}`], NaN);

  if (Number.isFinite(unitEnergyKj)) {
    return unitEnergyKj / 4.184;
  }

  return toNumber(nutriments.energy_100g, 0) / 4.184;
};

const readOpenFoodFactsIngredients = (rawProduct) =>
  normalizeOptionalText(
    rawProduct.ingredients_text_uk ||
      rawProduct.ingredients_text_en ||
      rawProduct.ingredients_text_pl ||
      rawProduct.ingredients_text,
    900
  );

const parseOpenFoodFactsProduct = (rawProduct) => {
  if (!rawProduct || typeof rawProduct !== "object" || Array.isArray(rawProduct)) {
    return null;
  }

  const productName = normalizeText(
    rawProduct.product_name ||
      rawProduct.product_name_en ||
      rawProduct.generic_name ||
      rawProduct.abbreviated_product_name
  );

  if (!productName) {
    return null;
  }

  const nutriments =
    rawProduct.nutriments &&
    typeof rawProduct.nutriments === "object" &&
    !Array.isArray(rawProduct.nutriments)
      ? rawProduct.nutriments
      : {};
  const category =
    cleanCategory(Array.isArray(rawProduct.categories_tags) ? rawProduct.categories_tags[0] : null) ||
    cleanCategory(firstCsvValue(rawProduct.categories));
  const unit = resolveOpenFoodFactsUnit({ rawProduct, category, nutriments });
  const serving = readOpenFoodFactsServing(rawProduct);
  const servingMatchesUnit = serving?.unit === unit;
  const ingredientsText = readOpenFoodFactsIngredients(rawProduct);
  const energyKcal = readOpenFoodFactsEnergyKcal(nutriments, unit);
  const nutrients = createNutrients({
    calories: energyKcal,
    protein: readNutrimentPerBase(nutriments, "proteins", unit),
    fat: readNutrimentPerBase(nutriments, "fat", unit),
    saturatedFat: readNutrimentPerBase(nutriments, "saturated-fat", unit),
    transFat: readNutrimentPerBase(nutriments, "trans-fat", unit),
    carbs: readNutrimentPerBase(nutriments, "carbohydrates", unit),
    fiber: readNutrimentPerBase(nutriments, "fiber", unit),
    sugars: readNutrimentPerBase(nutriments, "sugars", unit),
    sodium:
      readNutrimentPerBase(nutriments, "sodium", unit, NaN) * 1000 ||
      readNutrimentPerBase(nutriments, "salt", unit, 0) * 393.4,
  });

  if (!hasUsefulNutrition(nutrients)) {
    return null;
  }

  const barcode = normalizeOptionalText(rawProduct.code, 64);
  const id = barcode
    ? `openfoodfacts-${barcode}`
    : `openfoodfacts-${productName.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}`;

  return {
    id,
    ownerUserId: null,
    name: productName,
    brand: normalizeOptionalText(firstCsvValue(rawProduct.brands), 120),
    barcode,
    category,
    imageUrl: normalizeImageUrl(rawProduct.image_front_url ?? rawProduct.image_url),
    unit,
    source: "OpenFoodFacts",
    nutrients,
    facts: {
      foodGroup: category ?? undefined,
      ingredientsText: ingredientsText ?? undefined,
      servingSize: normalizeOptionalText(rawProduct.serving_size ?? rawProduct.quantity, 80) ?? undefined,
      servingQuantity: servingMatchesUnit ? serving.quantity : undefined,
      servingUnit: servingMatchesUnit ? serving.unit : undefined,
      extraCompounds: Array.isArray(rawProduct.labels_tags)
        ? rawProduct.labels_tags.slice(0, 8).map((item) => String(item))
        : undefined,
    },
    status: "approved",
  };
};

const readUsdaNutrient = (food, nutrientIds, nameFragments = []) => {
  const nutrients = Array.isArray(food?.foodNutrients) ? food.foodNutrients : [];
  const match = nutrients.find((item) => {
    const nutrientId = Number(item.nutrientId ?? item.nutrientNumber);
    const name = String(item.nutrientName ?? item.name ?? "").toLowerCase();

    return (
      nutrientIds.includes(nutrientId) ||
      nameFragments.some((fragment) => name.includes(fragment))
    );
  });

  if (!match) {
    return 0;
  }

  return toNumber(match.value ?? match.amount);
};

const parseUsdaProduct = (food) => {
  if (!food || typeof food !== "object" || Array.isArray(food)) {
    return null;
  }

  const name = normalizeText(food.description);

  if (!name) {
    return null;
  }

  const nutrients = createNutrients({
    calories: readUsdaNutrient(food, [1008], ["energy"]),
    protein: readUsdaNutrient(food, [1003], ["protein"]),
    fat: readUsdaNutrient(food, [1004], ["total lipid", "fat"]),
    carbs: readUsdaNutrient(food, [1005], ["carbohydrate"]),
    fiber: readUsdaNutrient(food, [1079], ["fiber"]),
    sugars: readUsdaNutrient(food, [2000], ["sugars"]),
    sodium: readUsdaNutrient(food, [1093], ["sodium"]),
  });

  if (!hasUsefulNutrition(nutrients)) {
    return null;
  }

  const fdcId = normalizeText(food.fdcId, { maxLength: 64 });
  const barcode = normalizeOptionalText(food.gtinUpc, 64);

  return {
    id: `usda-${fdcId || name.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}`,
    ownerUserId: null,
    name,
    brand: normalizeOptionalText(food.brandName ?? food.brandOwner, 120),
    barcode,
    category: normalizeOptionalText(food.foodCategory, 120),
    imageUrl: null,
    unit: "g",
    source: "USDA",
    nutrients,
    facts: {
      foodGroup: normalizeOptionalText(food.foodCategory, 120) ?? undefined,
      extraCompounds: normalizeOptionalText(food.dataType, 80)
        ? [normalizeText(food.dataType, { maxLength: 80 })]
        : undefined,
    },
    status: "approved",
  };
};

const createAbortSignal = (timeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
};

const fetchJson = async ({ fetchImpl, url, timeoutMs, headers = {} }) => {
  const abort = createAbortSignal(timeoutMs);

  try {
    const response = await fetchImpl(url, {
      method: "GET",
      headers,
      signal: abort.signal,
    });

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } finally {
    abort.clear();
  }
};

const fetchJsonFromFirstAvailableUrl = async ({
  fetchImpl,
  urls,
  timeoutMs,
  headers = {},
}) => {
  let lastError = null;

  for (const url of urls) {
    try {
      return await fetchJson({
        fetchImpl,
        url,
        timeoutMs,
        headers,
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("No product lookup URL configured.");
};

const mergeProductsByIdentity = (products) => {
  const merged = new Map();

  products.forEach((product) => {
    if (!product) {
      return;
    }

    const identity =
      product.barcode?.replace(/\D/g, "") ||
      `${String(product.source ?? "").toLowerCase()}-${product.name
        .trim()
        .toLowerCase()}-${String(product.brand ?? "").trim().toLowerCase()}`;

    if (!merged.has(identity)) {
      merged.set(identity, product);
    }
  });

  return [...merged.values()];
};

const logLookupWarning = (logger, details) => {
  logger?.warn?.("[products] external lookup failed", {
    provider: details.provider,
    status: details.status ?? null,
    code: toSafeErrorMessage(details.code ?? details.name),
    message: toSafeErrorMessage(details.message),
  });
};

export const createProductLookupService = ({
  config = {},
  logger = console,
  fetchImpl = globalThis.fetch,
} = {}) => {
  const openFoodFactsEnabled = config.openFoodFactsEnabled !== false;
  const usdaApiKey = String(config.usdaApiKey ?? "").trim();
  const timeoutMs = readPositiveInteger(config.productLookupTimeoutMs, 3500);
  const configured = Boolean(fetchImpl && (openFoodFactsEnabled || usdaApiKey));

  const fetchOpenFoodFactsSearch = async ({ search, limit }) => {
    const params = new URLSearchParams({
      search_terms: search,
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: String(limit),
      fields: OPEN_FOOD_FACTS_FIELDS,
    });
    const path = `/cgi/search.pl?${params.toString()}`;
    const payload = await fetchJsonFromFirstAvailableUrl({
      fetchImpl,
      urls: OPEN_FOOD_FACTS_BASE_URLS.map((baseUrl) => `${baseUrl}${path}`),
      timeoutMs,
      headers: {
        Accept: "application/json",
        "User-Agent": "SmartNutrition/1.0 (https://smart-nutrition.club)",
      },
    });

    return Array.isArray(payload?.products)
      ? payload.products.map(parseOpenFoodFactsProduct).filter(Boolean)
      : [];
  };

  const fetchOpenFoodFactsBarcode = async ({ barcode }) => {
    const params = new URLSearchParams({
      fields: OPEN_FOOD_FACTS_FIELDS,
    });
    const path = `/api/v2/product/${encodeURIComponent(
      barcode
    )}.json?${params.toString()}`;
    const payload = await fetchJsonFromFirstAvailableUrl({
      fetchImpl,
      urls: OPEN_FOOD_FACTS_BASE_URLS.map((baseUrl) => `${baseUrl}${path}`),
      timeoutMs,
      headers: {
        Accept: "application/json",
        "User-Agent": "SmartNutrition/1.0 (https://smart-nutrition.club)",
      },
    });
    const product =
      payload?.status === 1 ? parseOpenFoodFactsProduct(payload.product) : null;

    return product ? [product] : [];
  };

  const fetchUsdaSearch = async ({ search, limit }) => {
    if (!usdaApiKey) {
      return [];
    }

    const params = new URLSearchParams({
      api_key: usdaApiKey,
      query: search,
      pageSize: String(limit),
    });
    const payload = await fetchJson({
      fetchImpl,
      url: `${USDA_SEARCH_URL}?${params.toString()}`,
      timeoutMs,
      headers: {
        Accept: "application/json",
      },
    });

    return Array.isArray(payload?.foods)
      ? payload.foods.map(parseUsdaProduct).filter(Boolean)
      : [];
  };

  const runProvider = async (provider, producer) => {
    try {
      return {
        failed: false,
        products: await producer(),
      };
    } catch (error) {
      logLookupWarning(logger, {
        provider,
        status: error?.status,
        code: error?.code ?? error?.name,
        message: error?.message,
      });
      return {
        failed: true,
        products: [],
      };
    }
  };

  const searchProducts = async ({ search = "", limit = 24 } = {}) => {
    if (!configured) {
      return [];
    }

    const normalizedSearch = normalizeText(search, { maxLength: 120 });
    const normalizedLimit = readPositiveInteger(limit, 24);
    const barcode = normalizedSearch.replace(/\D/g, "");
    const isBarcodeSearch = BARCODE_PATTERN.test(barcode);
    const searchQueries = expandSearchQueries(normalizedSearch);
    const perQueryLimit = Math.max(4, Math.ceil(normalizedLimit / searchQueries.length) + 2);
    const providerCalls = [];

    if (openFoodFactsEnabled && isBarcodeSearch) {
      providerCalls.push(
        runProvider(OPEN_FOOD_FACTS_PROVIDER, () =>
          fetchOpenFoodFactsBarcode({ barcode })
        )
      );
    }

    if (openFoodFactsEnabled) {
      searchQueries.forEach((query) => {
        providerCalls.push(
          runProvider(OPEN_FOOD_FACTS_PROVIDER, () =>
            fetchOpenFoodFactsSearch({ search: query, limit: perQueryLimit })
          )
        );
      });
    }

    if (usdaApiKey && !isBarcodeSearch) {
      searchQueries.forEach((query) => {
        providerCalls.push(
          runProvider(USDA_PROVIDER, () =>
            fetchUsdaSearch({ search: query, limit: perQueryLimit })
          )
        );
      });
    }

    if (providerCalls.length === 0) {
      return [];
    }

    const providerResults = await Promise.all(providerCalls);
    const products = mergeProductsByIdentity(
      providerResults.flatMap((result) => result.products)
    );
    logger?.debug?.("[products] external lookup completed", {
      queryLength: normalizedSearch.length,
      queryVariants: searchQueries.length,
      providerCalls: providerResults.length,
      failedProviderCalls: providerResults.filter((result) => result.failed).length,
      resultCount: products.length,
    });

    if (products.length === 0 && providerResults.every((result) => result.failed)) {
      throw new ProductLookupProviderError();
    }

    return products.slice(0, normalizedLimit);
  };

  const getStatus = () => ({
    configured,
    provider: "external-products",
    timeoutMs,
    providers: [
      {
        id: OPEN_FOOD_FACTS_PROVIDER,
        configured: Boolean(fetchImpl && openFoodFactsEnabled),
        requiresApiKey: false,
      },
      {
        id: USDA_PROVIDER,
        configured: Boolean(fetchImpl && usdaApiKey),
        requiresApiKey: true,
      },
    ],
  });

  return {
    isConfigured: () => configured,
    getStatus,
    searchProducts,
  };
};
