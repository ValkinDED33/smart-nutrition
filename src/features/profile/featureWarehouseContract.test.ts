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
    expect(source).toContain("Їжа і вода");
    expect(source).toContain("Jedzenie i woda");
    expect(source).toContain("Без активної підписки");
    expect(source).toContain("Brak aktywnej subskrypcji");
    expect(source).toContain("getPremiumStatusLabel(copy, premium.status)");
    expect(source).not.toContain("FOOD_WATER_TRACKING_FEATURE");
    expect(source).not.toContain("label={`${copy.status}: ${premium.status}`");
  });

  it("does not show unavailable companion shop items as coming soon inventory", () => {
    const source = readSource("src/features/profile/CompanionShopCard.tsx");

    expect(source).toContain("companionShopCatalog.filter((item) => item.available)");
    expect(source).not.toContain("comingSoon");
    expect(source).not.toContain("futureItem");
    expect(source).not.toContain("Available later");
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
    expect(source).not.toContain("Below you can see active providers");
    expect(source).not.toContain("Niżej widać aktywnych providerów");
    expect(source).not.toContain("Нижче видно активних провайдерів");
  });
});
