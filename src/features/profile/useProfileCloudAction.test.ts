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

  it("keeps optional confirmation timestamps on the shared hook contract", async () => {
    const source = await import("node:fs/promises").then(({ readFile }) =>
      readFile("src/features/profile/useProfileCloudAction.ts", "utf8")
    );

    expect(source).toContain("confirmedAt?: string");
    expect(source).toContain("saveProfileStateToCloud(dispatch, nextProfile, confirmedAt)");
    expect(source).toContain("nextProfile,\n          confirmedAt");
  });
});
