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

  it("routes female onboarding through women health before the ordinary profile fields", async () => {
    const genderSource = await readSource("src/pages/onboarding/OnboardingGenderPage.tsx");
    const womenHealthSource = await readSource(
      "src/pages/onboarding/OnboardingWomenHealthPage.tsx"
    );
    const nameSource = await readSource("src/pages/onboarding/OnboardingNamePage.tsx");
    const ageSource = await readSource("src/pages/onboarding/OnboardingAgePage.tsx");
    const heightSource = await readSource("src/pages/onboarding/OnboardingHeightPage.tsx");

    expect(genderSource).toContain(
      'navigate(state.gender === "female" ? stepPaths.womenHealth : stepPaths.name)'
    );
    expect(womenHealthSource).toContain("data-onboarding-pregnancy-block");
    expect(womenHealthSource).toContain("data-onboarding-family-preview-block");
    expect(womenHealthSource).toContain("onClick={() => navigate(stepPaths.name)}");
    expect(nameSource).toContain(
      'navigate(state.gender === "female" ? stepPaths.womenHealth : stepPaths.gender)'
    );
    expect(ageSource).toContain("navigate(stepPaths.height)");
    expect(ageSource).not.toContain("stepPaths.womenHealth : stepPaths.height");
    expect(heightSource).toContain("onClick={() => navigate(stepPaths.age)}");
    expect(heightSource).not.toContain("stepPaths.womenHealth : stepPaths.age");
  });
});
