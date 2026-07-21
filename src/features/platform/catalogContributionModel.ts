import type { CatalogProductSubmissionPayload } from "@shared/types/platform";
import type { Product } from "@domain/products/types";

export type CatalogContributionForm = {
  name: string;
  category: string;
  brand: string;
  barcode: string;
  imageUrl: string;
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
};

export type CatalogContributionSubmissionState =
  | {
      status: "idle";
    }
  | {
      status: "submitting";
      payload: CatalogProductSubmissionPayload;
    }
  | {
      status: "accepted";
    }
  | {
      status: "failed";
      message: string;
      payload: CatalogProductSubmissionPayload;
    };

export type CatalogContributionNotice = {
  severity: "success" | "warning" | "info";
  text: string;
  retryable?: boolean;
};

export const createInitialCatalogContributionForm = (
  initialName = ""
): CatalogContributionForm => ({
  name: initialName.trim(),
  category: "",
  brand: "",
  barcode: "",
  imageUrl: "",
  calories: "",
  protein: "",
  fat: "",
  carbs: "",
});

const formatCatalogNumber = (value: number | undefined) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? String(Number(value.toFixed(2)))
    : "";

export const createCatalogContributionFormFromProduct = (
  product: Product,
  initialName = product.name
): CatalogContributionForm => ({
  name: initialName.trim() || product.name.trim(),
  category: product.category?.trim() ?? "",
  brand: product.brand?.trim() ?? "",
  barcode: product.barcode?.replace(/\D/g, "") ?? "",
  imageUrl: product.imageUrl?.trim() ?? "",
  calories: formatCatalogNumber(product.nutrients.calories),
  protein: formatCatalogNumber(product.nutrients.protein),
  fat: formatCatalogNumber(product.nutrients.fat),
  carbs: formatCatalogNumber(product.nutrients.carbs),
});

export const createInitialCatalogContributionSubmissionState =
  (): CatalogContributionSubmissionState => ({
    status: "idle",
  });

const parseRequiredNumber = (value: string) => {
  const parsedValue = Number(value);

  return value.trim() && Number.isFinite(parsedValue) && parsedValue >= 0
    ? parsedValue
    : null;
};

export const buildCatalogContributionPayload = (
  form: CatalogContributionForm
): CatalogProductSubmissionPayload | null => {
  const name = form.name.trim();
  const calories = parseRequiredNumber(form.calories);
  const protein = parseRequiredNumber(form.protein);
  const fat = parseRequiredNumber(form.fat);
  const carbs = parseRequiredNumber(form.carbs);

  if (
    !name ||
    calories === null ||
    protein === null ||
    fat === null ||
    carbs === null
  ) {
    return null;
  }

  return {
    name,
    category: form.category.trim() || undefined,
    brand: form.brand.trim() || undefined,
    barcode: form.barcode.replace(/\D/g, "") || undefined,
    imageUrl: form.imageUrl.trim() || undefined,
    calories,
    protein,
    fat,
    carbs,
  };
};

export const canSubmitCatalogContribution = (form: CatalogContributionForm) =>
  buildCatalogContributionPayload(form) !== null;

export const resolveCatalogContributionNotice = (
  state: CatalogContributionSubmissionState,
  copy: {
    accepted: string;
    failed: string;
    retry: string;
    submitting: string;
  }
): CatalogContributionNotice | null => {
  if (state.status === "idle") {
    return null;
  }

  if (state.status === "submitting") {
    return {
      severity: "info",
      text: copy.submitting,
    };
  }

  if (state.status === "accepted") {
    return {
      severity: "success",
      text: copy.accepted,
    };
  }

  return {
    severity: "warning",
    text: `${copy.failed} ${state.message || copy.retry}`,
    retryable: true,
  };
};
