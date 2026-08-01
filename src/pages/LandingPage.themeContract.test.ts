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

  it("keeps the first-viewport companion as a living branded scene", async () => {
    const source = await readLandingPageSource();

    expect(source).toContain("AIDiscoveryAccordion");
    expect(source).toContain("CompanionCapabilitySlider");
    expect(source).toContain("landingCompanionOrbitRings");
    expect(source).toContain("landingCompanionSignalNodes");
    expect(source).toContain('data-landing-living-companion-field="true"');
    expect(source).toContain('data-landing-living-companion-stage="true"');
    expect(source).toContain("landingCompanionOrbit");
    expect(source).toContain("landingCompanionSignal");
    expect(source).toContain("prefers-reduced-motion: reduce");
    expect(source).toContain("playAIDiscoverySound");
    expect(source).toContain("playGentleClickSound");
  });

  it("keeps the landing hero from overlapping on medium desktop widths", async () => {
    const source = await readLandingPageSource();

    expect(source).toContain('display: { xs: "flex", md: "grid", lg: "grid" }');
    expect(source).toContain('position: { xs: "relative", lg: "absolute" }');
    expect(source).toContain("SHOW_EXTENDED_LANDING_SECTIONS = false");
    expect(source).toContain('display: "none"');
    expect(source).toContain('md: "minmax(0, 0.9fr) minmax(360px, 0.78fr)"');
    expect(source).toContain('lg: "minmax(420px, 0.78fr) minmax(520px, 1fr)"');
    expect(source).toContain("fontSize: { xs: 42, sm: 62, md: 56, lg: 66, xl: 74 }");
    expect(source).toContain('width: { xs: "100%", md: "100%", lg: "56%", xl: "58%" }');
  });

  it("keeps landing magic interactions accessible instead of hover-only", async () => {
    const source = await readLandingPageSource();

    expect(source).toContain("aria-expanded={isOpen}");
    expect(source).toContain("aria-controls={panelId}");
    expect(source).toContain("role=\"region\"");
    expect(source).toContain("transform: isOpen ? \"rotate(180deg)\" : \"rotate(0deg)\"");
    expect(source).toContain('aria-label="Previous assistant capability"');
    expect(source).toContain('aria-label="Next assistant capability"');
    expect(source).toContain('"&:focus-visible"');
    expect(source).toContain('"&:hover"');
    expect(source).toContain('gridTemplateColumns: { xs: "1fr", lg: "0.48fr 0.52fr" }');
  });
});
