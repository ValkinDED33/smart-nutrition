import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) =>
  readFile(resolve(process.cwd(), path), "utf8");

const USE_PROFILE_CLOUD_ACTION = "useProfileCloudAction";
const APPLY_PROFILE_ACTION_IN_CLOUD = "applyProfileActionInCloud";
const RUN_PROFILE_ACTION = "profileAction.runProfileAction";
const RUN_PROFILE_AND_USER_SAVE = "profileAction.runProfileAndUserSave";
const PROFILE_ACTION_HAS_ERROR = "profileAction.hasError";
const PROFILE_ACTION_SAVING = "profileAction.saving";
const PROFILE_ACTION_ERROR = "profileAction.error";
const SAVE_PROFILE_AND_USER_TO_CLOUD = "saveProfileAndUserToCloud";
const REPLACE_PROFILE_STATE = "replaceProfileState";
const RAW_ERROR_MESSAGE_TERNARY = "error instanceof Error ? error.message";
const PROFILE_CLOUD_COPY_OWNER = "getProfileCloudActionCopy";
const PROFILE_CLOUD_COPY_VARIABLE = "profileActionCopy";

describe("profile settings persistence contract", () => {
  it("exposes one shared cloud-backed action hook for profile setting saves", async () => {
    const source = await readSource("src/features/profile/useProfileCloudAction.ts");

    expect(source).toContain(APPLY_PROFILE_ACTION_IN_CLOUD);
    expect(source).toContain("setSaving(true)");
    expect(source).toContain("runProfileStateSave");
    expect(source).toContain("runProfileAndUserSave");
    expect(source).toContain("saveProfileStateToCloud");
    expect(source).toContain(SAVE_PROFILE_AND_USER_TO_CLOUD);
    expect(source).toContain(REPLACE_PROFILE_STATE);
    expect(source).toContain("setUser");
    expect(source).toContain("setError");
    expect(source).toContain("resolveProfileCloudActionErrorMessage");
    expect(source).toContain("copy.saveFailed");
    expect(source).toContain("copy.saveInProgress");
    expect(source).toContain("throw caughtError");
    expect(source).not.toContain("Profile changes could not be saved. Please try again.");
    expect(source).not.toContain(
      "Profile changes are already being saved. Please wait a moment."
    );
    expect(source).not.toContain("setError(message)");
    expect(source).not.toContain("setError(inProgressError.message)");
  });

  it("keeps localized profile cloud action copy outside the shared persistence hook", async () => {
    const source = await readSource(
      "src/features/profile/profileCloudActionCopy.ts"
    );

    expect(source).toContain("ProfileCloudActionCopy");
    expect(source).toContain(PROFILE_CLOUD_COPY_OWNER);
    expect(source).toContain("Не вдалося зберегти зміни профілю");
    expect(source).toContain("Nie udało się zapisać zmian profilu");
    expect(source).toContain("Profile changes could not be saved");
  });

  it("persists authenticated language changes through the profile cloud contract", async () => {
    const source = await readSource("src/app/layouts/AppLayout.tsx");

    expect(source).toContain(USE_PROFILE_CLOUD_ACTION);
    expect(source).toContain(PROFILE_CLOUD_COPY_OWNER);
    expect(source).toContain(PROFILE_CLOUD_COPY_VARIABLE);
    expect(source).toContain("runProfileAction(setProfileLanguage(nextLanguage))");
    expect(source).toContain("setLanguage(nextProfile.languagePreference)");
    expect(source).toContain("persisted: true");
    expect(source).toContain("disabled={languageProfileAction.saving}");
    expect(source).not.toContain(APPLY_PROFILE_ACTION_IN_CLOUD);
  });

  it("keeps notification preferences cloud-confirmed with visible failure state", async () => {
    const source = await readSource(
      "src/features/profile/NotificationSettingsCard.tsx"
    );

    expect(source).toContain(USE_PROFILE_CLOUD_ACTION);
    expect(source).toContain(PROFILE_CLOUD_COPY_OWNER);
    expect(source).toContain(PROFILE_CLOUD_COPY_VARIABLE);
    expect(source).toContain(RUN_PROFILE_ACTION);
    expect(source).toContain(PROFILE_ACTION_HAS_ERROR);
    expect(source).toContain(PROFILE_ACTION_SAVING);
    expect(source).toContain("copy.saveError");
    expect(source).not.toContain(APPLY_PROFILE_ACTION_IN_CLOUD);
  });

  it("keeps assistant customization settings on the shared cloud contract", async () => {
    const source = await readSource(
      "src/features/profile/AssistantCustomizationCard.tsx"
    );

    expect(source).toContain(USE_PROFILE_CLOUD_ACTION);
    expect(source).toContain(PROFILE_CLOUD_COPY_OWNER);
    expect(source).toContain(PROFILE_CLOUD_COPY_VARIABLE);
    expect(source).toContain(RUN_PROFILE_ACTION);
    expect(source).toContain(PROFILE_ACTION_HAS_ERROR);
    expect(source).toContain("disabled={profileAction.saving}");
    expect(source).toContain("catch(() => undefined)");
    expect(source).not.toContain(APPLY_PROFILE_ACTION_IN_CLOUD);
  });

  it("keeps adaptive goal changes cloud-confirmed with retry feedback", async () => {
    const source = await readSource("src/features/profile/AdaptiveGoalCard.tsx");

    expect(source).toContain(USE_PROFILE_CLOUD_ACTION);
    expect(source).toContain(PROFILE_CLOUD_COPY_OWNER);
    expect(source).toContain(PROFILE_CLOUD_COPY_VARIABLE);
    expect(source).toContain("runProfileAction");
    expect(source).toContain("setAdaptiveCalories");
    expect(source).toContain(PROFILE_ACTION_HAS_ERROR);
    expect(source).toContain("disabled={profileAction.saving}");
    expect(source).toContain("copy.automaticMode");
    expect(source).toContain("copy.manualMode");
    expect(source).toContain("Автоматичний режим");
    expect(source).toContain("Tryb ręczny");
    expect(source).not.toContain("Automatic mode keeps the target aligned");
    expect(source).not.toContain("Manual mode waits");
    expect(source).not.toContain(APPLY_PROFILE_ACTION_IN_CLOUD);
  });

  it("keeps motivation actions and reset on the shared profile persistence contract", async () => {
    const source = await readSource("src/features/profile/MotivationHubCard.tsx");

    expect(source).toContain(USE_PROFILE_CLOUD_ACTION);
    expect(source).toContain(PROFILE_CLOUD_COPY_OWNER);
    expect(source).toContain(PROFILE_CLOUD_COPY_VARIABLE);
    expect(source).toContain(RUN_PROFILE_ACTION);
    expect(source).toContain("profileAction.runProfileStateSave");
    expect(source).toContain(PROFILE_ACTION_HAS_ERROR);
    expect(source).toContain(PROFILE_ACTION_SAVING);
    expect(source).not.toContain(APPLY_PROFILE_ACTION_IN_CLOUD);
    expect(source).not.toContain("saveProfileStateToCloud");
    expect(source).not.toContain(REPLACE_PROFILE_STATE);
  });

  it("keeps progress photo add and remove on the shared profile persistence contract", async () => {
    const source = await readSource(
      "src/features/profile/BodyProgressPhotosCard.tsx"
    );

    expect(source).toContain(USE_PROFILE_CLOUD_ACTION);
    expect(source).toContain(PROFILE_CLOUD_COPY_OWNER);
    expect(source).toContain(PROFILE_CLOUD_COPY_VARIABLE);
    expect(source).toContain(RUN_PROFILE_ACTION);
    expect(source).toContain("addProgressPhoto");
    expect(source).toContain("removeProgressPhoto");
    expect(source).toContain(PROFILE_ACTION_HAS_ERROR);
    expect(source).toContain(PROFILE_ACTION_SAVING);
    expect(source).not.toContain(APPLY_PROFILE_ACTION_IN_CLOUD);
  });

  it("keeps the full profile form on the shared user/profile cloud save contract", async () => {
    const source = await readSource("src/features/profile/ProfileForm.tsx");

    expect(source).toContain(USE_PROFILE_CLOUD_ACTION);
    expect(source).toContain(PROFILE_CLOUD_COPY_OWNER);
    expect(source).toContain(PROFILE_CLOUD_COPY_VARIABLE);
    expect(source).toContain(RUN_PROFILE_AND_USER_SAVE);
    expect(source).toContain(PROFILE_ACTION_SAVING);
    expect(source).toContain(PROFILE_ACTION_ERROR);
    expect(source).not.toContain(RAW_ERROR_MESSAGE_TERNARY);
    expect(source).not.toContain(SAVE_PROFILE_AND_USER_TO_CLOUD);
    expect(source).not.toContain(REPLACE_PROFILE_STATE);
  });

  it("keeps measurement check-ins on the shared user/profile cloud save contract", async () => {
    const source = await readSource(
      "src/features/profile/MeasurementsCheckInCard.tsx"
    );

    expect(source).toContain(USE_PROFILE_CLOUD_ACTION);
    expect(source).toContain(PROFILE_CLOUD_COPY_OWNER);
    expect(source).toContain(PROFILE_CLOUD_COPY_VARIABLE);
    expect(source).toContain(RUN_PROFILE_AND_USER_SAVE);
    expect(source).toContain(PROFILE_ACTION_SAVING);
    expect(source).toContain(PROFILE_ACTION_ERROR);
    expect(source).not.toContain(RAW_ERROR_MESSAGE_TERNARY);
    expect(source).not.toContain(SAVE_PROFILE_AND_USER_TO_CLOUD);
    expect(source).not.toContain(REPLACE_PROFILE_STATE);
  });

  it("keeps quick weight check-ins on the shared user/profile cloud save contract", async () => {
    const source = await readSource(
      "src/features/profile/QuickWeightCheckInCard.tsx"
    );

    expect(source).toContain(USE_PROFILE_CLOUD_ACTION);
    expect(source).toContain(PROFILE_CLOUD_COPY_OWNER);
    expect(source).toContain(PROFILE_CLOUD_COPY_VARIABLE);
    expect(source).toContain(RUN_PROFILE_AND_USER_SAVE);
    expect(source).toContain(PROFILE_ACTION_SAVING);
    expect(source).toContain(PROFILE_ACTION_ERROR);
    expect(source).not.toContain(RAW_ERROR_MESSAGE_TERNARY);
    expect(source).not.toContain(SAVE_PROFILE_AND_USER_TO_CLOUD);
    expect(source).not.toContain(REPLACE_PROFILE_STATE);
  });

  it("keeps women-health baby preview on the shared profile state save contract", async () => {
    const source = await readSource(
      "src/features/profile/WomenHealthOverviewCard.tsx"
    );

    expect(source).toContain(USE_PROFILE_CLOUD_ACTION);
    expect(source).toContain(PROFILE_CLOUD_COPY_OWNER);
    expect(source).toContain(PROFILE_CLOUD_COPY_VARIABLE);
    expect(source).toContain("profileAction.runProfileStateSave(nextProfile)");
    expect(source).toContain("profileActionCopy.saveInProgress");
    expect(source).toContain("buildProfileStateAfterAction");
    expect(source).toContain("updateWomenHealth(womenHealthPatch)");
    expect(source).not.toContain("saveProfileStateToCloud");
    expect(source).not.toContain("replaceProfileState(nextProfile)");
  });

  it("keeps registration and verification profile bootstrap on the shared profile save contract", async () => {
    const registerSource = await readSource("src/pages/RegisterPage.tsx");
    const verifySource = await readSource("src/pages/VerifyEmailPage.tsx");

    expect(registerSource).toContain(USE_PROFILE_CLOUD_ACTION);
    expect(registerSource).toContain(PROFILE_CLOUD_COPY_OWNER);
    expect(registerSource).toContain("profileAction.runProfileStateSave(sessionProfile)");
    expect(registerSource).not.toContain("saveProfileStateToCloud");
    expect(registerSource).not.toContain("replaceProfileState(sessionProfile)");
    expect(verifySource).toContain(USE_PROFILE_CLOUD_ACTION);
    expect(verifySource).toContain(PROFILE_CLOUD_COPY_OWNER);
    expect(verifySource).toContain(
      "profileActionRef.current.runProfileStateSave(sessionProfile)"
    );
    expect(verifySource).not.toContain("saveProfileStateToCloud");
    expect(verifySource).not.toContain("replaceProfileState(sessionProfile)");
  });

  it("keeps onboarding finish on the shared user/profile cloud save contract", async () => {
    const source = await readSource("src/pages/onboarding/OnboardingFinishPage.tsx");

    expect(source).toContain(USE_PROFILE_CLOUD_ACTION);
    expect(source).toContain(PROFILE_CLOUD_COPY_OWNER);
    expect(source).toContain(
      "profileAction.runProfileAndUserSave(nextUser, nextProfile, completedAt)"
    );
    expect(source).not.toContain(SAVE_PROFILE_AND_USER_TO_CLOUD);
    expect(source).not.toContain(REPLACE_PROFILE_STATE);
  });

  it("localizes quick weight companion reward sync warnings after confirmed profile save", async () => {
    const source = await readSource(
      "src/features/profile/QuickWeightCheckInCard.tsx"
    );

    expect(source).toContain("rewardSyncWarning");
    expect(source).toContain("Вагу збережено");
    expect(source).toContain("Waga została zapisana");
    expect(source).toContain("Weight was saved");
    expect(source).toContain("прогрес помічника");
    expect(source).toContain("postęp asystenta");
    expect(source).not.toContain("rewardError instanceof Error");
    expect(source).not.toContain("${copy.rewardSyncWarning} ${rewardError.message}");
    expect(source).not.toContain("Weight saved, but companion progress could not sync");
    expect(source).not.toContain("прогрес companion");
    expect(source).not.toContain("postęp companion");
  });
});
