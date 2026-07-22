import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const recipeSectionSource = () =>
  readFileSync(resolve(process.cwd(), "src/features/meal/RecipeSection.tsx"), "utf8");

describe("recipe community contract", () => {
  it("publishes recipes through confirmed community cloud sync", () => {
    const source = recipeSectionSource();
    const publishBlock = source.slice(
      source.indexOf("const handlePublishRecipe"),
      source.indexOf("const allRecipes")
    );

    expect(publishBlock).toContain("publishCommunityPost");
    expect(publishBlock).toContain("runMealAction");
    expect(publishBlock).toContain("applyCommunityActionInCloud");
    expect(publishBlock).not.toContain("dispatch(\n      publishCommunityPost");
  });

  it("keeps recipe builder actions localized through recipe copy", () => {
    const source = recipeSectionSource();

    expect(source).toContain("addRecipeNow");
    expect(source).toContain("saveAsReusableRecipe");
    expect(source).toContain("builderTitle");
    expect(source).toContain("recipeNameLabel");
    expect(source).toContain("ingredientSearchLabel");
    expect(source).toContain("publishRecipe");
    expect(source).toContain("{copy.addRecipeNow}");
    expect(source).toContain("{copy.saveAsReusableRecipe}");
    expect(source).toContain("{copy.builderTitle}");
    expect(source).toContain("label={copy.recipeNameLabel}");
    expect(source).toContain("label={copy.ingredientSearchLabel}");
    expect(source).toContain("{copy.publishRecipe}");
    expect(source).not.toContain(">Add recipe now<");
    expect(source).not.toContain(">Save as reusable recipe<");
    expect(source).not.toContain(">Custom recipe builder<");
    expect(source).not.toContain('label="Recipe name"');
    expect(source).not.toContain('label="Search ingredient"');
    expect(source).not.toContain(">Publish recipe<");
  });
});
