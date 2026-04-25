import type { Product } from "./product";

export interface FridgeItem {
  id: string;
  product: Product;
  quantity: number;
  createdAt: string;
}
