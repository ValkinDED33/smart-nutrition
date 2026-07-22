import { describe, expect, it } from "vitest";
import { resolveCloudSyncFailureMessage } from "./cloudSyncErrors";

const fallbackMessage = "Cloud sync could not save the latest profile data.";
const conflictMessage =
  "Cloud data changed on another device. Pull the latest cloud version before saving again.";

describe("cloud sync error messages", () => {
  it("keeps state conflicts actionable without exposing raw backend text", () => {
    expect(
      resolveCloudSyncFailureMessage({
        code: "STATE_CONFLICT",
        message: "provider raw state_conflict payload",
        fallbackMessage,
        conflictMessage,
      })
    ).toBe(conflictMessage);
  });

  it("keeps inactive sync as product cloud language", () => {
    expect(
      resolveCloudSyncFailureMessage({
        code: "SYNC_DISABLED",
        message: "Cloud sync is not active for this account.",
        fallbackMessage,
        conflictMessage,
      })
    ).toBe("Cloud sync is not active for this account.");
  });

  it("replaces unknown backend/provider text with the domain fallback", () => {
    expect(
      resolveCloudSyncFailureMessage({
        code: "SYNC_FAILED",
        message: "Provider stack trace: database host refused connection",
        fallbackMessage,
        conflictMessage,
      })
    ).toBe(fallbackMessage);
  });
});
