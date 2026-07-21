import { describe, expect, it } from "vitest";
import { resolveWaterCloudActionErrorMessage } from "./useWaterCloudAction";

describe("useWaterCloudAction", () => {
  it("keeps user-facing water errors free of backend/provider exception text", () => {
    expect(
      resolveWaterCloudActionErrorMessage(
        new Error("Provider unavailable: REMOTE_API_TIMEOUT")
      )
    ).toBe("Water could not be saved. Please try again.");

    expect(
      resolveWaterCloudActionErrorMessage(
        new Error("Cloud water save is already in progress.")
      )
    ).toBe("Water is already being saved. Please wait a moment.");
  });
});
