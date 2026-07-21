import { describe, expect, it, vi } from "vitest";
import {
  createProductLookupService,
  ProductLookupProviderError,
} from "./productLookupService.mjs";

const createResponse = ({ ok = true, status = 200, body = {} } = {}) => ({
  ok,
  status,
  statusText: ok ? "OK" : "Provider failure",
  json: vi.fn(async () => body),
});

const openFoodFactsProduct = {
  code: "4820000730030",
  product_name: "Greek yogurt",
  brands: "Smart Dairy",
  categories: "Dairies, Yogurts",
  image_front_url: "https://images.openfoodfacts.org/product.jpg",
  nutriments: {
    "energy-kcal_100g": 92,
    proteins_100g: 10,
    fat_100g: 2,
    carbohydrates_100g: 4,
    fiber_100g: 0,
    sugars_100g: 3,
    sodium_100g: 0.04,
  },
};

const openFoodFactsBeverageProduct = {
  code: "5449000000996",
  product_name: "Coca-Cola",
  brands: "Coca Cola",
  categories: "Beverages, Carbonated drinks, Colas",
  categories_tags: ["en:beverages", "en:carbonated-drinks", "en:colas"],
  quantity: "330 ml",
  serving_size: "330 ml",
  ingredients_text_en:
    "Carbonated water, sugar, colour E150d, phosphoric acid, natural flavourings, caffeine.",
  ingredients_text_pl:
    "Woda gazowana, cukier, barwnik E150d, kwas fosforowy, naturalne aromaty, kofeina.",
  additives_tags: ["en:e150d-sulphite-ammonia-caramel", "en:e338-phosphoric-acid"],
  allergens_tags: ["en:milk", "en:gluten"],
  traces_tags: ["en:nuts"],
  nutriments: {
    "energy-kcal_100ml": 42,
    proteins_100ml: 0,
    fat_100ml: 0,
    "saturated-fat_100ml": 0,
    "monounsaturated-fat_100ml": 0.1,
    "polyunsaturated-fat_100ml": 0.2,
    "omega-3-fat_100ml": 0.03,
    "omega-6-fat_100ml": 0.07,
    cholesterol_100ml: 0.001,
    cholesterol_unit: "g",
    carbohydrates_100ml: 10.6,
    sugars_100ml: 10.6,
    glucose_100ml: 3.2,
    fructose_100ml: 2.4,
    sucrose_100ml: 5,
    water_100ml: 89,
    sodium_100ml: 0,
    potassium_100ml: 11,
    "vitamin-a_100ml": 232,
    "vitamin-a_unit": "ug",
    "vitamin-c_100ml": 6,
    "vitamin-c_unit": "mg",
    "vitamin-b1_100ml": 0.0825,
    "vitamin-b1_unit": "mg",
    riboflavin_100ml: 0.105,
    riboflavin_unit: "mg",
    "vitamin-b3_100ml": 1.2,
    "vitamin-b3_unit": "mg",
    biotin_100ml: 3.75,
    biotin_unit: "ug",
    "folic-acid_100ml": 15,
    "folic-acid_unit": "ug",
    "pantothenic-acid_100ml": 0.45,
    "pantothenic-acid_unit": "mg",
    calcium_100ml: 5,
    calcium_unit: "mg",
    selenium_100ml: 0.000002,
    selenium_unit: "g",
    copper_100ml: 0.01,
    copper_unit: "mg",
    iodine_100ml: 22,
    iodine_unit: "ug",
  },
};

