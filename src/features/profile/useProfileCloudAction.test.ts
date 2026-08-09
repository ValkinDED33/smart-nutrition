import { describe, expect, it } from "vitest";
import { resolveProfileCloudActionErrorMessage } from "./useProfileCloudAction";
import type { ProfileCloudActionCopy } from "./profileCloudActionCopy";

const copy: ProfileCloudActionCopy = {
  saveFailed: "Не вдалося зберегти зміни профілю.",
  saveInProgress: "Зміни профілю вже зберігаються.",
};

describe("useProfileCloudAction", () => {
  it("keeps user-facing profile errors injected and free of backend/provider exception text", () => {
    expect(
      resolveProfileCloudActionErrorMessage(
        new Error("Backend unavailable: REMOTE_API_TIMEOUT"),
        copy
      )
    ).toBe(copy.saveFailed);

    expect(
      resolveProfileCloudActionErrorMessage(
        new Error("Cloud profile save is already in progress."),
        copy
      )
    ).toBe(copy.saveInProgress);
  });

  it("preserves typed cloud sync diagnostics without leaking raw backend text", () => {
    expect(
      resolveProfileCloudActionErrorMessage(
        new Error(
          "Cloud sync could not save the latest profile data. (STATE_SYNC_UNAVAILABLE · HTTP 503)"
        ),
        copy
      )
    ).toBe(
      "Cloud sync could not save the latest profile data. (STATE_SYNC_UNAVAILABLE · HTTP 503)"
    );

    expect(
      resolveProfileCloudActionErrorMessage(
        new Error("Mongo connection refused while saving profile-state"),
        copy
      )
    ).toBe(copy.saveFailed);
  });

  it("keeps optional confirmation timestamps on the shared hook contract", async () => {
    const source = await import("node:fs/promises").then(({ readFile }) =>
      readFile("src/features/profile/useProfileCloudAction.ts", "utf8")
    );

    expect(source).toContain("confirmedAt?: string");
    expect(source).toContain("saveProfileStateToCloudWithConflictRebase");
    expect(source).toContain("profile,\n          nextProfile,\n          undefined,\n          confirmedAt");
    expect(source).toContain("saveProfileAndUserToCloudWithConflictRebase");
    expect(source).toContain("rebaseProfile?: (freshProfile: ProfileState) => ProfileState");
    expect(source).toContain("nextProfile,\n              rebaseProfile,\n              confirmedAt");
    expect(source).toContain("rebaseProfileStateChange(profile, nextProfile, freshProfile)");
  });
});
