import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");

describe("auth and community visible error copy contract", () => {
  it("keeps reset and forgot password errors localized instead of rendering raw API text", async () => {
    const resetSource = await readSource("src/pages/ResetPasswordPage.tsx");
    const forgotSource = await readSource("src/pages/ForgotPasswordPage.tsx");

    expect(resetSource).toContain("AUTH_INVALID_RESET_TOKEN_KEY");
    expect(resetSource).toContain('t("auth.weakResetPassword")');
    expect(resetSource).not.toContain("setServerError(error.message)");
    expect(forgotSource).toContain('t("auth.forgotGenericError")');
    expect(forgotSource).not.toContain(": error.message");
  });

  it("keeps community action failures in product-language retry copy", async () => {
    const source = await readSource("src/features/community/CommunityHubCard.tsx");

    expect(source).toContain("saveFailed");
    expect(source).toContain("message: copy.saveFailed");
    expect(source).toContain("Оновлення стрічки");
    expect(source).toContain("synchronizacji w chmurze");
    expect(source).toContain("The feed update may appear after the next cloud sync.");
    expect(source).not.toContain("локальний статус community");
    expect(source).not.toContain("lokalny status community");
    expect(source).not.toContain("local community status");
    expect(source).not.toContain("getCommunityErrorMessage");
    expect(source).not.toContain("error instanceof Error && error.message");
    expect(source).not.toContain("Could not save community changes. Please try again.");
  });

  it("keeps regular community actions localized instead of leaking English controls", async () => {
    const source = await readSource("src/features/community/CommunityHubCard.tsx");

    expect(source).toContain('title: "Спільнота Smart Nutrition"');
    expect(source).toContain('title: "Społeczność Smart Nutrition"');
    expect(source).toContain('like: "Підтримати"');
    expect(source).toContain('save: "Зберегти"');
    expect(source).toContain('unsave: "Прибрати"');
    expect(source).toContain('like: "Wesprzyj"');
    expect(source).toContain('save: "Zapisz"');
    expect(source).toContain('unsave: "Usuń zapis"');
  });
});
