import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) =>
  readFile(new URL(path, import.meta.url), "utf8");
const ASSISTANT_VARIANT_PROP = "assistantVariant={assistant.companionKind}";
const PROFILE_ASSISTANT_VARIANT_PROP =
  "assistantVariant={profile.assistant.companionKind}";
const ASSISTANT_NAME_PROP = "assistantName={assistantDisplayName}";

describe("Smart Nutrition visual system contract", () => {
  it("exposes one theme-driven companion visual language", async () => {
    const source = await readSource("../theme/AppThemeProvider.tsx");

    expect(source).toContain("--sn-companion-hero");
    expect(source).toContain("--sn-companion-overlay");
    expect(source).toContain("--sn-portal-ring");
    expect(source).toContain("--sn-scene-landscape");
    expect(source).toContain(".sn-companion-panel");
    expect(source).toContain(
      "linear-gradient(135deg, var(--sn-surface-elevated), var(--sn-surface-glass))",
    );
  });

  it("keeps shared page, card, and auth surfaces on the premium system", async () => {
    const [pageShell, sectionCard, authSurface] = await Promise.all([
      readSource("./PageShell.tsx"),
      readSource("./SectionCard.tsx"),
      readSource("./AuthSurface.tsx"),
    ]);

    expect(pageShell).toContain('className="sn-premium-panel sn-page-hero"');
    expect(pageShell).toContain('data-ai-space-shell="true"');
    expect(pageShell).toContain('data-ai-space-page-hero="true"');
    expect(pageShell).toContain('data-ai-master-page-grid="true"');
    expect(pageShell).toContain('data-ai-page-route-space="true"');
    expect(pageShell).toContain("PAGE_SHELL_ROUTE_LINE");
    expect(pageShell).toContain('data-ai-shared-element-transition="page-hero"');
    expect(pageShell).toContain('data-ai-page-signal-dot="true"');
    expect(sectionCard).toContain('className="sn-premium-panel"');
    expect(sectionCard).toContain('data-ai-living-card="true"');
    expect(sectionCard).toContain('data-ai-worker-card="true"');
    expect(sectionCard).toContain('data-ai-card-worker-signal="true"');
    expect(sectionCard).toContain('data-ai-card-worker-orbit="true"');
    expect(sectionCard).toContain('data-ai-shared-element-transition="living-card"');
    expect(sectionCard).toContain("SECTION_CARD_SIGNAL_LINE");
    expect(sectionCard).toContain("SECTION_CARD_WORKER_SIGNAL");
    expect(sectionCard).toContain("SECTION_CARD_AI_ORBIT");
    expect(sectionCard).toContain("&:hover");
    expect(sectionCard).toContain("&:focus-within");
    expect(authSurface).toContain('className="sn-premium-panel sn-auth-blueprint-panel"');
    expect(authSurface).toContain('data-auth-blueprint-surface="true"');
    expect(authSurface).toContain("sn-auth-blueprint-panel");
    expect(authSurface).toContain("linear-gradient(rgba(45,212,191,0.05) 1px");
  });

  it("keeps the assistant avatar living effects in the shared avatar component", async () => {
    const [avatarSource, avatarPartsSource] = await Promise.all([
      readSource("../components/AssistantAvatar.tsx"),
      readSource("../components/assistantAvatarParts.tsx"),
    ]);

    expect(avatarSource).toContain("assistantAuraVariants");
    expect(avatarSource).toContain('data-assistant-avatar-living-aura="true"');
    expect(avatarSource).toContain('data-assistant-avatar-orbit="true"');
    expect(avatarSource).toContain('data-assistant-avatar-robot-shell="true"');
    expect(avatarSource).toContain('data-assistant-avatar-robot-headset="true"');
    expect(avatarSource).toContain('data-assistant-avatar-robot-arms="true"');
    expect(avatarSource).toContain('data-assistant-avatar-heart-core="true"');
    expect(avatarPartsSource).toContain('data-assistant-avatar-robot-visor="true"');
    expect(avatarSource).toContain("isLetterCompanion(variant) && !isRobot");
    expect(avatarSource).toContain('mood === "concerned"');
    expect(avatarSource).toContain('mood === "celebrate"');
  });

  it("keeps public auth and first-run assistant surfaces on the free robot default", async () => {
    const sources = await Promise.all([
      readSource("../../pages/LandingPage.tsx"),
      readSource("../../pages/RegisterPage.tsx"),
      readSource("../../pages/ForgotPasswordPage.tsx"),
      readSource("../../pages/ResetPasswordPage.tsx"),
      readSource("../../pages/onboarding/OnboardingChoicePage.tsx"),
      readSource("../../widgets/GlobalAssistantLayer.tsx"),
    ]);
    const combinedSource = sources.join("\n");

    expect(combinedSource).toContain('LANDING_DEFAULT_COMPANION_KIND = "robot"');
    expect(combinedSource).toContain("companionKind : \"robot\"");
    expect(combinedSource).not.toContain('variant="dragon"');
    expect(combinedSource).not.toContain('variant="panda"');
    expect(combinedSource).not.toContain('variant="fox"');
  });

  it("keeps authenticated home using theme-aware companion colors", async () => {
    const [source, assistantDisplayNameSource] = await Promise.all([
      readSource("../../pages/HomePage.tsx"),
      readSource("../../features/assistant/assistantDisplayName.ts"),
    ]);

    expect(source).toContain("useAppColorMode");
    expect(source).toContain("heroBackground");
    expect(source).toContain("heroOverlay");
    expect(source).toContain("heroRing");
    expect(source).toContain("getAssistantDisplayName(assistant.name, appLanguage)");
    expect(source).not.toContain('"Smart Nutrition AI"');
    expect(assistantDisplayNameSource).toContain("legacyAssistantNameKeys");
    expect(assistantDisplayNameSource).toContain("normalizeAssistantNameKey");
    expect(source).toContain("env(safe-area-inset-bottom");
    expect(source).toContain('className="sn-companion-panel"');
    expect(source).toContain('data-ai-worker-home-center="true"');
    expect(source).toContain('data-ai-worker-tool-grid="true"');
    expect(source).not.toContain("HyeMye");
  });

  it("keeps shared section navigation on morphing tab behavior", async () => {
    const source = await readSource("./SectionTabs.tsx");

    expect(source).toContain('data-ai-morphing-tabs="true"');
    expect(source).toContain('data-ai-shared-element-transition="section-tabs"');
    expect(source).toContain("data-ai-morphing-tab={section.id}");
    expect(source).toContain("&::before");
    expect(source).toContain("&::after");
    expect(source).toContain("&:hover::before");
    expect(source).toContain("&:hover::after");
    expect(source).toContain("&:focus-visible");
  });

  it("keeps the 2026 AI master blueprint visible in tracked product code", async () => {
    const [
      landing,
      home,
      dashboard,
      aiCompanion,
      progress,
      recipes,
      mealsRoute,
      meals,
      profile,
      community,
      onboarding,
      adminCenter,
      womenHealth,
      blueprintPanel,
      globalAssistant,
      companionCatalog,
    ] = await Promise.all([
      readSource("../../pages/LandingPage.tsx"),
      readSource("../../pages/HomePage.tsx"),
      readSource("../../pages/DashboardPage.tsx"),
      readSource("../../pages/AiCompanionPage.tsx"),
      readSource("../../pages/ProgressPage.tsx"),
      readSource("../../pages/RecipesPage.tsx"),
      readSource("../../pages/MealsPage.tsx"),
      readSource("../../pages/MealBuilderPage.tsx"),
      readSource("../../pages/ProfilePage.tsx"),
      readSource("../../pages/CommunityPage.tsx"),
      readSource("../../pages/OnboardingPage.tsx"),
      readSource("../../features/platform/AdminCenterCard.tsx"),
      readSource("../../features/profile/WomenHealthOverviewCard.tsx"),
      readSource("./AIMasterBlueprintPanel.tsx"),
      readSource("../../widgets/GlobalAssistantLayer.tsx"),
      readSource("../../companion/catalog/companionCatalog.ts"),
    ]);

    expect(landing).toContain("CompanionCapabilitySlider");
    expect(landing).toContain("AIDiscoveryAccordion");
    expect(landing).toContain("nutritionInsights");
    expect(landing).toContain("createLandingRotationStart");
    expect(landing).toContain('data-landing-discovery-window="true"');

    expect(home).toContain('data-ai-worker-command-center="true"');
    expect(home).toContain('data-home-command-center="ecosystem-rail"');
    expect(home).toContain('data-home-command-center="live-panels"');
    expect(home).toContain("AIMasterBlueprintPanel");
    expect(home).toContain("homeBlueprintPatterns");
    expect(home).toContain("blueprintPatterns");
    expect(home).toContain("blueprintPatternDescriptions");
    expect(home).toContain('key: "context"');
    expect(home).toContain("bottomSheetVariants");
    expect(home).toContain("Drawer");
    expect(home).toContain("runAssistantAction");
    expect(dashboard).toContain('lazy(() => import("./HomePage"))');

    expect(aiCompanion).toContain("AIMasterBlueprintPanel");
    expect(progress).toContain("AIMasterBlueprintPanel");
    expect(recipes).toContain("AIMasterBlueprintPanel");
    expect(mealsRoute).toContain('lazy(() => import("./MealBuilderPage"))');
    expect(meals).toContain("AIMasterBlueprintPanel");
    expect(profile).toContain("AIMasterBlueprintPanel");
    expect(community).toContain("AIMasterBlueprintPanel");
    expect(onboarding).toContain("AIMasterBlueprintPanel");
    expect(onboarding).toContain('data-onboarding-ai-master-blueprint="true"');
    expect(adminCenter).toContain("AIMasterBlueprintPanel");
    expect(adminCenter).toContain("adminBlueprintPatterns");
    expect(womenHealth).toContain("AIMasterBlueprintPanel");
    expect(womenHealth).toContain("womenHealthBlueprintPatterns");
    expect(womenHealth).toContain('data-women-health-partner-access="true"');
    expect(blueprintPanel).toContain('data-ai-master-blueprint-patterns="true"');
    expect(blueprintPanel).toContain('data-ai-master-blueprint-pattern={pattern.key}');
    expect(blueprintPanel).toContain("assistantVariant?: AssistantCompanionKind");
    expect(blueprintPanel).toContain("assistantName?: string");
    expect(blueprintPanel).toContain("variant={assistantVariant}");
    expect(blueprintPanel).toContain("name={assistantName}");
    expect(blueprintPanel).toContain("Interaction & Motion System");
    expect(blueprintPanel).toContain("Assistant states");
    expect(blueprintPanel).toContain("Motion principles");
    expect(blueprintPanel).toContain("blueprintModules");
    expect(blueprintPanel).toContain("platformFrames");
    expect(blueprintPanel).toContain("sideRailModules");
    expect(blueprintPanel).toContain("productModules");
    expect(blueprintPanel).toContain("modalPatterns");
    expect(blueprintPanel).toContain("domainWindows");
    expect(blueprintPanel).toContain('data-ai-master-blueprint-product-map="true"');
    expect(blueprintPanel).toContain('data-ai-master-blueprint-side-rail="true"');
    expect(blueprintPanel).toContain('data-ai-master-blueprint-platforms="true"');
    expect(blueprintPanel).toContain("data-ai-master-blueprint-platform={frame.label.toLowerCase()}");
    expect(blueprintPanel).toContain('data-ai-master-blueprint-modals="true"');
    expect(blueprintPanel).toContain("data-ai-master-blueprint-modal={modal}");
    expect(blueprintPanel).toContain('data-ai-master-blueprint-domain-windows="true"');
    expect(blueprintPanel).toContain("data-ai-master-blueprint-domain={window.label}");
    expect(blueprintPanel).toContain("Women's health");
    expect(blueprintPanel).toContain("Telegram worker");
    expect(blueprintPanel).toContain("whileHover");
    expect(blueprintPanel).toContain("&:focus-visible");

    expect(home).toContain(ASSISTANT_VARIANT_PROP);
    expect(home).toContain(ASSISTANT_NAME_PROP);
    expect(aiCompanion).toContain(ASSISTANT_VARIANT_PROP);
    expect(aiCompanion).toContain(ASSISTANT_NAME_PROP);
    expect(progress).toContain(ASSISTANT_VARIANT_PROP);
    expect(progress).toContain(ASSISTANT_NAME_PROP);
    expect(recipes).toContain(ASSISTANT_VARIANT_PROP);
    expect(recipes).toContain(ASSISTANT_NAME_PROP);
    expect(meals).toContain(ASSISTANT_VARIANT_PROP);
    expect(profile).toContain(PROFILE_ASSISTANT_VARIANT_PROP);
    expect(community).toContain(ASSISTANT_VARIANT_PROP);
    expect(community).toContain(ASSISTANT_NAME_PROP);
    expect(adminCenter).toContain(ASSISTANT_VARIANT_PROP);
    expect(adminCenter).toContain(ASSISTANT_NAME_PROP);
    expect(womenHealth).toContain(PROFILE_ASSISTANT_VARIANT_PROP);

    expect(globalAssistant).toContain("workerActivities");
    expect(globalAssistant).toContain("toolbelt");
    expect(globalAssistant).toContain("commandDock");
    expect(globalAssistant).toContain('data-global-assistant-command-dock="true"');
    expect(globalAssistant).toContain('data-global-assistant-command={command.route}');
    expect(globalAssistant).toContain("/meals?mode=barcode");
    expect(globalAssistant).toContain("/meals?mode=photo");
    expect(globalAssistant).toContain("/profile#women-health");
    expect(globalAssistant).toContain("useAssistantPointerLookOffset");
    expect(globalAssistant).toContain('data-global-ai-worker-roaming="true"');
    expect(globalAssistant).toContain('data-global-ai-worker-task-node="true"');
    expect(globalAssistant).toContain('data-global-ai-worker-mini-console="true"');
    expect(globalAssistant).toContain("assistantPanelBackground");
    expect(globalAssistant).toContain("assistantOrbitBackground");

    expect(companionCatalog).toContain("companionShopCatalog");
    expect(companionCatalog).toContain('category: "robot"');
    expect(companionCatalog).toContain('category: "animal"');
    expect(companionCatalog).toContain('category: "fantasy"');
    expect(companionCatalog).toContain('rarity: "legendary"');
  });
});
