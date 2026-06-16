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
