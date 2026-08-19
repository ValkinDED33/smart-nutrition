import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");
const ONBOARDING_PAGE_PATH = "src/pages/OnboardingPage.tsx";

describe("Onboarding flow contract", () => {
  it("does not ask authenticated users to choose language again at onboarding root", async () => {
    const source = await readSource(ONBOARDING_PAGE_PATH);
    const appSource = await readSource("src/App.tsx");

    expect(source).toContain(
      '<Route index element={<Navigate to={stepPaths.choice} replace />} />'
    );
    expect(source).toContain(
      '<Route path="*" element={<Navigate to={stepPaths.choice} replace />} />'
    );
    expect(source).not.toContain(
      '<Route path="*" element={<Navigate to={stepPaths.assistant} replace />} />'
    );
    expect(source).toContain('path="welcome" element={<OnboardingWelcomePage />}');
    expect(appSource).toContain('const ONBOARDING_ENTRY_PATH = "/onboarding/choice"');
    expect(appSource).toContain("to={ONBOARDING_ENTRY_PATH}");
  });

  it("preserves unfinished female onboarding draft over default registration user values", async () => {
    const source = await readSource(ONBOARDING_PAGE_PATH);

    expect(source).toContain("? draft.gender");
    expect(source).toContain("? \"female\"");
    expect(source).toContain(": user?.gender ?? \"male\"");
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

  it("restores saved women health context before creating a new local draft", async () => {
    const source = await readSource(ONBOARDING_PAGE_PATH);

    expect(source).toContain("hasWomenHealthContext(profile.womenHealth)");
    expect(source).toContain("shouldUseProfileWomenHealth");
    expect(source).toContain('shouldUseProfileWomenHealth\n              ? "female"');
    expect(source).toContain("profile.womenHealth.mode");
    expect(source).toContain("profile.womenHealth.pregnancyWeek");
    expect(source).toContain("profile.womenHealth.pregnancyDay");
    expect(source).toContain("profile.womenHealth.notes");
    expect(source).toContain("hasEditedOnboardingRef.current");
    expect(source).toContain("!hasEditedOnboardingRef.current && !hasPreAuthOnboardingDraft()");
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
    expect(womenHealthSource).toContain("data-onboarding-pregnancy-estimate");
    expect(womenHealthSource).toContain("data-onboarding-pregnancy-age-summary");
    expect(womenHealthSource).toContain("getPregnancyTrimester");
    expect(womenHealthSource).toContain("getPregnancyMonth");
    expect(womenHealthSource).toContain("День тижня (0-6)");
    expect(womenHealthSource).toContain("Триместр");
    expect(womenHealthSource).toContain("Місяць");
    expect(womenHealthSource).toContain("До пологів");
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

  it("lets users finish after core profile or continue into optional personalization without completing onboarding", async () => {
    const goalSource = await readSource("src/pages/onboarding/OnboardingGoalPage.tsx");
    const motivationSource = await readSource(
      "src/pages/onboarding/OnboardingMotivationPage.tsx"
    );
    const finishSource = await readSource("src/pages/onboarding/OnboardingFinishPage.tsx");

    expect(goalSource).toContain("navigate(stepPaths.finish)");
    expect(finishSource).toContain("const continuePersonalization = () =>");
    expect(finishSource).toContain("navigate(stepPaths.friction)");
    expect(finishSource).not.toContain('saveOnboarding("/profile")');
    expect(motivationSource).toContain("personalizationCompleted: true");
    expect(motivationSource).toContain("navigate(stepPaths.finish)");
  });

  it("keeps the animated onboarding assistant out of active form fields", async () => {
    const guideSource = await readSource("src/pages/onboarding/OnboardingGuide.tsx");

    expect(guideSource).toContain("useHideGuideWhileFieldFocused");
    expect(guideSource).toContain("document.addEventListener(\"focusin\", onFocusIn)");
    expect(guideSource).toContain("data-onboarding-guide-hidden-while-field-focused");
    expect(guideSource).toContain("if (fieldFocused)");
    expect(guideSource).toContain("womenHealth:");
    expect(guideSource).toContain('"/onboarding/women-health"');
    expect(guideSource).toContain('key: "womenHealth"');
    expect(guideSource).toContain("const GUIDE_WIDE_VIEWPORT_MIN_WIDTH = 2560");
    expect(guideSource).toContain('const GUIDE_FORM_SAFE_LEFT = "calc(50% + 460px)"');
    expect(guideSource).toContain("const GUIDE_BUBBLE_WIDTH = 220");
    expect(guideSource).toContain("const GUIDE_AVATAR_SIZE = 76");
    expect(guideSource).toContain('display: { xs: "none", xl: "block" }');
    expect(guideSource).toContain(
      "maxWidth: GUIDE_BUBBLE_WIDTH + GUIDE_AVATAR_SIZE + 24"
    );
    expect(guideSource).toContain(
      "[`@media (max-width: ${GUIDE_WIDE_VIEWPORT_MIN_WIDTH - 1}px)`]"
    );
    expect(guideSource).toContain('data-onboarding-guide-requires-wide-viewport="true"');
    expect(guideSource).toContain('direction="row"');
  });

  it("keeps localized assistant copy native and free from mixed-language companion jargon", async () => {
    const guideSource = await readSource("src/pages/onboarding/OnboardingGuide.tsx");

    expect(guideSource).toContain(
      'assistant: "Обери, яким я буду. Це твій постійний помічник."'
    );
    expect(guideSource).toContain(
      'assistant: "Wybierz, jaki mam być. To Twój stały asystent."'
    );
    expect(guideSource).not.toMatch(/uk:\s*{[\s\S]*companion[\s\S]*},\r?\n\s*pl:/);
    expect(guideSource).not.toMatch(/pl:\s*{[\s\S]*companion[\s\S]*},\r?\n\s*en:/);
  });
});
