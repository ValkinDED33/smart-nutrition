import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

const readSource = (path: string) => readFile(path, "utf8");
const REGISTER_PAGE_PATH = "src/pages/RegisterPage.tsx";
const ONBOARDING_PAGE_PATH = "src/pages/OnboardingPage.tsx";
const ONBOARDING_FINISH_PAGE_PATH = "src/pages/onboarding/OnboardingFinishPage.tsx";

describe("onboarding and profile flow contract", () => {
  it("keeps registration as a guided language-theme-account sequence with backend availability checks", async () => {
    const registerSource = await readSource(REGISTER_PAGE_PATH);

    expect(registerSource).toContain('"language"');
    expect(registerSource).toContain('"theme"');
    expect(registerSource).toContain('"name"');
    expect(registerSource).toContain('"email"');
    expect(registerSource).toContain('"password"');
    expect(registerSource).toContain("confirmPasswordField");
    expect(registerSource).not.toContain('| "confirm"');
    expect(registerSource).not.toContain('case "confirm"');
    expect(registerSource).not.toContain('registrationStep === "confirm"');
    expect(registerSource).toContain("useAppColorMode");
    expect(registerSource).toContain("checkRegistrationAvailability");
    expect(registerSource).toContain('displayedNameAvailability !== "available"');
    expect(registerSource).toContain('displayedEmailAvailability !== "available"');
    expect(registerSource).toContain("availabilityBlocksNext");
    expect(registerSource).toContain("availabilityBlocksSubmit");
    expect(registerSource).toContain("disabled={availabilityBlocksNext}");
    expect(registerSource).toContain("disabled={submitting || availabilityBlocksSubmit}");
    expect(registerSource).toContain('setRegistrationStep("name")');
    expect(registerSource).toContain('setRegistrationStep("email")');
    expect(registerSource).toContain("portalTitle");
    expect(registerSource).toContain("registrationProgress");
    expect(registerSource).toContain("This is not a calorie calculator");
    expect(registerSource).toContain("languagePreference: appLanguage");
    expect(registerSource).toContain("useProfileCloudAction");
    expect(registerSource).toContain("getProfileCloudActionCopy");
    expect(registerSource).toContain("profileAction.runProfileStateSave(sessionProfile)");
    expect(registerSource).not.toContain("saveProfileStateToCloud");
    expect(registerSource).not.toContain("replaceProfileState(sessionProfile)");
    expect(registerSource).toContain('navigate("/onboarding/choice")');
  });

  it("keeps password confirmation inside the same human password step", async () => {
    const registerSource = await readSource(REGISTER_PAGE_PATH);

    expect(registerSource).toContain("shouldShowConfirmPasswordError");
    expect(registerSource).toContain("dirtyFields.confirmPassword");
    expect(registerSource).toContain("touchedFields.confirmPassword");
    expect(registerSource).toContain("submitCount > 0");
    expect(registerSource).toContain('registrationStep === "password" ?');
    expect(registerSource).toContain("{...passwordField}");
    expect(registerSource).toContain("{...confirmPasswordField}");
    expect(registerSource).toContain("PasswordVisibilityButton");
    expect(registerSource).toContain("error={shouldShowConfirmPasswordError}");
    expect(registerSource).not.toContain('| "confirm"');
    expect(registerSource).not.toContain('registrationStep === "confirm"');
  });

  it("lets users open their mailbox after a backend-confirmed verification email", async () => {
    const registerSource = await readSource(REGISTER_PAGE_PATH);
    const ukI18nSource = await readSource("src/shared/i18n/uk.ts");
    const plI18nSource = await readSource("src/shared/i18n/pl.ts");
    const enI18nSource = await readSource("src/shared/i18n/en.ts");

    expect(registerSource).toContain("getEmailInboxUrl(pendingVerification.email)");
    expect(registerSource).toContain('data-register-verification-panel="true"');
    expect(registerSource).toContain('data-register-delivery-failure-panel="true"');
    expect(registerSource).toContain('data-register-account-form="true"');
    expect(registerSource).toContain("const showRegistrationForm = !pendingVerification && !deliveryUnavailableEmail");
    expect(registerSource).toContain("{showRegistrationForm && (");
    expect(registerSource).toContain("setDeliveryUnavailableEmail(data.email)");
    expect(registerSource).toContain("void handleSubmit(onSubmit)();");
    expect(registerSource).toContain("pendingVerification ? (");
    expect(registerSource).toContain('href={verificationInboxUrl}');
    expect(registerSource).toContain('target="_blank"');
    expect(registerSource).toContain('t("auth.openMailbox")');
    expect(ukI18nSource).toContain('"auth.openMailbox": "Перейти в пошту"');
    expect(plI18nSource).toContain('"auth.openMailbox": "Przejdź do poczty"');
    expect(enI18nSource).toContain('"auth.openMailbox": "Open mailbox"');
  });

  it("routes confirmed users to an explicit onboarding choice before the questionnaire", async () => {
    const verifyEmailSource = await readSource("src/pages/VerifyEmailPage.tsx");
    const onboardingSource = await readSource(ONBOARDING_PAGE_PATH);
    const choiceSource = await readSource("src/pages/onboarding/OnboardingChoicePage.tsx");

    expect(verifyEmailSource).toContain('"/onboarding/choice"');
    expect(verifyEmailSource).toContain("useProfileCloudAction");
    expect(verifyEmailSource).toContain("getProfileCloudActionCopy");
    expect(verifyEmailSource).toContain(
      "profileActionRef.current.runProfileStateSave(sessionProfile)"
    );
    expect(verifyEmailSource).not.toContain("saveProfileStateToCloud");
    expect(verifyEmailSource).not.toContain("replaceProfileState(sessionProfile)");
    expect(onboardingSource).toContain('path="choice"');
    expect(onboardingSource).toContain("OnboardingChoicePage");
    expect(choiceSource).toContain("navigate(stepPaths.gender)");
    expect(choiceSource).toContain('navigate("/dashboard", { replace: true })');
    expect(choiceSource).toContain("AssistantAvatar");
    expect(choiceSource).toContain("Calories without manual math");
  });

  it("keeps finish-now and continue-personalization as separate onboarding intents", async () => {
    const goalSource = await readSource("src/pages/onboarding/OnboardingGoalPage.tsx");
    const motivationSource = await readSource(
      "src/pages/onboarding/OnboardingMotivationPage.tsx"
    );
    const finishSource = await readSource(ONBOARDING_FINISH_PAGE_PATH);
    const draftSource = await readSource(
      "src/features/onboarding/model/onboardingDraft.ts"
    );

    expect(goalSource).toContain("navigate(stepPaths.finish)");
    expect(motivationSource).toContain("personalizationCompleted: true");
    expect(finishSource).toContain("const canContinuePersonalization = !state.personalizationCompleted");
    expect(finishSource).toContain("const continuePersonalization = () =>");
    expect(finishSource).toContain("navigate(stepPaths.friction)");
    expect(finishSource).toContain('data-onboarding-continue-personalization="true"');
    expect(finishSource).not.toContain('saveOnboarding("/profile")');
    expect(finishSource).not.toContain('navigate("/profile"');
    expect(draftSource).toContain("personalizationCompleted: boolean");
  });

  it("keeps the post-confirmation questionnaire order user-friendly", async () => {
    const onboardingSource = await readSource(ONBOARDING_PAGE_PATH);
    const assistantSource = await readSource("src/pages/onboarding/OnboardingAssistantPage.tsx");
    const onboardingI18nSource = await readSource("src/shared/i18n/onboarding.ts");
    const genderSource = await readSource("src/pages/onboarding/OnboardingGenderPage.tsx");
    const nameSource = await readSource("src/pages/onboarding/OnboardingNamePage.tsx");
    const ageSource = await readSource("src/pages/onboarding/OnboardingAgePage.tsx");
    const womenHealthSource = await readSource("src/pages/onboarding/OnboardingWomenHealthPage.tsx");

    expect(onboardingSource).not.toContain("DEFAULT_ASSISTANT_NAME");
    expect(assistantSource).toContain("getAssistantPreviewName");
    expect(assistantSource).not.toContain("disabled={state.assistantName.trim()");
    expect(assistantSource).not.toContain('placeholder={"Alex"');
    expect(onboardingI18nSource).toContain("Можна залишити порожнім");
    expect(genderSource).toContain(
      'navigate(state.gender === "female" ? stepPaths.womenHealth : stepPaths.name)'
    );
    expect(womenHealthSource).toContain("onClick={() => navigate(stepPaths.name)}");
    expect(nameSource).toContain("navigate(stepPaths.age)");
    expect(ageSource).toContain("stepPaths.height");
    expect(ageSource).not.toContain("stepPaths.womenHealth : stepPaths.height");
    expect(womenHealthSource).toContain('data-onboarding-pregnancy-block="true"');
    expect(womenHealthSource).toContain('data-onboarding-family-preview-block="true"');
    expect(womenHealthSource).toContain("pregnancyBlockTitle");
    expect(womenHealthSource).toContain("pregnancyPrivate");
    expect(womenHealthSource).toContain("familyPreviewSafety");
    expect(womenHealthSource).toContain("motherEyeColor");
    expect(womenHealthSource).toContain("fatherChineseZodiac");
    expect(womenHealthSource).toContain("state.womenHealthMode === \"pregnant\"");
  });

  it("saves family preview onboarding data into the canonical profile contract", async () => {
    const onboardingSource = await readSource("src/pages/OnboardingPage.tsx");
    const finishSource = await readSource(ONBOARDING_FINISH_PAGE_PATH);

    expect(onboardingSource).toContain("motherEyeColor");
    expect(onboardingSource).toContain("partnerEyeColor");
    expect(onboardingSource).toContain("motherChineseZodiac");
    expect(finishSource).toContain("updatePersonalDetails");
    expect(finishSource).toContain("useProfileCloudAction");
    expect(finishSource).toContain("getProfileCloudActionCopy");
    expect(finishSource).toContain("const applyOnboardingProfilePatch =");
    expect(finishSource).toContain(
      "profileAction.runProfileAndUserSave("
    );
    expect(finishSource).toContain("applyOnboardingProfilePatch");
    expect(finishSource).not.toContain("saveProfileAndUserToCloud");
    expect(finishSource).not.toContain("replaceProfileState(nextProfile)");
    expect(finishSource).toContain("eyeColor:");
    expect(finishSource).toContain("partnerEyeColor: state.partnerEyeColor");
    expect(finishSource).toContain("motherZodiac: state.motherZodiac");
    expect(finishSource).toContain("fatherChineseZodiac: state.fatherChineseZodiac");
  });

  it("keeps onboarding finish sync failures in product-language recovery copy", async () => {
    const finishSource = await readSource(ONBOARDING_FINISH_PAGE_PATH);

    expect(finishSource).toContain('const message = t("error.genericProfile")');
    expect(finishSource).toContain("writePreAuthOnboardingDraft");
    expect(finishSource).toContain("preserveDraft();");
    expect(finishSource).toContain('data-onboarding-save-recovery="true"');
    expect(finishSource).toContain('t("onboarding.retrySave")');
    expect(finishSource).toContain('t("onboarding.backToAnswers")');
    expect(finishSource).toContain("enqueueSyncOutbox(message)");
    expect(finishSource).toContain("markSyncError(message)");
    expect(finishSource).not.toContain("error instanceof Error");
    expect(finishSource).not.toContain("error.message");
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
