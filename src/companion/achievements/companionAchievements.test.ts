import { describe, expect, it } from "vitest";
import { createInitialCompanionState } from "../progression/companionProgression";
import {
  evaluateAchievementsAfterReward,
  getCompanionAchievementById,
} from "./companionAchievements";

const INITIAL_COMPANION_TIMESTAMP = "2026-06-08T10:00:00.000Z";
const FIRST_MEAL_ACHIEVEMENT_ID = "first_meal_logged";

describe("companionAchievements", () => {
  it("returns achievement definitions by id", () => {
    expect(getCompanionAchievementById(FIRST_MEAL_ACHIEVEMENT_ID)).toMatchObject({
      id: FIRST_MEAL_ACHIEVEMENT_ID,
      category: "nutrition",
    });
    expect(getCompanionAchievementById("unknown")).toBeNull();
  });

  it("evaluates first action achievements", () => {
    const state = createInitialCompanionState(INITIAL_COMPANION_TIMESTAMP);

    expect(evaluateAchievementsAfterReward(state, "meal_added")).toContainEqual(
      expect.objectContaining({ id: FIRST_MEAL_ACHIEVEMENT_ID })
    );
    expect(evaluateAchievementsAfterReward(state, "water_logged")).toContainEqual(
      expect.objectContaining({ id: "first_water_logged" })
    );
    expect(evaluateAchievementsAfterReward(state, "weight_updated")).toContainEqual(
      expect.objectContaining({ id: "first_weight_updated" })
    );
    expect(evaluateAchievementsAfterReward(state, "onboarding_completed")).toContainEqual(
      expect.objectContaining({ id: "onboarding_completed" })
    );
  });

  it("evaluates level achievements from the rewarded state", () => {
    const levelTwoState = {
      ...createInitialCompanionState(INITIAL_COMPANION_TIMESTAMP),
      level: 2 as const,
      xp: 100,
    };
    const levelFiveState = {
      ...levelTwoState,
      level: 5 as const,
      xp: 900,
    };

    expect(evaluateAchievementsAfterReward(levelTwoState, "login_daily")).toContainEqual(
      expect.objectContaining({ id: "level_2_reached" })
    );
    expect(evaluateAchievementsAfterReward(levelFiveState, "goal_completed")).toContainEqual(
      expect.objectContaining({ id: "level_5_reached" })
    );
  });

  it("does not return already unlocked achievements", () => {
    const state = {
      ...createInitialCompanionState(INITIAL_COMPANION_TIMESTAMP),
      achievements: [
        {
          id: FIRST_MEAL_ACHIEVEMENT_ID,
          title: "First meal",
        },
      ],
    };

    expect(evaluateAchievementsAfterReward(state, "meal_added")).not.toContainEqual(
      expect.objectContaining({ id: FIRST_MEAL_ACHIEVEMENT_ID })
    );
  });
});
