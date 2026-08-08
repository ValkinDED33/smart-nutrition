import { describe, expect, it } from "vitest";
import {
  desktopNavigationItems,
  getVisibleNavigationItems,
  mobileNavigationItems,
} from "./appNavigation";

const WOMEN_HEALTH_ROUTE = "/profile#women-health";

describe("appNavigation", () => {
  it("keeps women-health navigation hidden until profile context allows it", () => {
    const visible = getVisibleNavigationItems(desktopNavigationItems, "USER", {
      womenHealthVisible: false,
    });

    expect(visible.map((item) => item.value)).not.toContain(WOMEN_HEALTH_ROUTE);
  });

  it("surfaces women-health navigation through the canonical profile entrypoint", () => {
    const desktop = getVisibleNavigationItems(desktopNavigationItems, "USER", {
      womenHealthVisible: true,
    });
    const mobile = getVisibleNavigationItems(mobileNavigationItems, "USER", {
      womenHealthVisible: true,
    });

    expect(desktop.map((item) => item.value)).toContain(WOMEN_HEALTH_ROUTE);
    expect(mobile.map((item) => item.value)).toContain(WOMEN_HEALTH_ROUTE);
  });

  it("does not use admin access as a substitute for women-health context", () => {
    const visible = getVisibleNavigationItems(desktopNavigationItems, "OWNER", {
      womenHealthVisible: false,
    });

    expect(visible.map((item) => item.value)).toContain("/admin");
    expect(visible.map((item) => item.value)).not.toContain(WOMEN_HEALTH_ROUTE);
  });
});
