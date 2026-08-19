import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("RegisterPage contract", () => {
  it("keeps password confirmation on the password step without early mismatch errors", () => {
    const source = readSource("src/pages/RegisterPage.tsx");

    expect(source).toContain('type RegistrationStep =');
    expect(source).toContain('"password"');
    expect(source).toContain("confirmPasswordField");
    expect(source).not.toContain('| "confirm"');
    expect(source).not.toContain('case "confirm"');
    expect(source).not.toContain('registrationStep === "confirm"');
    expect(source).toContain("const shouldShowConfirmPasswordError");
    expect(source).toContain("Boolean(dirtyFields.confirmPassword)");
    expect(source).toContain("Boolean(touchedFields.confirmPassword)");
    expect(source).toContain("submitCount > 0");
    expect(source).toContain("error={shouldShowConfirmPasswordError}");
  });

  it("keeps the UI password policy aligned with the backend contract", () => {
    const registerSource = readSource("src/pages/RegisterPage.tsx");
    const resetSource = readSource("src/pages/ResetPasswordPage.tsx");
    const domainSource = readSource("server/lib/domain.mjs");

    for (const source of [registerSource, resetSource]) {
      expect(source).toContain('.min(8, t("validation.passwordMin"))');
      expect(source).toContain('.max(10, t("validation.passwordMax"))');
      expect(source).toContain('.regex(/[A-Z]/, t("validation.passwordUpper"))');
      expect(source).toContain('.regex(/\\d/, t("validation.passwordDigit"))');
      expect(source).not.toContain('t("validation.passwordSymbol")');
      expect(source).not.toContain('t("validation.passwordLower")');
    }

    expect(domainSource).toContain("(?=.*[A-Z])(?=.*\\d).{8,10}");
    expect(domainSource).toContain("Password must be 8 to 10 characters");
  });
});
