import { describe, expect, it } from "vitest";
import { createProductKey } from "./productIdentity";
import {
  BARCODE_SCANNER_PREVIEW_ASPECT_RATIO,
  BARCODE_SCANNER_PREVIEW_MAX_HEIGHT_CSS,
  BARCODE_SCANNER_PREVIEW_MOBILE_HEIGHT_CSS,
  BARCODE_SCANNER_PREVIEW_MIN_HEIGHT_PX,
  BARCODE_SCANNER_PREVIEW_TABLET_HEIGHT_CSS,
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
  resolveBarcodeTorchAvailable,
  resolveCatalogNotice,
} from "./barcodeScannerModel";

const GREEK_YOGURT_NAME = "  Greek yogurt ";
const NORMALIZED_GREEK_YOGURT_NAME = "Greek yogurt";
const DAIRY_CO_BRAND = "  Dairy Co ";
const NORMALIZED_DAIRY_CO_BRAND = "Dairy Co";
const YOGURT_CATEGORY = "yogurt";
const YOGURT_IMAGE_URL = "https://example.com/yogurt.png";
const NORMALIZED_MANUAL_BARCODE = "590123";
const SPACED_MANUAL_BARCODE = "590 123";

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
    const urls = createBarcodeSearchUrls(SPACED_MANUAL_BARCODE);

    expect(emptyUrls.google).toBe("#");
    expect(urls.google).toContain(`${NORMALIZED_MANUAL_BARCODE}%20nutrition%20facts`);
    expect(urls.auchan).toContain(`site%3Azakupy.auchan.pl%20${NORMALIZED_MANUAL_BARCODE}`);
    expect(urls.biedronka).toContain(`site%3Azakupy.biedronka.pl%20${NORMALIZED_MANUAL_BARCODE}`);
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
        barcodeInput: SPACED_MANUAL_BARCODE,
        draft: {
          name: GREEK_YOGURT_NAME,
          brand: DAIRY_CO_BRAND,
          category: YOGURT_CATEGORY,
          imageUrl: YOGURT_IMAGE_URL,
          calories: 110,
          protein: 9,
          fat: 4,
          carbs: 8,
        },
      });

    expect(normalizedBarcode).toBe(NORMALIZED_MANUAL_BARCODE);
    expect(category).toBe(YOGURT_CATEGORY);
    expect(catalogImageUrl).toBe(YOGURT_IMAGE_URL);
    expect(product).toMatchObject({
      id: "manual-1",
      name: NORMALIZED_GREEK_YOGURT_NAME,
      brand: NORMALIZED_DAIRY_CO_BRAND,
      barcode: NORMALIZED_MANUAL_BARCODE,
      category: YOGURT_CATEGORY,
      status: "personal",
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
      name: GREEK_YOGURT_NAME,
      brand: DAIRY_CO_BRAND,
      category: YOGURT_CATEGORY,
      imageUrl: YOGURT_IMAGE_URL,
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
      name: NORMALIZED_GREEK_YOGURT_NAME,
      brand: NORMALIZED_DAIRY_CO_BRAND,
      barcode: NORMALIZED_MANUAL_BARCODE,
      category: YOGURT_CATEGORY,
      imageUrl: YOGURT_IMAGE_URL,
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
      catalogFailed: "Meal was confirmed in your cloud profile, but catalog moderation failed.",
      catalogRetry: "Retry",
    };
    const payload = {
      name: NORMALIZED_GREEK_YOGURT_NAME,
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
      text: "Meal was confirmed in your cloud profile, but catalog moderation failed. Provider unavailable.",
      retryable: true,
    });
  });

  it("does not describe manual scanner fallback as browser-only persistence", () => {
    const copy = {
      catalogSubmitting: "Sending",
      catalogConfirmed: "Accepted",
      catalogFailed: "Meal was confirmed in your cloud profile, but catalog moderation failed.",
      catalogRetry: "Retry",
    };

    const notice = resolveCatalogNotice(
      {
        status: "failed",
        payload: {
          name: NORMALIZED_GREEK_YOGURT_NAME,
          calories: 110,
          protein: 9,
          fat: 4,
          carbs: 8,
          unit: "g",
        },
        message: "Provider unavailable.",
      },
      copy
    );

    expect(notice?.text).toContain("cloud profile");
    expect(notice?.text).not.toMatch(/saved\s+locally/i);
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

  it("detects torch support only from confirmed camera capabilities", () => {
    expect(
      resolveBarcodeTorchAvailable({
        capabilitiesTorch: true,
      })
    ).toBe(true);

    expect(
      resolveBarcodeTorchAvailable({
        settingsTorch: false,
      })
    ).toBe(false);

    expect(resolveBarcodeTorchAvailable({})).toBe(false);
  });

  it("keeps scanner preview dimensions deterministic before camera metadata loads", () => {
    expect(BARCODE_SCANNER_PREVIEW_ASPECT_RATIO).toBe("4 / 3");
    expect(BARCODE_SCANNER_PREVIEW_MIN_HEIGHT_PX).toBeGreaterThanOrEqual(200);
    expect(BARCODE_SCANNER_PREVIEW_MOBILE_HEIGHT_CSS).toContain("clamp");
    expect(BARCODE_SCANNER_PREVIEW_MOBILE_HEIGHT_CSS).toContain("vw");
    expect(BARCODE_SCANNER_PREVIEW_TABLET_HEIGHT_CSS).toContain("clamp");
    expect(BARCODE_SCANNER_PREVIEW_MAX_HEIGHT_CSS).toContain("svh");
  });
});
