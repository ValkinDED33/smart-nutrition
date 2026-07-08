import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) =>
  readFile(new URL(path, import.meta.url), "utf8");

describe("Smart Nutrition visual system coverage", () => {
  it("keeps water and AI companion hero surfaces on the shared companion scene", async () => {
    const [waterPage, companionPage] = await Promise.all([
      readSource("../../pages/WaterPage.tsx"),
      readSource("../../pages/AiCompanionPage.tsx"),
    ]);

    expect(waterPage).toContain('className="sn-companion-panel"');
    expect(waterPage).toContain("var(--sn-on-companion)");
    expect(companionPage).toContain('className="sn-companion-panel"');
    expect(companionPage).toContain("var(--sn-on-companion-muted)");
  });

  it("keeps food and profile detail panels theme-aware", async () => {
    const sources = await Promise.all([
      readSource("../../features/meal/FoodCommandCenter.tsx"),
      readSource("../../features/meal/PhotoMealAssistant.tsx"),
      readSource("../../features/meal/ProductNutritionFacts.tsx"),
      readSource("../../features/profile/ProfileForm.tsx"),
      readSource("../../features/meal/MealDayOverview.tsx"),
      readSource("../../features/meal/MealEntryEditorPanel.tsx"),
      readSource("../../features/meal/SmartRecommendations.tsx"),
      readSource("../../features/profile/AccountDataCard.tsx"),
      readSource("../../features/profile/MotivationHubCard.tsx"),
      readSource("../../features/profile/CompanionShopCard.tsx"),
      readSource("../../features/education/LearningHubCard.tsx"),
      readSource("../../features/platform/AdminCenterCard.tsx"),
    ]);

    for (const source of sources) {
      expect(source).toContain("sn-premium-panel");
    }

    expect(sources.join("\n")).not.toContain("rgba(248,250,252,0.86)");
    expect(sources.join("\n")).not.toContain("rgba(255,255,255,0.94)");
    expect(sources.join("\n")).not.toContain("rgba(240,253,250,0.55)");
    expect(sources.join("\n")).not.toContain("rgba(254,242,242,0.72)");
  });

  it("keeps the application shell mobile-safe and token-driven", async () => {
    const source = await readSource("../../app/layouts/AppLayout.tsx");

    expect(source).toContain('minHeight: "100dvh"');
    expect(source).toContain("var(--sn-brand-gradient)");
    expect(source).toContain("var(--sn-border-soft)");
    expect(source).toContain("env(safe-area-inset-bottom");
    expect(source).not.toContain('border: "1px solid rgba(20, 33, 61, 0.08)"');
  });
});
