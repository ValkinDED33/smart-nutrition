import { describe, expect, it } from "vitest";
import {
  TELEGRAM_CONNECT_STATUS_POLL_TIMEOUT_MS,
  shouldPollTelegramConnectStatus,
} from "./telegramConnectStatusModel";

describe("telegramConnectStatusModel", () => {
  it("polls while a fresh connect link is pending", () => {
    expect(
      shouldPollTelegramConnectStatus({
        connected: false,
        hasConnectLink: true,
        startedAtMs: 1_000,
        nowMs: 1_000 + TELEGRAM_CONNECT_STATUS_POLL_TIMEOUT_MS - 1,
      })
    ).toBe(true);
  });

  it("stops polling when already connected, missing link, or expired", () => {
    expect(
      shouldPollTelegramConnectStatus({
        connected: true,
        hasConnectLink: true,
        startedAtMs: 1_000,
        nowMs: 2_000,
      })
    ).toBe(false);
    expect(
      shouldPollTelegramConnectStatus({
        connected: false,
        hasConnectLink: false,
        startedAtMs: 1_000,
        nowMs: 2_000,
      })
    ).toBe(false);
    expect(
      shouldPollTelegramConnectStatus({
        connected: false,
        hasConnectLink: true,
        startedAtMs: 1_000,
        nowMs: 1_001 + TELEGRAM_CONNECT_STATUS_POLL_TIMEOUT_MS,
      })
    ).toBe(false);
  });
});
