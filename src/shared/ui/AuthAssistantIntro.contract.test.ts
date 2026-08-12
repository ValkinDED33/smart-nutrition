import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

const readSource = (path: string) => readFile(path, "utf8");

const authEntryPaths = [
  "src/pages/RegisterPage.tsx",
  "src/pages/ForgotPasswordPage.tsx",
  "src/pages/ResetPasswordPage.tsx",
  "src/pages/onboarding/OnboardingChoicePage.tsx",
] as const;

describe("auth assistant worker intro contract", () => {
  it("keeps auth and onboarding entry screens on the canonical assistant intro", async () => {
    const sources = await Promise.all(authEntryPaths.map((path) => readSource(path)));

    for (const source of sources) {
      expect(source).toContain("AuthAssistantIntro");
      expect(source).not.toContain('name="Assistant"');
      expect(source).not.toContain('variant="robot"');
    }
  });

  it("presents the auth assistant as the Smart Nutrition worker, not a static mascot", async () => {
    const source = await readSource("src/shared/ui/AuthAssistantIntro.tsx");

    expect(source).toContain('data-auth-ai-worker-intro="true"');
    expect(source).toContain('data-auth-ai-worker-badge="true"');
    expect(source).toContain('data-auth-ai-worker-capabilities="true"');
    expect(source).toContain("Smart Nutrition AI");
    expect(source).toContain("AI-працівник");
    expect(source).toContain("Pracownik AI");
    expect(source).toContain("AI worker");
    expect(source).toContain("Email");
    expect(source).toContain("Security");
    expect(source).toContain("Profile");
  });
});
