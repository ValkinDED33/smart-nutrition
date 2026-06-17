import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchProductByBarcode,
  ProductLookupError,
  searchProducts,
} from "./products";

const authMock = vi.hoisted(() => ({
  getRemoteAuthBaseUrl: vi.fn(() => "https://api.example.com/api"),
  isCloudSyncActive: vi.fn(() => true),
}));

vi.mock("./auth", () => authMock);

const createProductPayload = (overrides: Record<string, unknown> = {}) => ({
  id: "catalog-oats",
  name: "Oats",
  unit: "g",
  source: "OpenFoodFacts",
  nutrients: {
    calories: 389,
    protein: 16.9,
    fat: 6.9,
    carbs: 66.3,
  },
  ...overrides,
});

const createOpenFoodFactsPayload = (overrides: Record<string, unknown> = {}) => ({
  product_name: "Fallback oats",
  brands: "Open Brand",
  code: "1234567890123",
  image_front_url: "https://images.openfoodfacts.org/product.jpg",
  categories_tags: ["en:breakfast-cereals"],
  nutriments: {
    "energy-kcal_100g": 370,
    proteins_100g: 13,
    fat_100g: 7,
    carbohydrates_100g: 59,
    fiber_100g: 10,
    sugars_100g: 1,
    sodium_100g: 0.01,
  },
  ...overrides,
});

describe("products api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.getRemoteAuthBaseUrl.mockReturnValue("https://api.example.com/api");
    authMock.isCloudSyncActive.mockReturnValue(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the backend product catalog for search", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ items: [createProductPayload()] }), {
        status: 200,
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const results = await searchProducts("oats");

    expect(results[0]?.id).toBe("catalog-oats");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/api/products/search?q=oats&limit=18",
      expect.any(Object)
    );
  });

  it("does not fall back to a local product catalog when backend is unavailable", async () => {
    authMock.isCloudSyncActive.mockReturnValue(false);

    await expect(searchProducts("oats")).rejects.toMatchObject({
      code: "PRODUCT_LOOKUP_AUTH_REQUIRED",
    });
    await expect(fetchProductByBarcode("4820000730030")).rejects.toBeInstanceOf(
      ProductLookupError
    );
  });

  it("finds barcode products only from backend results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            items: [createProductPayload({ id: "barcode-product", barcode: "4820000730030" })],
          }),
          { status: 200 }
        )
      )
    );

    const product = await fetchProductByBarcode("4820000730030");

    expect(product?.id).toBe("barcode-product");
  });

  it("returns null for a valid barcode only when backend lookup succeeds with no item", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ items: [] }), { status: 200 })
      )
    );

    await expect(fetchProductByBarcode("4820000730030")).resolves.toBeNull();
  });

  it("uses OpenFoodFacts directly when backend product lookup fails for search", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            code: "PRODUCT_LOOKUP_PROVIDER_UNAVAILABLE",
            message: "External product lookup is unavailable.",
          }),
          { status: 502 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            products: [createOpenFoodFactsPayload()],
          }),
          { status: 200 }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const results = await searchProducts("oats");

    expect(results[0]).toMatchObject({
      id: "openfoodfacts-1234567890123",
      name: "Fallback oats",
      source: "OpenFoodFacts",
      barcode: "1234567890123",
      nutrients: expect.objectContaining({
        calories: 370,
        protein: 13,
        fat: 7,
        carbs: 59,
      }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("world.openfoodfacts.org/cgi/search.pl"),
      expect.any(Object)
    );
  });

  it("uses OpenFoodFacts directly when backend product lookup fails for barcode", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Provider unavailable." }), {
          status: 502,
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: 1,
            product: createOpenFoodFactsPayload({ product_name: "Barcode oats" }),
          }),
          { status: 200 }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const product = await fetchProductByBarcode("1234567890123");

    expect(product?.name).toBe("Barcode oats");
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("world.openfoodfacts.org/api/v2/product/1234567890123.json"),
      expect.any(Object)
    );
  });

  it("throws a typed error when backend and direct online lookup both fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              code: "PRODUCT_LOOKUP_PROVIDER_UNAVAILABLE",
              message: "External product lookup is unavailable.",
            }),
            { status: 502 }
          )
        )
        .mockResolvedValueOnce(new Response("Service unavailable", { status: 503 }))
    );

    await expect(searchProducts("oats")).rejects.toMatchObject({
      code: "PRODUCT_LOOKUP_FAILED",
      status: 502,
      message: "External product lookup is unavailable.",
    });
  });
});
