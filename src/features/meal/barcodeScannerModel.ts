import { createEmptyNutrients } from "@domain/meal/nutrients";
import type { Product } from "@domain/products/types";
import type { CatalogProductSubmissionPayload } from "@shared/types/platform";
import { normalizeBarcode } from "./productIdentity";

export type ManualNumericDraftValue = number | "";

export type ManualDraft = {
  name: string;
  brand: string;
  category: string;
  imageUrl: string;
  calories: ManualNumericDraftValue;
  protein: ManualNumericDraftValue;
  fat: ManualNumericDraftValue;
  carbs: ManualNumericDraftValue;
};

export type CatalogSubmissionState =
  | {
      status: "idle";
    }
  | {
      status: "submitting";
      payload: CatalogProductSubmissionPayload;
    }
  | {
      status: "confirmed";
      moderationStatus?: string;
    }
  | {
      status: "failed";
      message: string;
      payload: CatalogProductSubmissionPayload;
    };

export type CatalogNotice = {
  severity: "success" | "warning" | "info";
  text: string;
  retryable?: boolean;
};

export type BarcodeScannerAvailability =
  | {
      available: true;
      reason: "camera_available";
    }
  | {
      available: false;
      reason: "camera_api_missing" | "insecure_context";
    };

export const resolveBarcodeTorchAvailable = ({
  capabilitiesTorch,
  settingsTorch,
}: {
  capabilitiesTorch?: boolean;
  settingsTorch?: boolean;
}) => capabilitiesTorch === true || typeof settingsTorch === "boolean";

export const MAX_MANUAL_PHOTO_BYTES = 1_200_000;
export const MAX_MANUAL_IMAGE_DATA_URL_LENGTH = 1_700_000;
export const BARCODE_SCAN_NO_RESULT_TIMEOUT_MS = 12_000;
export const BARCODE_SCANNER_PREVIEW_ASPECT_RATIO = "4 / 3";
export const BARCODE_SCANNER_PREVIEW_MIN_HEIGHT_PX = 220;
export const BARCODE_SCANNER_PREVIEW_MOBILE_HEIGHT_CSS =
  "clamp(220px, 58vw, 320px)";
export const BARCODE_SCANNER_PREVIEW_TABLET_HEIGHT_CSS =
  "clamp(260px, 42vw, 380px)";
export const BARCODE_SCANNER_PREVIEW_MAX_HEIGHT_CSS = "min(42svh, 420px)";

const SUPPORTED_MANUAL_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const SAFE_IMAGE_DATA_URL_PATTERN = /^data:image\/(?:jpeg|jpg|png|webp);base64,/i;

export const createManualDraft = (): ManualDraft => ({
  name: "",
  brand: "",
  category: "",
  imageUrl: "",
  calories: "",
  protein: "",
  fat: "",
  carbs: "",
});

export const createInitialBarcodeQuantity = (): ManualNumericDraftValue => "";

export const createInitialCatalogSubmissionState = (): CatalogSubmissionState => ({
  status: "idle",
});

export const resolveBarcodeScannerAvailability = ({
  hasMediaDevices,
  isSecureContext,
}: {
  hasMediaDevices: boolean;
  isSecureContext: boolean;
}): BarcodeScannerAvailability => {
  if (!isSecureContext) {
    return {
      available: false,
      reason: "insecure_context",
    };
  }

  if (!hasMediaDevices) {
    return {
      available: false,
      reason: "camera_api_missing",
    };
  }

  return {
    available: true,
    reason: "camera_available",
  };
};

export const normalizeManualNumericValue = (
  value: ManualNumericDraftValue
) => (typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0);

export { normalizeBarcode } from "./productIdentity";

export const isSupportedManualPhotoFile = (
  file: Pick<File, "type" | "size">
) =>
  SUPPORTED_MANUAL_PHOTO_TYPES.has(file.type) &&
  file.size <= MAX_MANUAL_PHOTO_BYTES;

export const isSafeManualImageDataUrl = (value: string) =>
  value.length <= MAX_MANUAL_IMAGE_DATA_URL_LENGTH &&
  SAFE_IMAGE_DATA_URL_PATTERN.test(value);

