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
});
