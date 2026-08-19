import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");
const PREMIUM_ACCESS_CARD_SOURCE_PATH = "src/features/profile/PremiumAccessCard.tsx";

const collectSourceFiles = (roots: string[]) => {
  const pending = roots.map((root) => resolve(process.cwd(), root));
  const sourceFiles: string[] = [];

  while (pending.length > 0) {
    const currentPath = pending.pop();

    if (!currentPath) {
      continue;
    }

    const currentStats = statSync(currentPath);

    if (currentStats.isDirectory()) {
      for (const entry of readdirSync(currentPath)) {
        pending.push(resolve(currentPath, entry));
      }
      continue;
    }

    if (/\.(mjs|ts|tsx)$/.test(currentPath) && !/\.test\.(mjs|ts|tsx)$/.test(currentPath)) {
      sourceFiles.push(currentPath);
    }
  }

  return sourceFiles;
};

describe("profile feature warehouse contract", () => {
  it("does not expose disconnected premium purchase buttons", () => {
    const source = readSource(PREMIUM_ACCESS_CARD_SOURCE_PATH);

    expect(source).not.toContain("comingSoon");
    expect(source).not.toContain("Start 7-day trial");
    expect(source).not.toContain("Activate Pro");
    expect(source).not.toContain("disabled\n");
  });

  it("keeps premium plan labels and subscription statuses localized", () => {
    const source = readSource(PREMIUM_ACCESS_CARD_SOURCE_PATH);

    expect(source).toContain("Поточний");
    expect(source).toContain("Aktualny");
    expect(source).toContain("AI-супровід");
    expect(source).toContain("Opieka AI");
    expect(source).toContain("AI Guidance");
    expect(source).toContain("Підсумок помічника");
    expect(source).toContain("Podsumowanie asystenta");
    expect(source).toContain("Assistant summary");
    expect(source).toContain("Їжа і вода");
    expect(source).toContain("Jedzenie i woda");
    expect(source).toContain("Без активної підписки");
    expect(source).toContain("Brak aktywnej subskrypcji");
    expect(source).toContain("getPremiumStatusLabel(copy, premium.status)");
    expect(source).not.toContain("coach-режим");
    expect(source).not.toContain("tryb coach");
    expect(source).not.toContain("coach mode");
    expect(source).not.toContain("Підсумок coach");
    expect(source).not.toContain("Podsumowanie coach");
    expect(source).not.toContain("Coach summary");
    expect(source).not.toContain("FOOD_WATER_TRACKING_FEATURE");
    expect(source).not.toContain("label={`${copy.status}: ${premium.status}`");
  });

  it("keeps personalization surfaces free from onboarding/fokus planning labels", () => {
    const source = [
      readSource("src/features/community/CommunityHubCard.tsx"),
      readSource("src/features/profile/BehaviorPersonalizationCard.tsx"),
      readSource("src/features/meal/SmartRecommendations.tsx"),
    ].join("\n");

    expect(source).toContain("Ваш напрям із стартового профілю");
    expect(source).toContain("Twój kierunek z profilu startowego");
    expect(source).toContain("Your starting profile direction");
    expect(source).toContain("головний напрям звичок");
    expect(source).toContain("główny kierunek nawyków");
    expect(source).toContain("Особистий напрям");
    expect(source).toContain("Osobisty kierunek");
    expect(source).toContain("Personal direction");
    expect(source).not.toMatch(
      /Ваш фокус із онбордингу|Twój fokus z onboardingu|Your onboarding focus|фокус на звички|fokus na nawyki|Особистий фокус|Osobisty fokus|Personal focus/
    );
  });

  it("does not show unavailable companion shop items as coming soon inventory", () => {
    const source = readSource("src/features/profile/CompanionShopCard.tsx");

    expect(source).toContain("companionShopCatalog.filter((item) => item.available)");
    expect(source).toContain('data-companion-shop-studio="true"');
    expect(source).toContain('data-companion-live-preview="true"');
    expect(source).toContain('data-companion-shop-capabilities="true"');
    expect(source).toContain('data-companion-live-preview-orbit="true"');
    expect(source).toContain('const assistantToolIcons: Array<{');
    expect(source).toContain('const previewOrbitItems: Array<{');
    expect(source).toContain('{ key: "planning",');
    expect(source).toContain('{ key: "nutrition",');
    expect(source).toContain('{ key: "water",');
    expect(source).toContain('{ key: "health",');
    expect(source).toContain('{ key: "family",');
    expect(source).toContain('{ key: "reminders",');
    expect(source).toContain('{ key: "chat",');
    expect(source).toContain('{ key: "analytics",');
    expect(source).toContain('{ key: "safety",');
    expect(source).toContain("applyCompanionShopSelectionInCloud");
    expect(source).toContain('navigate("/coach")');
    expect(source).not.toContain("comingSoon");
    expect(source).not.toContain("futureItem");
    expect(source).not.toContain("Available later");
  });

  it("keeps the companion studio visible as the canonical assistant appearance surface", () => {
    const coachSource = readSource("src/pages/AiCompanionPage.tsx");
    const profileSource = readSource("src/pages/ProfilePage.tsx");
    const onboardingSource = readSource("src/pages/onboarding/OnboardingAssistantPage.tsx");
    const onboardingTypesSource = readSource("src/pages/onboarding/types.ts");
    const profileShopIndex = profileSource.indexOf("<CompanionShopCard />");
    const profileSettingsIndex = profileSource.indexOf("<AssistantCustomizationCard />");

    expect(coachSource).toContain(
      'const CompanionShopCard = lazy(() => import("../features/profile/CompanionShopCard"))'
    );
    expect(coachSource).toContain('resetKey="ai-companion:shop"');
    expect(coachSource).toContain("<CompanionShopCard />");
    expect(profileShopIndex).toBeGreaterThanOrEqual(0);
    expect(profileSettingsIndex).toBeGreaterThanOrEqual(0);
    expect(profileShopIndex).toBeLessThan(profileSettingsIndex);
    expect(onboardingSource).toContain("companionShopCatalog");
    expect(onboardingSource).toContain("freeAssistantAvatarItems");
    expect(onboardingSource).toContain("item.price === 0");
    expect(onboardingTypesSource).not.toContain("assistantAvatarOptions");
  });

  it("does not let women-health competitor branding become product direction", () => {
    const source = collectSourceFiles(["src", "server"])
      .map((filePath) => readFileSync(filePath, "utf8"))
      .join("\n");

    expect(source).not.toMatch(/Flo-level|flo app/i);
  });

  it("keeps regular cloud recovery and account copy free from infrastructure jargon", () => {
    const userFacingSources = [
      "src/shared/components/BackendOfflineBanner.tsx",
      "src/shared/components/SessionRestoreFallback.tsx",
      PREMIUM_ACCESS_CARD_SOURCE_PATH,
      "src/features/profile/accountDataCardCopy.ts",
    ]
      .map(readSource)
      .join("\n");

    expect(userFacingSources).toContain("Хмарний сервіс");
    expect(userFacingSources).toContain("Usługa w chmurze");
    expect(userFacingSources).toContain("cloud service");
    expect(userFacingSources).toContain("protected sync");
    expect(userFacingSources).not.toContain("Cloud API");
    expect(userFacingSources).not.toContain("cloud server");
    expect(userFacingSources).not.toContain("Backend прокидається");
    expect(userFacingSources).not.toContain("Доступ керується сервером");
    expect(userFacingSources).not.toContain("zarządzany przez serwer");
    expect(userFacingSources).not.toContain("verified by the server");
  });

  it("keeps PWA update recovery copy user-facing", () => {
    const source = readSource("src/shared/components/PwaUpdateBanner.tsx");

    expect(source).toContain("останні виправлення");
    expect(source).toContain("najnowszych poprawek");
    expect(source).toContain("latest fixes");
    expect(source).not.toMatch(/stale cache|deployment|деплою|wdrożeniu/i);
  });

  it("keeps crash and lazy-section recovery copy user-facing", () => {
    const userFacingRecoverySources = [
      "src/shared/i18n/uk.ts",
      "src/shared/i18n/pl.ts",
      "src/shared/i18n/en.ts",
      "src/shared/language/index.tsx",
      "src/shared/ui/lazyModuleRecovery.ts",
      "src/pages/MealBuilderPage.tsx",
    ]
      .map(readSource)
      .join("\n");

    expect(userFacingRecoverySources).toContain("стабільний екран");
    expect(userFacingRecoverySources).toContain("stabilny ekran");
    expect(userFacingRecoverySources).toContain("stable screen");
    expect(userFacingRecoverySources).toContain("without signing you out");
    expect(userFacingRecoverySources).not.toMatch(
      /stale UI cache|old cache|cache UI|старий UI-кеш|старий кеш|stary cache|stary plik/i
    );
    expect(userFacingRecoverySources).not.toMatch(/old chunk|старий chunk|stary chunk/i);
  });

  it("keeps error boundary diagnostics user-facing", () => {
    const source = readSource("src/shared/components/ErrorBoundary.tsx");
    const recoveryCopy = [
      "src/shared/i18n/uk.ts",
      "src/shared/i18n/pl.ts",
      "src/shared/i18n/en.ts",
      "src/shared/language/index.tsx",
    ]
      .map(readSource)
      .join("\n");

    expect(source).toContain("recoveryDetailsLabel");
    expect(recoveryCopy).toContain("Деталі збережено для відновлення");
    expect(recoveryCopy).toContain("Szczegóły zapisano do naprawy");
    expect(recoveryCopy).toContain("Recovery details saved");
    expect(source).not.toContain('label="stale build"');
    expect(source).not.toContain("diagnostic.errorName}: ${this.state.diagnostic.message");
  });

  it("gates AI provider diagnostics away from the regular assistant settings", () => {
    const source = readSource("src/pages/AiCompanionPage.tsx");

    expect(source).toContain("canAccessAdminCenter(user?.role)");
    expect(source).toContain("const canSeeAssistantOperations");
    expect(source).toContain("canSeeAssistantOperations ? copy.operationsTitle : copy.readinessTitle");
    expect(source).toContain("Assistant readiness");
    expect(source).toContain("Gotowość asystenta");
    expect(source).toContain("Готовність помічника");
    expect(source).toContain("Team diagnostics");
    expect(source).toContain("Osobisty asystent");
    expect(source).toContain("Dostawcy AI");
    expect(source).toContain("Uwaga na wodę");
    expect(source).toContain("Особистий помічник");
    expect(source).toContain("Перевіримо прогрес");
    expect(source).toContain("Помічник Smart Nutrition");
    expect(source).not.toContain("Osobisty companion");
    expect(source).not.toContain("Providerzy AI");
    expect(source).not.toContain("Fokus na wodzie");
    expect(source).not.toContain("Nowy companion");
    expect(source).not.toContain("Особистий companion");
    expect(source).not.toContain("Новий companion");
    expect(source).not.toContain("Новий помічник");
    expect(source).not.toContain("Час перевірити прогрес");
    expect(source).not.toContain("М'який контроль");
    expect(source).not.toContain("ваш помічник");
    expect(source).not.toContain("Below you can see active providers");
    expect(source).not.toContain("Niżej widać aktywnych providerów");
    expect(source).not.toContain("Нижче видно активних провайдерів");
  });

  it("keeps assistant growth and customization copy native in Ukrainian and Polish", () => {
    const source = [
      readSource("src/features/companion/CompanionProgressCard.tsx"),
      readSource("src/features/profile/AssistantCustomizationCard.tsx"),
      readSource("src/features/assistant/EcosystemPulse.tsx"),
    ].join("\n");

    expect(source).toContain("Розвиток помічника");
    expect(source).toContain("помічник отримав перший справжній контекст");
    expect(source).toContain("Образ помічника");
    expect(source).toContain('data-assistant-customization-worker-card="true"');
    expect(source).toContain('data-assistant-customization-worker-toolbelt="true"');
    expect(source).toContain("Один AI-працівник для всього проєкту");
    expect(source).toContain("Telegram");
    expect(source).toContain("Тиск");
    expect(source).toContain("Rozwój asystenta");
    expect(source).toContain("asystent dostał pierwszy prawdziwy kontekst");
    expect(source).toContain("Wygląd asystenta");
    expect(source).toContain("Assistant evolution");
    expect(source).toContain("assistant gets its first real context");
    expect(source).toContain("Assistant appearance");
    expect(source).not.toMatch(
      /Розвиток компаньйона|компаньйон отримав|Превʼю companion|Швидкий 2D|Живий 3D|Живий образ помічника|Rozwój companiona|companion dostał|Podgląd companion|Szybki 2D|Żywy 3D|Żywy wygląd asystenta|постійним companion|stałego companion|зв'язок з companion|więź z companion|Companion evolution|companion gets|companion bond|persistent companion|Living assistant look/
    );
  });

  it("keeps body progress copy native in Ukrainian and Polish", () => {
    const source = [
      readSource("src/features/profile/QuickWeightCheckInCard.tsx"),
      readSource("src/features/profile/WeightTrendCard.tsx"),
      readSource("src/features/profile/BodyWeeklyReportCard.tsx"),
      readSource("src/features/profile/MeasurementsCheckInCard.tsx"),
    ].join("\n");

    expect(source).toContain("Останні записи ваги");
    expect(source).toContain("AI-сигнал стабілізації ваги");
    expect(source).toContain("щотижневий запис");
    expect(source).toContain("Ostatnie zapisy wagi");
    expect(source).toContain("AI-sygnał stabilizacji wagi");
    expect(source).toContain("tygodniowy zapis");
    expect(source).not.toMatch(
      /Останні check-in|Перші два check-in|Ще немає weekly check-in|AI визначення plateau|сигнал plateau|Ostatnie check-iny|Pierwsze dwa check-iny|Brak zapisanych weekly check-in|Osobisty fokus asystenta|postęp companion|прогрес companion/
    );
  });
});
