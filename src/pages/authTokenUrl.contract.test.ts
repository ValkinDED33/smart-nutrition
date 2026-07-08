import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("auth token URL contracts", () => {
  it("keeps reset-password token in runtime state before cleaning the URL", () => {
    const source = readSource("src/pages/ResetPasswordPage.tsx");

    expect(source).toContain(
      'const [token] = useState(() => searchParams.get("token")?.trim() ?? "");'
    );
    expect(source).toContain('clearSensitiveSearchParamsFromCurrentUrl(["token"]);');
    expect(source).toContain("await resetPassword(token, data.password);");
  });

  it("keeps verify-email token in runtime state before cleaning the URL", () => {
    const source = readSource("src/pages/VerifyEmailPage.tsx");

    expect(source).toContain(
      'const [token] = useState(() => searchParams.get("token")?.trim() ?? "");'
    );
    expect(source).toContain('clearSensitiveSearchParamsFromCurrentUrl(["token"]);');
    expect(source).toContain("await verifyRegistration({ token });");
  });
});
