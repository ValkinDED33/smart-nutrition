import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) =>
  readFile(resolve(process.cwd(), path), "utf8");

describe("profile settings persistence contract", () => {
  it("exposes one shared cloud-backed action hook for profile setting saves", async () => {
    const source = await readSource("src/features/profile/useProfileCloudAction.ts");

    expect(source).toContain("applyProfileActionInCloud");
    expect(source).toContain("setSaving(true)");
    expect(source).toContain("runProfileStateSave");
    expect(source).toContain("runProfileAndUserSave");
    expect(source).toContain("saveProfileStateToCloud");
    expect(source).toContain("saveProfileAndUserToCloud");
    expect(source).toContain("replaceProfileState");
    expect(source).toContain("setUser");
    expect(source).toContain("setError");
    expect(source).toContain("throw caughtError");
  });

  it("persists authenticated language changes through the profile cloud contract", async () => {
    const source = await readSource("src/app/layouts/AppLayout.tsx");

    expect(source).toContain("useProfileCloudAction");
    expect(source).toContain("runProfileAction(setProfileLanguage(nextLanguage))");
    expect(source).toContain("setLanguage(nextProfile.languagePreference)");
    expect(source).toContain("persisted: true");
    expect(source).toContain("disabled={languageProfileAction.saving}");
    expect(source).not.toContain("applyProfileActionInCloud");
  });

  it("keeps notification preferences cloud-confirmed with visible failure state", async () => {
    const source = await readSource(
      "src/features/profile/NotificationSettingsCard.tsx"
    );

    expect(source).toContain("useProfileCloudAction");
    expect(source).toContain("profileAction.runProfileAction");
    expect(source).toContain("profileAction.hasError");
    expect(source).toContain("profileAction.saving");
    expect(source).toContain("copy.saveError");
    expect(source).not.toContain("applyProfileActionInCloud");
  });

  it("keeps assistant customization settings on the shared cloud contract", async () => {
    const source = await readSource(
      "src/features/profile/AssistantCustomizationCard.tsx"
    );

    expect(source).toContain("useProfileCloudAction");
    expect(source).toContain("profileAction.runProfileAction");
    expect(source).toContain("profileAction.hasError");
    expect(source).toContain("disabled={profileAction.saving}");
    expect(source).toContain("catch(() => undefined)");
    expect(source).not.toContain("applyProfileActionInCloud");
  });

  it("keeps adaptive goal changes cloud-confirmed with retry feedback", async () => {
    const source = await readSource("src/features/profile/AdaptiveGoalCard.tsx");

    expect(source).toContain("useProfileCloudAction");
    expect(source).toContain("runProfileAction");
    expect(source).toContain("setAdaptiveCalories");
    expect(source).toContain("profileAction.hasError");
    expect(source).toContain("disabled={profileAction.saving}");
    expect(source).not.toContain("applyProfileActionInCloud");
  });

  it("keeps motivation actions and reset on the shared profile persistence contract", async () => {
    const source = await readSource("src/features/profile/MotivationHubCard.tsx");

    expect(source).toContain("useProfileCloudAction");
    expect(source).toContain("profileAction.runProfileAction");
    expect(source).toContain("profileAction.runProfileStateSave");
    expect(source).toContain("profileAction.hasError");
    expect(source).toContain("profileAction.saving");
    expect(source).not.toContain("applyProfileActionInCloud");
    expect(source).not.toContain("saveProfileStateToCloud");
    expect(source).not.toContain("replaceProfileState");
  });

  it("keeps progress photo add and remove on the shared profile persistence contract", async () => {
    const source = await readSource(
      "src/features/profile/BodyProgressPhotosCard.tsx"
    );

    expect(source).toContain("useProfileCloudAction");
    expect(source).toContain("profileAction.runProfileAction");
    expect(source).toContain("addProgressPhoto");
    expect(source).toContain("removeProgressPhoto");
    expect(source).toContain("profileAction.hasError");
    expect(source).toContain("profileAction.saving");
    expect(source).not.toContain("applyProfileActionInCloud");
  });

  it("keeps the full profile form on the shared user/profile cloud save contract", async () => {
    const source = await readSource("src/features/profile/ProfileForm.tsx");

    expect(source).toContain("useProfileCloudAction");
    expect(source).toContain("profileAction.runProfileAndUserSave");
    expect(source).toContain("profileAction.saving");
    expect(source).toContain("profileAction.error");
    expect(source).not.toContain("saveProfileAndUserToCloud");
    expect(source).not.toContain("replaceProfileState");
  });

  it("keeps measurement check-ins on the shared user/profile cloud save contract", async () => {
    const source = await readSource(
      "src/features/profile/MeasurementsCheckInCard.tsx"
    );

    expect(source).toContain("useProfileCloudAction");
    expect(source).toContain("profileAction.runProfileAndUserSave");
    expect(source).toContain("profileAction.saving");
    expect(source).toContain("profileAction.error");
    expect(source).not.toContain("saveProfileAndUserToCloud");
    expect(source).not.toContain("replaceProfileState");
  });

  it("keeps quick weight check-ins on the shared user/profile cloud save contract", async () => {
    const source = await readSource(
      "src/features/profile/QuickWeightCheckInCard.tsx"
    );

    expect(source).toContain("useProfileCloudAction");
    expect(source).toContain("profileAction.runProfileAndUserSave");
    expect(source).toContain("profileAction.saving");
    expect(source).toContain("profileAction.error");
    expect(source).not.toContain("saveProfileAndUserToCloud");
    expect(source).not.toContain("replaceProfileState");
  });
});
