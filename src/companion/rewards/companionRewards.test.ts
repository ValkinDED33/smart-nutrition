import { describe, expect, it } from "vitest";
import { createInitialCompanionState } from "../progression/companionProgression";
import {
  getCompanionReward,
  hasCompanionAchievement,
  unlockCompanionAchievement,
} from "./companionRewards";

const INITIAL_COMPANION_TIMESTAMP = "2026-06-08T10:00:00.000Z";
const FIRST_MEAL_ACHIEVEMENT_ID = "first-meal";
const FIRST_MEAL_TITLE = "First meal";
const FIRST_MEAL_UNLOCKED_AT = "2026-06-08T10:10:00.000Z";

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
    const state = createInitialCompanionState(INITIAL_COMPANION_TIMESTAMP);
    const achievement = {
      id: FIRST_MEAL_ACHIEVEMENT_ID,
      title: FIRST_MEAL_TITLE,
      description: "Logged the first meal.",
    };
    const unlocked = unlockCompanionAchievement(
      state,
      achievement,
      FIRST_MEAL_UNLOCKED_AT
    );
    const unlockedAgain = unlockCompanionAchievement(
      unlocked,
      achievement,
      "2026-06-08T10:20:00.000Z"
    );

    expect(hasCompanionAchievement(unlocked, FIRST_MEAL_ACHIEVEMENT_ID)).toBe(true);
    expect(unlocked.achievements).toHaveLength(1);
    expect(unlocked.achievements[0]).toMatchObject({
      id: FIRST_MEAL_ACHIEVEMENT_ID,
      unlockedAt: FIRST_MEAL_UNLOCKED_AT,
    });
    expect(unlockedAgain).toBe(unlocked);
  });
});
