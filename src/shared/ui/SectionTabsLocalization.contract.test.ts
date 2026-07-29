import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");
const COPY_SECTIONS_ARIA_LABEL = "ariaLabel={copy.sectionsAriaLabel}";

describe("SectionTabs localization contract", () => {
  it("keeps product section tab labels in the active language", async () => {
    const [
      homeSource,
      mealSource,
      recipesSource,
      profileSource,
      profileTabsSource,
      librarySource,
      shelfSource,
      sharedLanguageSource,
      sharedEnglishSource,
    ] = await Promise.all([
      readSource("src/pages/HomePage.tsx"),
      readSource("src/pages/MealBuilderPage.tsx"),
      readSource("src/pages/RecipesPage.tsx"),
      readSource("src/pages/ProfilePage.tsx"),
      readSource("src/features/profile/ProfileSectionTabs.tsx"),
      readSource("src/features/meal/NutritionLibraryPanel.tsx"),
      readSource("src/features/meal/QuickProductShelf.tsx"),
      readSource("src/shared/language/index.tsx"),
      readSource("src/shared/i18n/en.ts"),
    ]);

    expect(homeSource).toContain(COPY_SECTIONS_ARIA_LABEL);
    expect(mealSource).toContain(COPY_SECTIONS_ARIA_LABEL);
    expect(mealSource).toContain("ariaLabel={copy.addToolsAriaLabel}");
    expect(recipesSource).toContain("ariaLabel={sections.sectionsAriaLabel}");
    expect(profileSource).toContain(COPY_SECTIONS_ARIA_LABEL);
    expect(profileTabsSource).toContain("ariaLabel={ariaLabel}");
    expect(librarySource).toContain("ariaLabel={labels.sectionsAriaLabel}");
    expect(shelfSource).toContain('ariaLabel={t("quickShelf.sectionsAriaLabel")}');
    expect(sharedLanguageSource).toContain("Розділи швидких продуктів");
    expect(sharedLanguageSource).toContain("Sekcje szybkich produktów");
    expect(sharedEnglishSource).toContain("Quick product sections");

    const localizedSources = [
      homeSource,
      mealSource,
      recipesSource,
      profileSource,
      profileTabsSource,
      librarySource,
      shelfSource,
    ].join("\n");

    expect(localizedSources).not.toContain('ariaLabel="Dashboard sections"');
    expect(localizedSources).not.toContain('ariaLabel="Meal sections"');
    expect(localizedSources).not.toContain('ariaLabel="Meal add tools"');
    expect(localizedSources).not.toContain('ariaLabel="Recipe page sections"');
    expect(localizedSources).not.toContain('ariaLabel="Profile sections"');
    expect(localizedSources).not.toContain('ariaLabel="Nutrition library sections"');
    expect(localizedSources).not.toContain('ariaLabel="Quick product shelf sections"');
  });
});
