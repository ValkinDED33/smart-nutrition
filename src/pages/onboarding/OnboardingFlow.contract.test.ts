import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");

describe("Onboarding flow contract", () => {
  it("does not ask authenticated users to choose language again at onboarding root", async () => {
    const source = await readSource("src/pages/OnboardingPage.tsx");

    expect(source).toContain(
      '<Route index element={<Navigate to={stepPaths.choice} replace />} />'
    );
    expect(source).toContain('path="welcome" element={<OnboardingWelcomePage />}');
  });

  it("preserves unfinished female onboarding draft over default registration user values", async () => {
    const source = await readSource("src/pages/OnboardingPage.tsx");

    expect(source).toContain(
      '!onboardingCompleted && hasDraft ? draft.gender : user?.gender ?? "male"'
    );
    expect(source).toContain(
      "!onboardingCompleted && hasDraft ? draft.age : user?.age ?? 25"
    );
    expect(source).toContain(
      "!onboardingCompleted && hasDraft ? draft.height : user?.height ?? 175"
    );
    expect(source).toContain(
      "? draft.weight"
    );
    expect(source).toContain(
      "? draft.goal"
    );
  });
});
