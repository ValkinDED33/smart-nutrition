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
  nutriments: {
    "energy-kcal_100ml": 42,
    proteins_100ml: 0,
    fat_100ml: 0,
    "saturated-fat_100ml": 0,
    carbohydrates_100ml: 10.6,
    sugars_100ml: 10.6,
    sodium_100ml: 0,
    "vitamin-a_100ml": 232,
    "vitamin-a_unit": "ug",
    "vitamin-c_100ml": 6,
    "vitamin-c_unit": "mg",
    "vitamin-b1_100ml": 0.0825,
    "vitamin-b1_unit": "mg",
    biotin_100ml: 3.75,
    biotin_unit: "ug",
    "pantothenic-acid_100ml": 0.45,
    "pantothenic-acid_unit": "mg",
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
        sugars: 10.6,
        vitaminA: 232,
        vitaminB1: 0.0825,
        vitaminB5: 0.45,
        vitaminB7: 3.75,
        vitaminC: 6,
      }),
      facts: expect.objectContaining({
        foodGroup: "beverages",
        servingSize: "330 ml",
        servingQuantity: 330,
        servingUnit: "ml",
        ingredientsText: expect.stringContaining("Carbonated water"),
      }),
    });
    expect(fetchImpl.mock.calls[0][0]).toContain("quantity%2Cserving_size");
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
