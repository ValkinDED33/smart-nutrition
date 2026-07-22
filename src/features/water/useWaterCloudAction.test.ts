import { describe, expect, it } from "vitest";
import { resolveWaterCloudActionErrorMessage } from "./useWaterCloudAction";

describe("useWaterCloudAction", () => {
  it("keeps user-facing water errors free of backend/provider exception text", () => {
    const copy = {
      saveFailed: "Не вдалося зберегти воду. Спробуйте ще раз.",
      saveInProgress: "Вода вже зберігається. Зачекайте кілька секунд.",
    };

    expect(
      resolveWaterCloudActionErrorMessage(
        new Error("Provider unavailable: REMOTE_API_TIMEOUT"),
        copy
      )
    ).toBe(copy.saveFailed);

    expect(
      resolveWaterCloudActionErrorMessage(
        new Error("Cloud water save is already in progress."),
        copy
      )
    ).toBe(copy.saveInProgress);
  });
});