describe("productLookupService", () => {
  it("returns no results when every external provider is disabled", async () => {
    const fetchImpl = vi.fn();
    const service = createProductLookupService({
      config: {
        openFoodFactsEnabled: false,
        usdaApiKey: null,
      },
      fetchImpl,
    });

    await expect(service.searchProducts({ search: "oats", limit: 8 })).resolves.toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(service.getStatus()).toMatchObject({
      configured: false,
      provider: "external-products",
    });
  });

  it("maps OpenFoodFacts search results into product items", async () => {
    const fetchImpl = vi.fn(async () =>
      createResponse({
        body: {
          products: [openFoodFactsProduct],
        },
      })
    );
    const service = createProductLookupService({
      config: {
        openFoodFactsEnabled: true,
        productLookupTimeoutMs: 1200,
      },
      fetchImpl,
    });

    const results = await service.searchProducts({ search: "greek yogurt", limit: 6 });

    expect(results[0]).toMatchObject({
      id: "openfoodfacts-4820000730030",
      name: "Greek yogurt",
      brand: "Smart Dairy",
      barcode: "4820000730030",
      source: "OpenFoodFacts",
      unit: "g",
      status: "approved",
      nutrients: expect.objectContaining({
        calories: 92,
        protein: 10,
        fat: 2,
        carbs: 4,
        sodium: 40,
      }),
    });
    expect(fetchImpl.mock.calls[0][0]).toContain("world.openfoodfacts.org/cgi/search.pl");
  });

  it("maps OpenFoodFacts beverages as milliliters with serving and ingredient facts", async () => {
    const fetchImpl = vi.fn(async () =>
      createResponse({
        body: {
          status: 1,
          product: openFoodFactsBeverageProduct,
        },
      })
    );
    const service = createProductLookupService({
      config: {
        openFoodFactsEnabled: true,
      },
      fetchImpl,
    });

    const results = await service.searchProducts({ search: "5449000000996", limit: 1 });

    expect(results[0]).toMatchObject({
      id: "openfoodfacts-5449000000996",
      name: "Coca-Cola",
      brand: "Coca Cola",
      unit: "ml",
      source: "OpenFoodFacts",
      nutrients: expect.objectContaining({
        calories: 42,
        carbs: 10.6,
        saturatedFat: 0,
        monounsaturatedFat: 0.1,
        polyunsaturatedFat: 0.2,
        omega3: 0.03,
        omega6: 0.07,
        cholesterol: 1,
        sugars: 10.6,
        glucose: 3.2,
        fructose: 2.4,
        sucrose: 5,
        water: 89,
        potassium: 11,
        vitaminA: 232,
        vitaminB1: 0.0825,
        vitaminB2: 0.105,
        vitaminB3: 1.2,
        vitaminB5: 0.45,
        vitaminB7: 3.75,
        vitaminB9: 15,
        vitaminC: 6,
        calcium: 5,
        iodine: 22,
        selenium: 2,
        copper: 0.01,
      }),
      facts: expect.objectContaining({
        foodGroup: "beverages",
        servingSize: "330 ml",
        servingQuantity: 330,
        servingUnit: "ml",
        ingredientsText: expect.stringContaining("Woda gazowana"),
        ingredientsTextByLanguage: expect.objectContaining({
          en: expect.stringContaining("Carbonated water"),
          pl: expect.stringContaining("Woda gazowana"),
        }),
        additivesText: expect.stringContaining("E150D"),
        allergens: ["milk", "gluten"],
        traces: ["nuts"],
      }),
    });
    expect(fetchImpl.mock.calls[0][0]).toContain("quantity%2Cserving_size");
    expect(fetchImpl.mock.calls[0][0]).toContain("additives_tags");
    expect(fetchImpl.mock.calls[0][0]).toContain("allergens_tags");
    expect(fetchImpl.mock.calls[0][0]).toContain("traces_tags");
  });

  it("maps USDA micronutrients and fatty acids into the canonical product shape", async () => {
    const fetchImpl = vi.fn(async () =>
      createResponse({
        body: {
          foods: [
            {
              fdcId: 123,
              description: "Atlantic salmon",
              brandName: "USDA",
              foodCategory: "Fish",
              foodNutrients: [
                { nutrientId: 1008, value: 208 },
                { nutrientId: 1003, value: 20.4 },
                { nutrientId: 1004, value: 13.4 },
                { nutrientId: 1258, value: 3.1 },
                { nutrientId: 1292, value: 3.8 },
                { nutrientId: 1293, value: 3.9 },
                { nutrientId: 851, value: 2.2 },
                { nutrientId: 1253, value: 55 },
                { nutrientId: 1092, value: 363 },
                { nutrientId: 1091, value: 252 },
                { nutrientId: 1095, value: 0.6 },
                { nutrientId: 1100, value: 35 },
                { nutrientId: 1103, value: 36.5 },
                { nutrientId: 1098, value: 0.25 },
                { nutrientId: 1178, value: 3.2 },
                { nutrientId: 1114, value: 11 },
              ],
            },
          ],
        },
      })
    );
    const service = createProductLookupService({
      config: {
        openFoodFactsEnabled: false,
        usdaApiKey: "demo-key",
      },
      fetchImpl,
    });

    const results = await service.searchProducts({ search: "salmon", limit: 1 });

    expect(results[0]).toMatchObject({
      id: "usda-123",
      name: "Atlantic salmon",
      unit: "g",
      source: "USDA",
      nutrients: expect.objectContaining({
        calories: 208,
        protein: 20.4,
        fat: 13.4,
        saturatedFat: 3.1,
        monounsaturatedFat: 3.8,
        polyunsaturatedFat: 3.9,
        omega3: 2.2,
        cholesterol: 55,
        potassium: 363,
        phosphorus: 252,
        zinc: 0.6,
        iodine: 35,
        selenium: 36.5,
        copper: 0.25,
        vitaminB12: 3.2,
        vitaminD: 11,
      }),
    });
  });

  it("falls back to the secondary OpenFoodFacts host when the primary search host fails", async () => {
    const fetchImpl = vi.fn(async (url) => {
      if (String(url).startsWith("https://world.openfoodfacts.org")) {
        return createResponse({
          ok: false,
          status: 502,
        });
      }

      return createResponse({
        body: {
          products: [openFoodFactsProduct],
        },
      });
    });
    const service = createProductLookupService({
      config: {
        openFoodFactsEnabled: true,
      },
      fetchImpl,
    });

    const results = await service.searchProducts({ search: "greek yogurt", limit: 6 });

    expect(results[0]).toMatchObject({
      name: "Greek yogurt",
      source: "OpenFoodFacts",
    });
    expect(fetchImpl.mock.calls[0][0]).toContain("world.openfoodfacts.org/cgi/search.pl");
    expect(fetchImpl.mock.calls[1][0]).toContain("world.openfoodfacts.net/cgi/search.pl");
  });

  it("expands localized common food queries before calling external providers", async () => {
    const fetchImpl = vi.fn(async (url) => {
      if (String(url).includes("search_terms=chicken+breast")) {
        return createResponse({
          body: {
            products: [openFoodFactsProduct],
          },
        });
      }

      return createResponse({ body: { products: [] } });
    });
    const service = createProductLookupService({
      config: {
        openFoodFactsEnabled: true,
      },
      fetchImpl,
    });

    const results = await service.searchProducts({ search: "куряче філе", limit: 6 });

    expect(results[0]).toMatchObject({
      name: "Greek yogurt",
      source: "OpenFoodFacts",
    });
    expect(fetchImpl.mock.calls.some(([url]) =>
      String(url).includes("search_terms=%D0%BA%D1%83%D1%80%D1%8F%D1%87%D0%B5")
    )).toBe(true);
    expect(fetchImpl.mock.calls.some(([url]) =>
      String(url).includes("search_terms=chicken+breast")
    )).toBe(true);
  });

  it("expands Polish common food queries before calling external providers", async () => {
    const fetchImpl = vi.fn(async (url) => {
      if (String(url).includes("search_terms=chicken+breast")) {
        return createResponse({
          body: {
            products: [openFoodFactsProduct],
          },
        });
      }

      return createResponse({ body: { products: [] } });
    });
    const service = createProductLookupService({
      config: {
        openFoodFactsEnabled: true,
      },
      fetchImpl,
    });

    const results = await service.searchProducts({ search: "pierś z kurczaka", limit: 6 });

    expect(results[0]).toMatchObject({
      name: "Greek yogurt",
      source: "OpenFoodFacts",
    });
    expect(fetchImpl.mock.calls.some(([url]) =>
      String(url).includes("search_terms=pier%C5%9B+z+kurczaka")
    )).toBe(true);
    expect(fetchImpl.mock.calls.some(([url]) =>
      String(url).includes("search_terms=chicken+breast")
    )).toBe(true);
  });

  it("uses the OpenFoodFacts barcode endpoint for barcode queries", async () => {
    const fetchImpl = vi.fn(async () =>
      createResponse({
        body: {
          status: 1,
          product: openFoodFactsProduct,
        },
      })
    );
    const service = createProductLookupService({
      config: {
        openFoodFactsEnabled: true,
      },
      fetchImpl,
    });

    const results = await service.searchProducts({ search: "4820000730030", limit: 1 });

    expect(results).toHaveLength(1);
    expect(fetchImpl.mock.calls[0][0]).toContain(
      "world.openfoodfacts.org/api/v2/product/4820000730030.json"
    );
  });

  it("falls back to the secondary OpenFoodFacts host for barcode lookups", async () => {
    const fetchImpl = vi.fn(async (url) => {
      if (String(url).startsWith("https://world.openfoodfacts.org")) {
        throw new Error("primary host unavailable");
      }

      return createResponse({
        body: {
          status: 1,
          product: openFoodFactsProduct,
        },
      });
    });
    const service = createProductLookupService({
      config: {
        openFoodFactsEnabled: true,
      },
      fetchImpl,
    });

    const results = await service.searchProducts({ search: "4820000730030", limit: 1 });

    expect(results).toHaveLength(1);
    expect(fetchImpl.mock.calls[0][0]).toContain(
      "world.openfoodfacts.org/api/v2/product/4820000730030.json"
    );
    expect(fetchImpl.mock.calls.some(([url]) =>
      String(url).includes("world.openfoodfacts.net/api/v2/product/4820000730030.json")
    )).toBe(true);
  });

  it("uses USDA FoodData Central when an API key is configured", async () => {
    const fetchImpl = vi.fn(async (url) => {
      if (String(url).includes("openfoodfacts")) {
        return createResponse({ body: { products: [] } });
      }

      return createResponse({
        body: {
          foods: [
            {
              fdcId: 123,
              description: "Chicken breast, cooked",
              brandName: "USDA",
              foodCategory: "Poultry Products",
              foodNutrients: [
                { nutrientId: 1008, value: 165 },
                { nutrientId: 1003, value: 31 },
                { nutrientId: 1004, value: 3.6 },
                { nutrientId: 1005, value: 0 },
              ],
            },
          ],
        },
      });
    });
    const service = createProductLookupService({
      config: {
        openFoodFactsEnabled: true,
        usdaApiKey: "usda-key",
      },
      fetchImpl,
    });

    const results = await service.searchProducts({ search: "chicken breast", limit: 6 });

    expect(results[0]).toMatchObject({
      id: "usda-123",
      name: "Chicken breast, cooked",
      source: "USDA",
      nutrients: expect.objectContaining({
        calories: 165,
        protein: 31,
      }),
    });
    expect(fetchImpl.mock.calls.some(([url]) => String(url).includes("api.nal.usda.gov"))).toBe(
      true
    );
    expect(JSON.stringify(fetchImpl.mock.calls)).toContain("api_key=usda-key");
  });

  it("logs safe warnings and rejects when every configured provider fails", async () => {
    const logger = { warn: vi.fn() };
    const fetchImpl = vi.fn(async () =>
      createResponse({
        ok: false,
        status: 500,
      })
    );
    const service = createProductLookupService({
      config: {
        openFoodFactsEnabled: true,
      },
      logger,
      fetchImpl,
    });

    await expect(service.searchProducts({ search: "oats", limit: 4 })).rejects.toBeInstanceOf(
      ProductLookupProviderError
    );
    expect(logger.warn).toHaveBeenCalledWith(
      "[products] external lookup failed",
      expect.objectContaining({
        provider: "openfoodfacts",
        status: 500,
      })
    );
  });
});
