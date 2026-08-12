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
    expect(source).toContain("Живий помічник");
    expect(source).toContain("Попередня можливість помічника");
    expect(source).toContain("розумні підказки");
    expect(source).toContain("Zobacz asystenta");
    expect(source).toContain("przestrzeń z asystentem");
    expect(source).toContain("zapytaj asystenta");
    expect(source).toContain("AI skaner jedzenia");
    expect(source).toContain("Żywy asystent");
    expect(source).toContain("Poprzednia możliwość asystenta");
    expect(source).toContain("mądre podpowiedzi");
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
    expect(source).toContain('data-landing-companion-toolbelt="true"');
    expect(source).toContain('data-landing-ai-worker-signal="true"');
    expect(source).toContain("const companionToolBadges = copy.featureRail.map");
    expect(source).toContain("const workerSignals = copy.sceneCards.map");
    expect(source).toContain("landingCompanionOrbit");
    expect(source).toContain("landingCompanionSignal");
    expect(source).toContain("prefers-reduced-motion: reduce");
    expect(source).toContain("playAIDiscoverySound");
    expect(source).toContain("playGentleClickSound");
  });

  it("makes the guest landing feel like an AI worker is already on duty", async () => {
    const source = await readLandingPageSource();

    expect(source).toContain("LandingAssistantWorkerAvatar");
    expect(source).toContain("LANDING_DEFAULT_COMPANION_KIND");
    expect(source).toContain('data-landing-assistant-worker-avatar');
    expect(source).not.toContain('variant="robot"');
    expect(source).toContain("Тут працює твій");
    expect(source).toContain("AI-працівник харчування і здоров'я");
    expect(source).toContain("Це не сайт із AI-функцією");
    expect(source).toContain("Помічник на зміні");
    expect(source).toContain("Той самий працівник приймає фото, задачі, воду, ліки і тиск.");
    expect(source).toContain("Tu pracuje Twój");
    expect(source).toContain("AI pracownik żywienia i zdrowia");
    expect(source).toContain("To nie strona z funkcją AI");
    expect(source).toContain("Asystent na zmianie");
    expect(source).toContain("Your");
    expect(source).toContain("AI worker");
    expect(source).toContain("is already on duty");
    expect(source).toContain("This is not a website with an AI feature");
    expect(source).toContain("Assistant on duty");
  });

  it("places the capability slider as the first detailed section after the calm hero", async () => {
    const source = await readLandingPageSource();

    expect(source.indexOf("<Hero copy={copy} isDarkMode={isDarkMode} />")).toBeLessThan(
      source.indexOf("<CompanionCapabilitySlider copy={copy} isDarkMode={isDarkMode} />"),
    );
    expect(
      source.indexOf("<CompanionCapabilitySlider copy={copy} isDarkMode={isDarkMode} />"),
    ).toBeLessThan(
      source.indexOf("<AIDiscoveryAccordion copy={copy} isDarkMode={isDarkMode} />"),
    );
  });

  it("keeps landing product rotation stable during a render while changing on page load", async () => {
    const source = await readLandingPageSource();

    expect(source).toContain("createLandingRotationStart");
    expect(source).toContain("globalThis.crypto.getRandomValues");
    expect(source).not.toContain("Math.random");
    expect(source).toContain("const [heroInsightStart] = useState(() =>");
    expect(source).toContain("const [heroLineIndex] = useState(() =>");
    expect(source).toContain("const [insightStart] = useState(() =>");
    expect(source).toContain("getRotatedItems(");
  });

  it("keeps the landing hero from overlapping on medium desktop widths", async () => {
    const source = await readLandingPageSource();

    expect(source).toContain('display: { xs: "flex", md: "grid", lg: "grid" }');
    expect(source).toContain('position: "relative"');
    expect(source).toContain('gridColumn: { md: "2", lg: "2" }');
    expect(source).toContain("SHOW_EXTENDED_LANDING_SECTIONS = false");
    expect(source).toContain('display: "none"');
    expect(source).toContain('md: "minmax(0, 0.9fr) minmax(360px, 0.78fr)"');
    expect(source).toContain('lg: "minmax(0, 0.82fr) minmax(500px, 1fr)"');
    expect(source).toContain("fontSize: { xs: 40, sm: 58, md: 50, lg: 60, xl: 70 }");
    expect(source).toContain('width: "100%"');
  });

  it("keeps landing magic interactions accessible instead of hover-only", async () => {
    const source = await readLandingPageSource();

    expect(source).toContain("aria-expanded={isOpen}");
    expect(source).toContain("aria-controls={panelId}");
    expect(source).toContain("role=\"region\"");
    expect(source).toContain("transform: isOpen ? \"rotate(180deg)\" : \"rotate(0deg)\"");
    expect(source).toContain("aria-label={copy.sliderPreviousLabel}");
    expect(source).toContain("aria-label={copy.sliderNextLabel}");
    expect(source).toContain("aria-label={copy.sliderAriaLabel}");
    expect(source).toContain("assistantTools");
    expect(source).toContain("getAssistantToolIcon(index)");
    expect(source).toContain('data-landing-discovery-window="true"');
    expect(source).toContain("getNutritionInsightIcon(item, index)");
    expect(source).toContain("const slides: CompanionCapabilitySlide[] = assistantTools.map");
    expect(source).toContain('"&:focus-visible"');
    expect(source).toContain('"&:hover"');
    expect(source).toContain('gridTemplateColumns: { xs: "1fr", lg: "0.48fr 0.52fr" }');
  });
});
