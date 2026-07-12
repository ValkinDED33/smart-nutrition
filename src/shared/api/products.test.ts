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

const PRODUCT_LOOKUP_PROVIDER_UNAVAILABLE =
  "External product lookup is unavailable.";
const PRODUCT_LOOKUP_PROVIDER_UNAVAILABLE_CODE =
  "PRODUCT_LOOKUP_PROVIDER_UNAVAILABLE";
const PRODUCT_LOOKUP_PROVIDER_FAILURE_STATUS = 502;
const PROVIDER_UNAVAILABLE_MESSAGE = "Provider unavailable.";

const createProductPayload = (overrides: Record<string, unknown> = {}) => ({
  id: "catalog-oats",
  name: "Oats",
  unit: "g",
  source: "OpenFoodFacts",
  status: "approved",
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
    expect(results[0]?.status).toBe("approved");
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

  it("does not bypass backend when backend product lookup fails for search", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          code: PRODUCT_LOOKUP_PROVIDER_UNAVAILABLE_CODE,
          message: PRODUCT_LOOKUP_PROVIDER_UNAVAILABLE,
        }),
        { status: PRODUCT_LOOKUP_PROVIDER_FAILURE_STATUS }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchProducts("oats")).rejects.toMatchObject({
      code: "PRODUCT_LOOKUP_FAILED",
      status: PRODUCT_LOOKUP_PROVIDER_FAILURE_STATUS,
      message: PRODUCT_LOOKUP_PROVIDER_UNAVAILABLE,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain("world.openfoodfacts.org");
  });

  it("does not bypass backend when backend product lookup fails for barcode", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ message: PROVIDER_UNAVAILABLE_MESSAGE }), {
        status: PRODUCT_LOOKUP_PROVIDER_FAILURE_STATUS,
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchProductByBarcode("1234567890123")).rejects.toMatchObject({
      code: "PRODUCT_LOOKUP_FAILED",
      status: PRODUCT_LOOKUP_PROVIDER_FAILURE_STATUS,
      message: PROVIDER_UNAVAILABLE_MESSAGE,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain("world.openfoodfacts.org");
  });

  it("throws a typed error when backend lookup fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            code: PRODUCT_LOOKUP_PROVIDER_UNAVAILABLE_CODE,
            message: PRODUCT_LOOKUP_PROVIDER_UNAVAILABLE,
          }),
          { status: PRODUCT_LOOKUP_PROVIDER_FAILURE_STATUS }
        )
      )
    );

    await expect(searchProducts("oats")).rejects.toMatchObject({
      code: "PRODUCT_LOOKUP_FAILED",
      status: PRODUCT_LOOKUP_PROVIDER_FAILURE_STATUS,
      message: PRODUCT_LOOKUP_PROVIDER_UNAVAILABLE,
    });
  });
});
