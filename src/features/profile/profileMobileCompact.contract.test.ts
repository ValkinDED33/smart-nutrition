import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");
const MOBILE_CARD_PADDING = "p: { xs: 1.35, md: 3 }";
const HIDE_MOBILE_SUPPORTING_TEXT = 'display: { xs: "none", sm: "block" }';
const MOBILE_SNAP_RAIL = 'scrollSnapType: { xs: "x proximity", md: "none" }';
const MOBILE_SNAP_START = 'scrollSnapType: { xs: "x proximity"';
const FLEX_TO_GRID_RAIL = 'display: { xs: "flex", md: "grid" }';

describe("profile mobile compact contracts", () => {
  it("keeps premium status and plan cards compact on mobile", async () => {
    const source = await readSource(
      "src/features/profile/PremiumAccessCard.tsx",
    );

    expect(source).toContain('data-premium-mobile-status-rail="true"');
    expect(source).toContain('data-premium-mobile-plan-rail="true"');
    expect(source).toContain(MOBILE_CARD_PADDING);
    expect(source).toContain(MOBILE_SNAP_RAIL);
    expect(source).toContain(HIDE_MOBILE_SUPPORTING_TEXT);
  });

  it("keeps weekly measurements usable without a long mobile history column", async () => {
    const source = await readSource(
      "src/features/profile/MeasurementsCheckInCard.tsx",
    );

    expect(source).toContain('data-measurements-mobile-history-rail="true"');
    expect(source).toContain(MOBILE_CARD_PADDING);
    expect(source).toContain(
      'const MEASUREMENT_FIELD_FLEX = { xs: "1 1 calc(50% - 8px)", md: "1 1 0" }',
    );
    expect(source).toContain("sx={{ flex: MEASUREMENT_FIELD_FLEX }}");
    expect(source).toContain(MOBILE_SNAP_RAIL);
  });

  it("keeps account, cloud sync, and adaptive goal profile cards short on mobile", async () => {
    const account = await readSource(
      "src/features/profile/AccountDataCard.tsx",
    );
    const cloud = await readSource(
      "src/features/profile/CloudSyncStatusCard.tsx",
    );
    const adaptive = await readSource(
      "src/features/profile/AdaptiveGoalCard.tsx",
    );

    expect(account).toContain('data-account-mobile-runtime-rail="true"');
    expect(account).toContain('data-account-mobile-backup-rail="true"');
    expect(account).toContain(MOBILE_CARD_PADDING);
    expect(account).toContain(HIDE_MOBILE_SUPPORTING_TEXT);
    expect(account).toContain(MOBILE_SNAP_RAIL);
    expect(cloud).toContain('data-cloud-sync-mobile-status-rail="true"');
    expect(cloud).toContain(MOBILE_CARD_PADDING);
    expect(cloud).toContain(HIDE_MOBILE_SUPPORTING_TEXT);
    expect(adaptive).toContain('data-adaptive-goal-mobile-metric-rail="true"');
    expect(adaptive).toContain(MOBILE_CARD_PADDING);
    expect(adaptive).toContain(HIDE_MOBILE_SUPPORTING_TEXT);
  });

  it("keeps behavior personalization habits swipeable on mobile", async () => {
    const source = await readSource(
      "src/features/profile/BehaviorPersonalizationCard.tsx",
    );

    expect(source).toContain('data-behavior-mobile-score-rail="true"');
    expect(source).toContain('data-behavior-mobile-habit-rail="true"');
    expect(source).toContain(MOBILE_CARD_PADDING);
    expect(source).toContain(HIDE_MOBILE_SUPPORTING_TEXT);
    expect(source).toContain(FLEX_TO_GRID_RAIL);
    expect(source).toContain(MOBILE_SNAP_RAIL);
  });

  it("keeps body report, progress photos, and notification settings compact on mobile", async () => {
    const bodyReport = await readSource(
      "src/features/profile/BodyWeeklyReportCard.tsx",
    );
    const photos = await readSource(
      "src/features/profile/BodyProgressPhotosCard.tsx",
    );
    const notifications = await readSource(
      "src/features/profile/NotificationSettingsCard.tsx",
    );

    expect(bodyReport).toContain('data-body-weekly-mobile-summary-rail="true"');
    expect(bodyReport).toContain(
      'data-body-weekly-mobile-measurement-rail="true"',
    );
    expect(bodyReport).toContain(MOBILE_CARD_PADDING);
    expect(bodyReport).toContain(HIDE_MOBILE_SUPPORTING_TEXT);
    expect(bodyReport).toContain(MOBILE_SNAP_START);
    expect(photos).toContain(
      'data-progress-photos-mobile-featured-rail="true"',
    );
    expect(photos).toContain('data-progress-photos-mobile-history-rail="true"');
    expect(photos).toContain(MOBILE_CARD_PADDING);
    expect(photos).toContain(HIDE_MOBILE_SUPPORTING_TEXT);
    expect(photos).toContain(MOBILE_SNAP_START);
    expect(notifications).toContain(
      'data-notifications-mobile-status-rail="true"',
    );
    expect(notifications).toContain(
      'data-notifications-mobile-toggle-rail="true"',
    );
    expect(notifications).toContain(
      'data-notifications-mobile-time-rail="true"',
    );
    expect(notifications).toContain(MOBILE_CARD_PADDING);
    expect(notifications).toContain(HIDE_MOBILE_SUPPORTING_TEXT);
    expect(notifications).toContain(MOBILE_SNAP_RAIL);
  });

  it("keeps the profile editor scannable on mobile", async () => {
    const source = await readSource("src/features/profile/ProfileForm.tsx");

    expect(source).toContain('data-profile-form-mobile-avatar-rail="true"');
    expect(source).toContain('data-profile-form-mobile-basics-rail="true"');
    expect(source).toContain('data-profile-form-mobile-personal-rail="true"');
    expect(source).toContain('data-profile-form-mobile-context-rail="true"');
    expect(source).toContain('data-profile-form-mobile-body-rail="true"');
    expect(source).toContain('data-profile-form-mobile-target-rail="true"');
    expect(source).toContain('data-profile-form-mobile-diet-rail="true"');
    expect(source).toContain(
      'data-profile-form-mobile-restrictions-rail="true"',
    );
    expect(source).toContain(MOBILE_CARD_PADDING);
    expect(source).toContain(HIDE_MOBILE_SUPPORTING_TEXT);
    expect(source).toContain("const PROFILE_FORM_MOBILE_FIELD_RAIL_SX = {");
    expect(source).toContain(MOBILE_SNAP_RAIL);
  });
});
