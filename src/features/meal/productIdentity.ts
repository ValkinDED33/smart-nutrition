import type { Product } from "../../shared/types/product";

export const normalizeBarcode = (value: string) => value.replace(/\D/g, "");

export const createProductKey = (
  product: Pick<Product, "name" | "brand" | "barcode">
) => {
  const barcode = normalizeBarcode(product.barcode ?? "");

  return (
    barcode ||
    `${product.name.trim().toLowerCase()}-${product.brand?.trim().toLowerCase() ?? ""}`
  );
};

export const uniqueProductsByIdentity = (products: Product[]) => {
  const merged = new Map<string, Product>();

  products.forEach((product) => {
    const key = createProductKey(product);

    if (!merged.has(key)) {
      merged.set(key, product);
    }
  });

  return [...merged.values()];
};
