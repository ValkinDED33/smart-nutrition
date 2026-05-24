import { createEmptyNutrients } from "../../shared/lib/nutrients";
import type { Product } from "../../shared/types/product";
import { normalizeBarcode } from "./productIdentity";

export type ManualDraft = {
  name: string;
  brand: string;
  category: string;
  imageUrl: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

export type CatalogNotice = {
  severity: "success" | "warning";
  text: string;
};

export const MAX_MANUAL_PHOTO_BYTES = 1_200_000;
export const MAX_MANUAL_IMAGE_DATA_URL_LENGTH = 1_700_000;

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
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
});

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

  nutrients.calories = draft.calories;
  nutrients.protein = draft.protein;
  nutrients.fat = draft.fat;
  nutrients.carbs = draft.carbs;

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
