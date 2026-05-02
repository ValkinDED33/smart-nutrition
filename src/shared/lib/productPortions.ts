import type { Product } from "../types/product";

export const getProductPortionPresets = (unit: Product["unit"]) =>
  unit === "piece" ? [1, 2, 3, 4] : [50, 100, 150, 200];

export const formatProductPortion = (
  quantity: number,
  unit: Product["unit"]
) => (unit === "piece" ? String(quantity) : `${quantity} ${unit}`);
