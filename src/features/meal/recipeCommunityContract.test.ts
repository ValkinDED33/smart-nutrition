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
});
