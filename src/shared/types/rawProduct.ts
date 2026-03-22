// src/types/rawProduct.ts

export interface RawUSDAProduct {
  fdcId?: string;
  description?: string;
  foodNutrients?: {
    nutrientName?: string;
    value?: number;
  }[];
}

export interface RawOFFProduct {
  _id?: string;
  product_name?: string;
  nutriments?: Record<string, number>;
}

// Унифицированный тип сырого продукта
export type RawProduct = RawUSDAProduct | RawOFFProduct;
