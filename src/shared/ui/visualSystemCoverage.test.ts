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
    ]);

    for (const source of sources) {
      expect(source).toContain("sn-premium-panel");
    }

    expect(sources.join("\n")).not.toContain("rgba(248,250,252,0.86)");
    expect(sources.join("\n")).not.toContain("rgba(255,255,255,0.94)");
  });
});
