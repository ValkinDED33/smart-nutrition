import { describe, expect, it } from "vitest";
import {
  createCompanionRewardAnalyticsPayload,
  getCompanionRewardXp,
} from "./rewardTelemetry";

describe("companion reward telemetry", () => {
  it("maps known reward events to analytics payload", () => {
    expect(createCompanionRewardAnalyticsPayload("meal_added")).toEqual({
      companionRewardEvent: "meal_added",
      companionXpAwarded: 10,
    });
  });

  it("returns zero xp for unknown reward events", () => {
    expect(getCompanionRewardXp("unknown_event")).toBe(0);
  });
});
