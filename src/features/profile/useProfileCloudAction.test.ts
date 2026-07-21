import { describe, expect, it } from "vitest";
import { resolveProfileCloudActionErrorMessage } from "./useProfileCloudAction";

describe("useProfileCloudAction", () => {
  it("keeps user-facing profile errors free of backend/provider exception text", () => {
    expect(
      resolveProfileCloudActionErrorMessage(
        new Error("Backend unavailable: REMOTE_API_TIMEOUT")
      )
    ).toBe("Profile changes could not be saved. Please try again.");

    expect(
      resolveProfileCloudActionErrorMessage(
        new Error("Cloud profile save is already in progress.")
      )
    ).toBe("Profile changes are already being saved. Please wait a moment.");
  });
});
