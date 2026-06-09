import {
  companionShopCatalog,
  getCompanionCatalogItemById,
} from "../catalog/companionCatalog";
import type { CompanionCatalogItem, CompanionState } from "../types";

const normalizeCoins = (coins: number) =>
  Number.isFinite(coins) ? Math.max(0, Math.floor(coins)) : 0;

const uniqueIds = (ids: string[]) => Array.from(new Set(ids));

export const hasCompanionItem = (state: CompanionState, itemId: string) =>
  state.ownedItemIds.includes(itemId);

export const isCompanionItemEquipped = (
  state: CompanionState,
  itemId: string
) => state.equippedItemIds.includes(itemId);

export const canPurchaseCompanionItem = (
  state: CompanionState,
  item: CompanionCatalogItem | string
) => {
  const catalogItem =
    typeof item === "string" ? getCompanionCatalogItemById(item) : item;

  if (!catalogItem || !catalogItem.available || hasCompanionItem(state, catalogItem.id)) {
    return false;
  }

  return normalizeCoins(state.coins) >= catalogItem.price;
};

export const purchaseCompanionItem = (
  state: CompanionState,
  itemId: string,
  now = new Date().toISOString()
): CompanionState => {
  const item = getCompanionCatalogItemById(itemId);

  if (!item || !canPurchaseCompanionItem(state, item)) {
    return state;
  }

  return {
    ...state,
    coins: normalizeCoins(state.coins - item.price),
    ownedItemIds: uniqueIds([...state.ownedItemIds, item.id]),
    updatedAt: now,
  };
};

export const equipCompanionItem = (
  state: CompanionState,
  itemId: string,
  now = new Date().toISOString()
): CompanionState => {
  const item = getCompanionCatalogItemById(itemId);

  if (!item || !hasCompanionItem(state, item.id)) {
    return state;
  }

  if (isCompanionItemEquipped(state, item.id)) {
    return state;
  }

  const equippedWithoutSameSlot = state.equippedItemIds.filter((equippedId) => {
    const equippedItem = getCompanionCatalogItemById(equippedId);

    return equippedItem?.slot !== item.slot;
  });

  return {
    ...state,
    equippedItemIds: uniqueIds([...equippedWithoutSameSlot, item.id]),
    updatedAt: now,
  };
};

export const getEquippedCompanionItems = (state: CompanionState) =>
  state.equippedItemIds
    .map((itemId) => getCompanionCatalogItemById(itemId))
    .filter((item): item is CompanionCatalogItem => item !== null);

export const getOwnedCompanionItems = (state: CompanionState) =>
  companionShopCatalog.filter((item) => hasCompanionItem(state, item.id));
