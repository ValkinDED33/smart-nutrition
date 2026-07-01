import type { Product } from "@domain/products/types";
import type { FridgeItem } from "@shared/types/fridge";
import type { FridgeState } from "./fridgeSlice";

const createId = (prefix: string) =>
  globalThis.crypto?.randomUUID?.() ??
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const buildFridgeStateAfterUpsertItem = (
  fridge: FridgeState,
  payload: { product: Product; quantity?: number },
  now = new Date().toISOString()
): FridgeState => {
  const quantity = Number.isFinite(Number(payload.quantity))
    ? Math.max(Number(payload.quantity), 1)
    : 100;
  const existingItem = fridge.items.find(
    (item) => item.product.id === payload.product.id
  );

  if (existingItem) {
    return {
      ...fridge,
      items: fridge.items.map((item) =>
        item.id === existingItem.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ),
    };
  }

  const nextItem: FridgeItem = {
    id: createId("fridge-item"),
    product: payload.product,
    quantity,
    createdAt: now,
  };

  return {
    ...fridge,
    items: [nextItem, ...fridge.items],
  };
};

export const buildFridgeStateAfterUpdateQuantity = (
  fridge: FridgeState,
  payload: { itemId: string; quantity: number }
): FridgeState => ({
  ...fridge,
  items: fridge.items.map((item) =>
    item.id === payload.itemId
      ? { ...item, quantity: Math.max(Number(payload.quantity) || 1, 1) }
      : item
  ),
});

export const buildFridgeStateAfterRemoveItem = (
  fridge: FridgeState,
  itemId: string
): FridgeState => ({
  ...fridge,
  items: fridge.items.filter((item) => item.id !== itemId),
});
