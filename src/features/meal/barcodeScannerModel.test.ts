import { describe, expect, it } from "vitest";
import { createProductKey } from "./productIdentity";
import {
  MAX_MANUAL_PHOTO_BYTES,
  createBarcodeSearchUrls,
  createInitialBarcodeQuantity,
  createManualCatalogSubmissionPayload,
  createManualBarcodeProduct,
  isSafeManualImageDataUrl,
  isSupportedManualPhotoFile,
  normalizeBarcode,
  normalizeManualImageUrl,
  resolveBarcodeScannerAvailability,
  resolveCatalogNotice,
} from "./barcodeScannerModel";

describe("barcodeScannerModel", () => {
  it("normalizes barcode identity consistently", () => {
    expect(normalizeBarcode(" 590-123 abc 456 ")).toBe("590123456");
    expect(
      createProductKey({
        name: "Milk",
        barcode: " 590-123 ",
      })
    ).toBe("590123");
  });

  it("builds safe fallback search urls", () => {
    const emptyUrls = createBarcodeSearchUrls("not-a-barcode");
    const urls = createBarcodeSearchUrls("590 123");

    expect(emptyUrls.google).toBe("#");
    expect(urls.google).toContain("590123%20nutrition%20facts");
    expect(urls.auchan).toContain("site%3Azakupy.auchan.pl%20590123");
    expect(urls.biedronka).toContain("site%3Azakupy.biedronka.pl%20590123");
  });

  it("starts barcode quantity empty so mobile users can type immediately", () => {
    expect(createInitialBarcodeQuantity()).toBe("");
  });

  it("accepts only bounded raster manual photos and safe image urls", () => {
    expect(
      isSupportedManualPhotoFile({
        type: "image/png",
        size: MAX_MANUAL_PHOTO_BYTES,
      })
    ).toBe(true);
    expect(
      isSupportedManualPhotoFile({
        type: "image/svg+xml",
        size: 100,
      })
    ).toBe(false);
    expect(
      isSupportedManualPhotoFile({
        type: "image/png",
        size: MAX_MANUAL_PHOTO_BYTES + 1,
      })
    ).toBe(false);

    expect(isSafeManualImageDataUrl("data:image/webp;base64,abc")).toBe(true);
    expect(normalizeManualImageUrl("javascript:alert(1)")).toBe("");
    expect(normalizeManualImageUrl("https://example.com/pack.png")).toBe(
      "https://example.com/pack.png"
    );
  });

  it("creates a manual barcode product with normalized optional fields", () => {
    const { catalogImageUrl, category, normalizedBarcode, product } =
      createManualBarcodeProduct({
        id: "manual-1",
        barcodeInput: "590 123",
        draft: {
          name: "  Greek yogurt ",
          brand: "  Dairy Co ",
          category: "yogurt",
          imageUrl: "https://example.com/yogurt.png",
          calories: 110,
          protein: 9,
          fat: 4,
          carbs: 8,
        },
      });

    expect(normalizedBarcode).toBe("590123");
    expect(category).toBe("yogurt");
    expect(catalogImageUrl).toBe("https://example.com/yogurt.png");
    expect(product).toMatchObject({
      id: "manual-1",
      name: "Greek yogurt",
      brand: "Dairy Co",
      barcode: "590123",
      category: "yogurt",
      source: "Manual",
      unit: "g",
      nutrients: {
        calories: 110,
        protein: 9,
        fat: 4,
        carbs: 8,
      },
    });
  });

  it("creates a shared catalog submission payload from a saved manual product", () => {
    const draft = {
      name: "  Greek yogurt ",
      brand: "  Dairy Co ",
      category: "yogurt",
      imageUrl: "https://example.com/yogurt.png",
      calories: 110,
      protein: 9,
      fat: 4,
      carbs: 8,
    };
    const manualProduct = createManualBarcodeProduct({
      id: "manual-1",
      barcodeInput: "590 123",
      draft,
    });

    expect(
      createManualCatalogSubmissionPayload({
        ...manualProduct,
        draft,
      })
    ).toEqual({
      name: "Greek yogurt",
      brand: "Dairy Co",
      barcode: "590123",
      category: "yogurt",
      imageUrl: "https://example.com/yogurt.png",
      calories: 110,
      protein: 9,
      fat: 4,
      carbs: 8,
      unit: "g",
    });
  });

  it("keeps shared catalog submission states explicit and retryable", () => {
    const copy = {
      catalogSubmitting: "Sending",
      catalogConfirmed: "Accepted",
      catalogFailed: "Saved locally for user, catalog failed.",
      catalogRetry: "Retry",
    };
    const payload = {
      name: "Greek yogurt",
      calories: 110,
      protein: 9,
      fat: 4,
      carbs: 8,
      unit: "g" as const,
    };

    expect(resolveCatalogNotice({ status: "idle" }, copy)).toBeNull();
    expect(resolveCatalogNotice({ status: "submitting", payload }, copy)).toEqual({
      severity: "info",
      text: "Sending",
    });
    expect(resolveCatalogNotice({ status: "confirmed" }, copy)).toEqual({
      severity: "success",
      text: "Accepted",
    });
    expect(
      resolveCatalogNotice(
        {
          status: "failed",
          payload,
          message: "Provider unavailable.",
        },
        copy
      )
    ).toEqual({
      severity: "warning",
      text: "Saved locally for user, catalog failed. Provider unavailable.",
      retryable: true,
    });
  });

  it("detects camera scanner availability before starting browser APIs", () => {
    expect(
      resolveBarcodeScannerAvailability({
        hasMediaDevices: true,
        isSecureContext: true,
      })
    ).toEqual({ available: true, reason: "camera_available" });

    expect(
      resolveBarcodeScannerAvailability({
        hasMediaDevices: false,
        isSecureContext: true,
      })
    ).toEqual({ available: false, reason: "camera_api_missing" });

    expect(
      resolveBarcodeScannerAvailability({
        hasMediaDevices: true,
        isSecureContext: false,
      })
    ).toEqual({ available: false, reason: "insecure_context" });
  });
});
