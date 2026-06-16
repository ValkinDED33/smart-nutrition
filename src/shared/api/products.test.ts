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

  it("throws a typed error when backend product lookup fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "PRODUCT_LOOKUP_PROVIDER_UNAVAILABLE",
            message: "External product lookup is unavailable.",
          }),
          { status: 502 }
        )
      )
    );

    await expect(searchProducts("oats")).rejects.toMatchObject({
      code: "PRODUCT_LOOKUP_FAILED",
      status: 502,
      message: "External product lookup is unavailable.",
    });
  });
});
