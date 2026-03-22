// src/types/rawProduct.ts

export interface RawUSDAProduct {
  fdcId?: string;
  description?: string;
  foodNutrients?: {
    nutrientName?: string;
    value?: number;
    unitName?: string;
  }[];
  gtinUpc?: string;
  brandOwner?: string;
  foodCategory?: string;
}

export interface RawOFFProduct {
  _id?: string;
  product_name?: string;
  nutriments?: Record<string, number>;
  brands?: string;
  code?: string;
  image_front_small_url?: string;
  image_small_url?: string;
  image_url?: string;
}

// Унифицированный тип сырого продукта
export type RawProduct = RawUSDAProduct | RawOFFProduct;
