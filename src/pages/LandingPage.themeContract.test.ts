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

  it("keeps Ukrainian and Polish landing copy in native product language", async () => {
    const source = await readLandingPageSource();

    expect(source).toContain("Побачити помічника");
    expect(source).toContain("простір з помічником");
    expect(source).toContain("запитати помічника");
    expect(source).toContain("AI-сканер їжі");
    expect(source).toContain("Zobacz asystenta");
    expect(source).toContain("przestrzeń z asystentem");
    expect(source).toContain("zapytaj asystenta");
    expect(source).toContain("AI skaner jedzenia");
    expect(source).not.toContain("Побачити companion");
    expect(source).not.toContain("companion-платформа");
    expect(source).not.toContain("запитати companion");
    expect(source).not.toContain("Zobacz companion");
    expect(source).not.toContain("companion-platforma");
    expect(source).not.toContain("zapytaj companion");
  });
});
