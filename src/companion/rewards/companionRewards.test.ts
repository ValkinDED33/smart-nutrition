import { describe, expect, it } from "vitest";
import { createInitialCompanionState } from "../progression/companionProgression";
import {
  getCompanionReward,
  hasCompanionAchievement,
  unlockCompanionAchievement,
} from "./companionRewards";

describe("companionRewards", () => {
  it("returns configured reward values for known events", () => {
    expect(getCompanionReward("registration_completed")).toMatchObject({
      event: "registration_completed",
      xp: 100,
      coins: 0,
    });
    expect(getCompanionReward("water_logged")).toMatchObject({
      event: "water_logged",
      xp: 5,
      coins: 1,
    });
    expect(getCompanionReward("goal_completed")).toMatchObject({
      event: "goal_completed",
      xp: 50,
      coins: 10,
    });
  });

  it("returns null for unknown events", () => {
    expect(getCompanionReward("something_else")).toBeNull();
  });

  it("unlocks achievements idempotently", () => {
    const state = createInitialCompanionState("2026-06-08T10:00:00.000Z");
    const achievement = {
      id: "first-meal",
      title: "First meal",
      description: "Logged the first meal.",
    };
    const unlocked = unlockCompanionAchievement(
      state,
      achievement,
      "2026-06-08T10:10:00.000Z"
    );
    const unlockedAgain = unlockCompanionAchievement(
      unlocked,
      achievement,
      "2026-06-08T10:20:00.000Z"
    );

    expect(hasCompanionAchievement(unlocked, "first-meal")).toBe(true);
    expect(unlocked.achievements).toHaveLength(1);
    expect(unlocked.achievements[0]).toMatchObject({
      id: "first-meal",
      unlockedAt: "2026-06-08T10:10:00.000Z",
    });
    expect(unlockedAgain).toBe(unlocked);
  });
});
