import { describe, expect, it } from "vitest";
import { createInitialCompanionState } from "../progression/companionProgression";
import {
  canPurchaseCompanionItem,
  equipCompanionItem,
  getEquippedCompanionItems,
  hasCompanionItem,
  isCompanionItemEquipped,
  purchaseCompanionItem,
} from "./companionInventory";

const CREATED_AT = "2026-06-09T10:00:00.000Z";
const UPDATED_AT = "2026-06-09T10:05:00.000Z";
const DRAGON_ITEM_ID = "dragon-premium";
const CAPYBARA_ITEM_ID = "capybara-season";

describe("companionInventory", () => {
  it("allows purchasing an available item when coins are sufficient", () => {
    const state = {
      ...createInitialCompanionState(CREATED_AT),
      coins: 300,
    };

    expect(canPurchaseCompanionItem(state, DRAGON_ITEM_ID)).toBe(true);

    const purchased = purchaseCompanionItem(state, DRAGON_ITEM_ID, UPDATED_AT);

    expect(purchased.coins).toBe(40);
    expect(hasCompanionItem(purchased, DRAGON_ITEM_ID)).toBe(true);
    expect(purchased.updatedAt).toBe(UPDATED_AT);
  });

  it("fails safely when coins are insufficient", () => {
    const state = {
      ...createInitialCompanionState(CREATED_AT),
      coins: 20,
    };

    expect(canPurchaseCompanionItem(state, DRAGON_ITEM_ID)).toBe(false);
    expect(purchaseCompanionItem(state, DRAGON_ITEM_ID)).toBe(state);
  });

  it("keeps purchases idempotent", () => {
    const state = {
      ...createInitialCompanionState(CREATED_AT),
      coins: 600,
    };
    const purchased = purchaseCompanionItem(state, DRAGON_ITEM_ID);
    const purchasedAgain = purchaseCompanionItem(purchased, DRAGON_ITEM_ID);

    expect(purchasedAgain).toBe(purchased);
    expect(purchased.ownedItemIds.filter((id) => id === DRAGON_ITEM_ID)).toHaveLength(1);
  });

  it("requires ownership before equipping", () => {
    const state = createInitialCompanionState(CREATED_AT);

    expect(equipCompanionItem(state, DRAGON_ITEM_ID)).toBe(state);
  });

  it("equips owned items and replaces items in the same slot", () => {
    const state = {
      ...createInitialCompanionState(CREATED_AT),
      coins: 600,
    };
    const withDragon = purchaseCompanionItem(state, DRAGON_ITEM_ID);
    const withCapybara = purchaseCompanionItem(withDragon, CAPYBARA_ITEM_ID);
    const dragonEquipped = equipCompanionItem(withCapybara, DRAGON_ITEM_ID);
    const capybaraEquipped = equipCompanionItem(dragonEquipped, CAPYBARA_ITEM_ID);

    expect(isCompanionItemEquipped(capybaraEquipped, CAPYBARA_ITEM_ID)).toBe(true);
    expect(isCompanionItemEquipped(capybaraEquipped, DRAGON_ITEM_ID)).toBe(false);
    expect(getEquippedCompanionItems(capybaraEquipped)).toEqual([
      expect.objectContaining({ id: CAPYBARA_ITEM_ID }),
    ]);
  });
});
