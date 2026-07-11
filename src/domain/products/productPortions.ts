import type { Product } from "@domain/products/types";

const normalizeServingQuantity = (product: Product) => {
  const servingQuantity = Number(product.facts?.servingQuantity);

  return product.facts?.servingUnit === product.unit &&
    Number.isFinite(servingQuantity) &&
    servingQuantity > 0
    ? Math.round(servingQuantity)
    : null;
};

const uniquePositiveNumbers = (values: number[]) =>
  Array.from(new Set(values.filter((value) => Number.isFinite(value) && value > 0))).sort(
    (left, right) => left - right
  );

export const getDefaultProductQuantity = (product: Product) =>
  normalizeServingQuantity(product) ?? (product.unit === "piece" ? 1 : 100);

export const getProductPortionPresets = (productOrUnit: Product | Product["unit"]) => {
  const unit = typeof productOrUnit === "string" ? productOrUnit : productOrUnit.unit;

  if (unit === "piece") {
    return [1, 2, 3, 4];
  }

  if (unit === "ml") {
    const servingQuantity =
      typeof productOrUnit === "string" ? null : normalizeServingQuantity(productOrUnit);

    return uniquePositiveNumbers([100, 250, servingQuantity ?? 330, 330, 500]);
  }

  return [50, 100, 150, 200];
};

export const formatProductBaseAmount = (unit: Product["unit"]) =>
  unit === "piece" ? "1 piece" : `100 ${unit}`;

export const formatProductPortion = (
  quantity: number,
  unit: Product["unit"]
) => (unit === "piece" ? String(quantity) : `${quantity} ${unit}`);
