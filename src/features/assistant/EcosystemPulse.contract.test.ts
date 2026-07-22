import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");

describe("EcosystemPulse contract", () => {
  it("keeps the project-wide magic layer read-only and connected to canonical state", async () => {
    const source = await readSource("src/features/assistant/EcosystemPulse.tsx");

    expect(source).toContain("selectTodayMealItems");
    expect(source).toContain("state.water");
    expect(source).toContain("state.companion");
    expect(source).toContain("state.profile.assistant");
    expect(source).not.toContain("companionProgressCardModel");
    expect(source).not.toContain("dispatch(");
    expect(source).not.toContain("localStorage");
  });

  it("keeps localized assistant pulse copy free from mixed companion jargon", async () => {
    const source = await readSource("src/features/assistant/EcosystemPulse.tsx");

    expect(source).toContain("зв'язок з помічником");
    expect(source).toContain("więź z asystentem");
    expect(source).not.toContain("зв'язок з companion");
    expect(source).not.toContain("więź z companion");
  });

  it("surfaces the ecosystem pulse on key product areas", async () => {
    const pages = [
      "src/pages/MealBuilderPage.tsx",
      "src/pages/ProgressPage.tsx",
      "src/pages/ProfilePage.tsx",
      "src/pages/AiCompanionPage.tsx",
      "src/pages/CommunityPage.tsx",
      "src/pages/RecipesPage.tsx",
    ];

    await Promise.all(
      pages.map(async (path) => {
        const source = await readSource(path);

        expect(source).toContain("EcosystemPulse");
        expect(source).toContain("assistantHint=");
      })
    );
  });

  it("keeps the retired water route redirected to the canonical progress surface", async () => {
    const source = await readSource("src/App.tsx");

    expect(source).toContain('path="/water"');
    expect(source).toContain('to="/progress"');
  });
});
