import { describe, expect, it } from "vitest";
import {
  companionShopCatalog,
  getCompanionCatalogItemById,
} from "./companionCatalog";

const DRAGON_ITEM_ID = "dragon-premium";
const CAPYBARA_ITEM_ID = "capybara-season";

describe("companionCatalog", () => {
  it("defines a stable shop catalog outside React", () => {
    expect(companionShopCatalog.length).toBeGreaterThan(0);
    expect(companionShopCatalog.map((item) => item.id)).toContain(DRAGON_ITEM_ID);
  });

  it("returns catalog items by id", () => {
    expect(getCompanionCatalogItemById(DRAGON_ITEM_ID)).toMatchObject({
      id: DRAGON_ITEM_ID,
      category: "premium",
      price: 260,
      companionKind: "dragon",
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
