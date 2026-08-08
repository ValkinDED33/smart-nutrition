import { describe, expect, it } from "vitest";
import {
  companionShopCatalog,
  getCompanionCatalogItemById,
} from "./companionCatalog";

const DRAGON_ITEM_ID = "dragon-premium";
const CAPYBARA_ITEM_ID = "capybara-season";
const ROBOT_ITEM_ID = "robot-classic";

describe("companionCatalog", () => {
  it("defines a stable shop catalog outside React", () => {
    expect(companionShopCatalog.length).toBeGreaterThan(0);
    expect(companionShopCatalog.map((item) => item.id)).toContain(DRAGON_ITEM_ID);
  });

  it("returns catalog items by id", () => {
    expect(getCompanionCatalogItemById(DRAGON_ITEM_ID)).toMatchObject({
      id: DRAGON_ITEM_ID,
      category: "fantasy",
      price: 260,
      rarity: "legendary",
      companionKind: "dragon",
      available: true,
    });
  });

  it("keeps base robot customization free and cosmetic", () => {
    expect(getCompanionCatalogItemById(ROBOT_ITEM_ID)).toMatchObject({
      id: ROBOT_ITEM_ID,
      category: "robot",
      price: 0,
      rarity: "common",
      companionKind: "robot",
      available: true,
    });
  });

  it("keeps localized display copy in the catalog", () => {
    const item = getCompanionCatalogItemById(CAPYBARA_ITEM_ID);

    expect(item?.title.uk).toBe("Спокій капібари");
    expect(item?.title.pl).toBe("Spokój kapibary");
    expect(item?.title.en).toBe("Capybara calm");
  });
});
