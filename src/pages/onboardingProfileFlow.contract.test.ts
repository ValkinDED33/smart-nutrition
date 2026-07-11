import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

const readSource = (path: string) => readFile(path, "utf8");

describe("onboarding and profile flow contract", () => {
  it("keeps registration as a guided language-theme-account sequence with backend availability checks", async () => {
    const registerSource = await readSource("src/pages/RegisterPage.tsx");

    expect(registerSource).toContain('"language"');
    expect(registerSource).toContain('"theme"');
    expect(registerSource).toContain('"name"');
    expect(registerSource).toContain('"email"');
    expect(registerSource).toContain('"password"');
    expect(registerSource).toContain('"confirm"');
    expect(registerSource).toContain("useAppColorMode");
    expect(registerSource).toContain("checkRegistrationAvailability");
    expect(registerSource).toContain('displayedNameAvailability !== "available"');
    expect(registerSource).toContain('displayedEmailAvailability !== "available"');
  });

  it("routes confirmed users to an explicit onboarding choice before the questionnaire", async () => {
    const verifyEmailSource = await readSource("src/pages/VerifyEmailPage.tsx");
    const onboardingSource = await readSource("src/pages/OnboardingPage.tsx");
    const choiceSource = await readSource("src/pages/onboarding/OnboardingChoicePage.tsx");

    expect(verifyEmailSource).toContain('"/onboarding/choice"');
    expect(onboardingSource).toContain('path="choice"');
    expect(onboardingSource).toContain("OnboardingChoicePage");
    expect(choiceSource).toContain("navigate(stepPaths.gender)");
    expect(choiceSource).toContain('navigate("/dashboard", { replace: true })');
  });

  it("keeps the post-confirmation questionnaire order user-friendly", async () => {
    const genderSource = await readSource("src/pages/onboarding/OnboardingGenderPage.tsx");
    const nameSource = await readSource("src/pages/onboarding/OnboardingNamePage.tsx");
    const ageSource = await readSource("src/pages/onboarding/OnboardingAgePage.tsx");

    expect(genderSource).toContain("navigate(stepPaths.name)");
    expect(nameSource).toContain("navigate(stepPaths.age)");
    expect(ageSource).toContain("stepPaths.womenHealth");
    expect(ageSource).toContain("stepPaths.height");
  });

  it("keeps profile editing behind an explicit edit action and gates admin details", async () => {
    const profileSource = await readSource("src/pages/ProfilePage.tsx");

    expect(profileSource).toContain("profileEditorOpen && <ProfileForm />");
    expect(profileSource).toContain("setProfileEditorOpen");
    expect(profileSource).toContain("canAccessAdminCenter(user.role)");
    expect(profileSource).toContain("canSeeOperationalDetails && <AdminCenterCard />");
    expect(profileSource).toContain("canSeeOperationalDetails && <CloudSyncStatusCard />");
  });
});
