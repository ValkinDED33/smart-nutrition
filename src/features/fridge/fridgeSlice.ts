import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { FridgeItem } from "../../shared/types/fridge";
import type { Product } from "../../shared/types/product";

interface FridgeState {
  items: FridgeItem[];
}

const createId = (prefix: string) =>
  globalThis.crypto?.randomUUID?.() ??
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const initialState: FridgeState = {
  items: [],
};

const normalizeFridgeItem = (value: unknown): FridgeItem | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<FridgeItem>;

  if (!item.product || typeof item.product !== "object") {
    return null;
  }

  return {
    id: typeof item.id === "string" && item.id.trim() ? item.id : createId("fridge-item"),
    product: item.product as Product,
    quantity: Number.isFinite(Number(item.quantity)) ? Math.max(Number(item.quantity), 1) : 100,
    createdAt:
      typeof item.createdAt === "string" && item.createdAt.trim()
        ? item.createdAt
        : new Date().toISOString(),
  };
};

export const normalizeFridgeState = (value: unknown): FridgeState => {
  if (!value || typeof value !== "object") {
    return initialState;
  }

  const state = value as Partial<FridgeState>;

  return {
    items: Array.isArray(state.items)
      ? (state.items.map(normalizeFridgeItem).filter(Boolean) as FridgeItem[])
      : initialState.items,
  };
};

const fridgeSlice = createSlice({
  name: "fridge",
  initialState,
  reducers: {
    upsertFridgeItem(
      state,
      action: PayloadAction<{ product: Product; quantity?: number }>
    ) {
      const quantity = Number.isFinite(Number(action.payload.quantity))
        ? Math.max(Number(action.payload.quantity), 1)
        : 100;
      const existingItem = state.items.find(
        (item) => item.product.id === action.payload.product.id
      );

      if (existingItem) {
        existingItem.quantity += quantity;
        return;
      }

      state.items.unshift({
        id: createId("fridge-item"),
        product: action.payload.product,
        quantity,
        createdAt: new Date().toISOString(),
      });
    },
    updateFridgeItemQuantity(
      state,
      action: PayloadAction<{ itemId: string; quantity: number }>
    ) {
      const item = state.items.find((entry) => entry.id === action.payload.itemId);

      if (!item) {
        return;
      }

      item.quantity = Math.max(action.payload.quantity, 1);
    },
    removeFridgeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

export const { upsertFridgeItem, updateFridgeItemQuantity, removeFridgeItem } =
  fridgeSlice.actions;

export default fridgeSlice.reducer;