export const normalizeCatalogImageUrl = (value: string) => {
  const nextValue = value.trim();

  if (!nextValue || nextValue.length > 500) {
    return undefined;
  }

  try {
    const url = new URL(nextValue);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

export const normalizeManualImageUrl = (value: string) => {
  const nextValue = value.trim();

  if (!nextValue) {
    return "";
  }

  if (isSafeManualImageDataUrl(nextValue)) {
    return nextValue;
  }

  return normalizeCatalogImageUrl(nextValue) ?? "";
};

export const createBarcodeSearchUrls = (barcodeInput: string) => {
  const normalizedBarcode = normalizeBarcode(barcodeInput);

  if (!normalizedBarcode) {
    return {
      google: "#",
      auchan: "#",
      biedronka: "#",
    };
  }

  return {
    google: `https://www.google.com/search?q=${encodeURIComponent(
      `${normalizedBarcode} nutrition facts`
    )}`,
    auchan: `https://www.google.com/search?q=${encodeURIComponent(
      `site:zakupy.auchan.pl ${normalizedBarcode}`
    )}`,
    biedronka: `https://www.google.com/search?q=${encodeURIComponent(
      `site:zakupy.biedronka.pl ${normalizedBarcode}`
    )}`,
  };
};

export const createManualBarcodeProduct = ({
  barcodeInput,
  draft,
  id,
}: {
  barcodeInput: string;
  draft: ManualDraft;
  id: string;
}) => {
  const name = draft.name.trim();
  const normalizedBarcode = normalizeBarcode(barcodeInput);
  const category = draft.category.trim();
  const imageUrl = normalizeManualImageUrl(draft.imageUrl);
  const catalogImageUrl = normalizeCatalogImageUrl(imageUrl);
  const nutrients = createEmptyNutrients();

  nutrients.calories = normalizeManualNumericValue(draft.calories);
  nutrients.protein = normalizeManualNumericValue(draft.protein);
  nutrients.fat = normalizeManualNumericValue(draft.fat);
  nutrients.carbs = normalizeManualNumericValue(draft.carbs);

  const product: Product = {
    id,
    name,
    brand: draft.brand.trim() || undefined,
    barcode: normalizedBarcode || undefined,
    category: category || undefined,
    imageUrl: imageUrl || undefined,
    facts: category ? { foodGroup: category } : undefined,
    unit: "g",
    source: "Manual",
    nutrients,
  };

  return {
    catalogImageUrl,
    category,
    name,
    normalizedBarcode,
    product,
  };
};

export const createManualCatalogSubmissionPayload = ({
  catalogImageUrl,
  category,
  draft,
  name,
  normalizedBarcode,
  product,
}: {
  catalogImageUrl?: string;
  category: string;
  draft: ManualDraft;
  name: string;
  normalizedBarcode: string;
  product: Product;
}): CatalogProductSubmissionPayload => ({
  name,
  brand: product.brand,
  barcode: normalizedBarcode || undefined,
  category: category || undefined,
  imageUrl: catalogImageUrl,
  calories: normalizeManualNumericValue(draft.calories),
  protein: normalizeManualNumericValue(draft.protein),
  fat: normalizeManualNumericValue(draft.fat),
  carbs: normalizeManualNumericValue(draft.carbs),
  unit: "g",
});

export const resolveCatalogNotice = (
  state: CatalogSubmissionState,
  copy: {
    catalogConfirmed: string;
    catalogFailed: string;
    catalogRetry: string;
    catalogSubmitting: string;
  }
): CatalogNotice | null => {
  if (state.status === "idle") {
    return null;
  }

  if (state.status === "submitting") {
    return {
      severity: "info",
      text: copy.catalogSubmitting,
    };
  }

  if (state.status === "confirmed") {
    return {
      severity: "success",
      text: copy.catalogConfirmed,
    };
  }

  return {
    severity: "warning",
    text: `${copy.catalogFailed} ${state.message || copy.catalogRetry}`,
    retryable: true,
  };
};
