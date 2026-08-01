import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");

describe("ProfilePage contract", () => {
  it("keeps visible role labels localized instead of exposing internal role enums", async () => {
    const source = await readSource("src/pages/ProfilePage.tsx");
    const localizedRoleCopy = source.slice(
      source.indexOf("const roleLabels = {"),
      source.indexOf("  en: {")
    );

    expect(source).toContain('USER: "Користувач"');
    expect(source).toContain('VERIFIED_USER: "Підтверджений користувач"');
    expect(source).toContain('ADMIN: "Адміністратор"');
    expect(source).toContain('USER: "Użytkownik"');
    expect(source).toContain('VERIFIED_USER: "Potwierdzony użytkownik"');
    expect(source).toContain('ADMIN: "Administrator"');
    expect(source).toContain("getRoleLabel(appLanguage, user.role)");
    expect(localizedRoleCopy).not.toContain("USER_ROLE_LABEL");
    expect(localizedRoleCopy).not.toContain("VERIFIED_USER_ROLE_LABEL");
    expect(localizedRoleCopy).not.toContain("OWNER_ROLE_LABEL");
  });

  it("keeps women health as a visible profile section for female accounts", async () => {
    const source = await readSource("src/pages/ProfilePage.tsx");

    expect(source).toContain("const canSeeWomenHealthSection");
    expect(source).toContain("isWomenHealthVisibleForGender(user.gender)");
    expect(source).toContain("hasWomenHealthContext(profile.womenHealth)");
    expect(source).toContain('id: "women-health"');
    expect(source).toContain("label: copy.tabs.womenHealth");
    expect(source).toContain("<WomenHealthOverviewCard />");
  });
});
