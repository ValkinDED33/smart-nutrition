import { describe, expect, it } from "vitest";
import { getPublicTelegramStatus } from "./status.mjs";

describe("public runtime status", () => {
  it("publishes canonical Telegram reminder status without legacy aliases", () => {
    const status = getPublicTelegramStatus({
      configured: true,
      botUsername: "SmartNutritionAssistBot",
      reminders: {
        enabled: true,
        polling: true,
        capabilities: { medication: true, task: true },
      },
      medicationReminders: {
        enabled: false,
        polling: false,
      },
    });

    expect(status.reminders).toEqual({
      enabled: true,
      polling: true,
      capabilities: { medication: true, task: true },
    });
    expect(status).not.toHaveProperty("medicationReminders");
  });

  it("keeps legacy Telegram reminder status as an input fallback only", () => {
    const status = getPublicTelegramStatus({
      configured: true,
      medicationReminders: {
        enabled: true,
        polling: true,
      },
    });

    expect(status.reminders).toEqual({
      enabled: true,
      polling: true,
      capabilities: null,
    });
    expect(status).not.toHaveProperty("medicationReminders");
  });
});
