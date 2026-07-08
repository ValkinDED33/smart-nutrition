import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readLandingPageSource = () =>
  readFile(new URL("./LandingPage.tsx", import.meta.url), "utf8");

const readAppLayoutSource = () =>
  readFile(new URL("../app/layouts/AppLayout.tsx", import.meta.url), "utf8");

describe("LandingPage theme contract", () => {
  it("keeps landing visuals driven by the active color mode", async () => {
    const source = await readLandingPageSource();

    expect(source).toContain("const scene = getLandingScene(isDarkMode);");
    expect(source).toContain("background: scene.pageBackground");
    expect(source).toContain("<AnalyticsPanel copy={copy} isDarkMode={isDarkMode} />");
    expect(source).toContain("<MobileCommunityPanel copy={copy} isDarkMode={isDarkMode} />");
  });

  it("does not hardcode light analytics or phone panels outside the landing scene", async () => {
    const source = await readLandingPageSource();

    expect(source).toContain("analyticsBg: isDarkMode");
    expect(source).toContain("phoneScreenBg: isDarkMode");
    expect(source).not.toContain('bgcolor: "#f8fafc"');
    expect(source).not.toContain('bgcolor: "white"');
  });

  it("keeps guest landing navigation over the hero artwork", async () => {
    const source = await readAppLayoutSource();

    expect(source).toContain(
      'position={isLandingRoute && !user ? "absolute" : "sticky"}',
    );
    expect(source).toContain(
      'isLandingRoute && !user ? "transparent" : NAV_SURFACE_BACKGROUND',
    );
    expect(source).toContain(
      'boxShadow: isLandingRoute && !user ? "none" : "var(--sn-shadow-soft)"',
    );
  });
});
