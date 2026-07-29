import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");
const womenHealthCardPath = "src/features/profile/WomenHealthOverviewCard.tsx";

describe("WomenHealthOverviewCard contract", () => {
  it("uses the canonical profile women-health state without local persistence", async () => {
    const source = await readSource(womenHealthCardPath);

    expect(source).toContain("state.profile.womenHealth");
    expect(source).toContain("isWomenHealthVisibleForGender");
    expect(source).not.toContain("localStorage");
    expect(source).toContain("useProfileCloudAction");
    expect(source).toContain("getProfileCloudActionCopy");
    expect(source).toContain("profileAction.runProfileStateSave(nextProfile)");
    expect(source).not.toContain("saveProfileStateToCloud");
    expect(source).not.toContain("replaceProfileState(nextProfile)");
  });

  it("keeps women-health guidance safety-bound instead of medical certainty", async () => {
    const source = await readSource(womenHealthCardPath);

    expect(source).toContain("No medical prescriptions");
    expect(source).toContain("лікарем");
    expect(source).toContain("clinician");
    expect(source).not.toMatch(/diagnosis|guarantee/i);
  });

  it("surfaces pregnancy as a dedicated women-health block", async () => {
    const source = await readSource(womenHealthCardPath);

    expect(source).toContain('data-women-health-pregnancy-block="true"');
    expect(source).toContain("copy.pregnancyTitle");
    expect(source).toContain("copy.pregnancyTimeline");
    expect(source).toContain("copy.pregnancySafety");
    expect(source).toContain("hasPregnancyContext");
    expect(source).toContain("getEffectivePregnancyWeek");
    expect(source).toContain("effectivePregnancyWeek");
    expect(source).toContain("womenHealth.pregnancyWeek");
    expect(source).toContain("womenHealth.dueDate");
  });

  it("surfaces baby preview as probability context, not a medical verdict", async () => {
    const source = await readSource(womenHealthCardPath);

    expect(source).toContain('data-baby-preview-block="true"');
    expect(source).toContain("buildBabyPreview");
    expect(source).toContain("copy.eyeChanceTitle");
    expect(source).toContain("copy.sexChanceBody");
    expect(source).toContain("copy.babyPreviewDisclaimer");
    expect(source).toContain("buildProfileStateAfterAction");
    expect(source).toContain("updatePersonalDetails");
    expect(source).toContain("updateWomenHealth(womenHealthPatch)");
    expect(source).toContain("profileAction.runProfileStateSave(nextProfile)");
    expect(source).toContain("profileActionCopy.saveInProgress");
    expect(source).not.toContain("saveProfileStateToCloud");
    expect(source).not.toContain("replaceProfileState(nextProfile)");
  });

  it("surfaces backend-confirmed symptom history as care context", async () => {
    const source = await readSource(womenHealthCardPath);

    expect(source).toContain('data-women-health-symptom-history="true"');
    expect(source).toContain("womenHealth.symptomHistory");
    expect(source).toContain("recentSymptomHistory");
    expect(source).toContain("copy.symptomHistoryTitle");
    expect(source).toContain("copy.symptomSafetyNote");
    expect(source).toContain("getSymptomSeverityColor");
    expect(source).toContain("formatSymptomDate");
    expect(source).not.toContain("localStorage");
  });

  it("surfaces the women-health center through the existing profile shell", async () => {
    const source = await readSource("src/pages/ProfilePage.tsx");

    expect(source).toContain("WomenHealthOverviewCard");
    expect(source).toContain("../features/profile/WomenHealthOverviewCard");
    expect(source).toContain("isWomenHealthVisibleForGender(user.gender)");
    expect(source).toContain('id: "women-health"');
    expect(source).toContain("copy.tabs.womenHealth");
  });

  it("uses backend-confirmed partner sharing instead of a local family mock", async () => {
    const source = await readSource(womenHealthCardPath);

    expect(source).toContain("createRemotePartnerInvite");
    expect(source).toContain("acceptRemotePartnerInvite");
    expect(source).toContain("fetchRemotePartnerPregnancyShares");
    expect(source).toContain("QRCode.toDataURL");
    expect(source).not.toContain("localStorage");
  });
});
