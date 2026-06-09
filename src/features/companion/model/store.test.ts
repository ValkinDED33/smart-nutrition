import { describe, expect, it } from "vitest";
import companionReducer, {
  awardCompanionReward,
  hydrateCompanionState,
  resetCompanionState,
  unlockCompanionAchievement,
} from "./store";

describe("companion store", () => {
  it("creates initial companion state", () => {
    const state = companionReducer(undefined, { type: "init" });

    expect(state).toMatchObject({
      level: 1,
      xp: 0,
      coins: 0,
      relationshipLevel: 1,
      achievements: [],
    });
  });

  it("awards xp for a known reward", () => {
    const state = companionReducer(undefined, awardCompanionReward("meal_added"));

    expect(state.xp).toBe(10);
    expect(state.level).toBe(1);
    expect(state.achievements).toContainEqual(
      expect.objectContaining({ id: "first_meal_logged" })
    );
  });

  it("awards real product action rewards with configured xp values", () => {
    const afterMeal = companionReducer(undefined, awardCompanionReward("meal_added"));
    const afterWater = companionReducer(afterMeal, awardCompanionReward("water_logged"));
    const afterWeight = companionReducer(afterWater, awardCompanionReward("weight_updated"));
    const afterOnboarding = companionReducer(
      afterWeight,
      awardCompanionReward("onboarding_completed")
    );

    expect(afterMeal.xp).toBe(10);
    expect(afterWater.xp).toBe(15);
    expect(afterWeight.xp).toBe(25);
    expect(afterOnboarding.xp).toBe(125);
    expect(afterOnboarding.level).toBe(2);
    expect(afterOnboarding.achievements.map((achievement) => achievement.id)).toEqual(
      expect.arrayContaining([
        "first_meal_logged",
        "first_water_logged",
        "first_weight_updated",
        "onboarding_completed",
        "level_2_reached",
      ])
    );
  });

  it("does not award xp for unknown events", () => {
    const state = companionReducer(undefined, awardCompanionReward("unknown_event"));

    expect(state).toMatchObject({
      level: 1,
      xp: 0,
      coins: 0,
    });
  });

  it("levels up when rewards cross a threshold", () => {
    const hydrated = companionReducer(
      undefined,
      hydrateCompanionState({
        level: 1,
        xp: 95,
        coins: 0,
        relationshipLevel: 1,
        achievements: [],
        createdAt: "2026-06-08T10:00:00.000Z",
        updatedAt: "2026-06-08T10:00:00.000Z",
      })
    );
    const rewarded = companionReducer(hydrated, awardCompanionReward("login_daily"));

    expect(rewarded.xp).toBe(100);
    expect(rewarded.level).toBe(2);
    expect(rewarded.achievements).toContainEqual(
      expect.objectContaining({ id: "level_2_reached" })
    );
  });

  it("unlocks first action achievements once", () => {
    const afterMeal = companionReducer(undefined, awardCompanionReward("meal_added"));
    const afterMealAgain = companionReducer(afterMeal, awardCompanionReward("meal_added"));
    const afterWater = companionReducer(afterMealAgain, awardCompanionReward("water_logged"));
    const afterWeight = companionReducer(afterWater, awardCompanionReward("weight_updated"));
    const afterOnboarding = companionReducer(
      afterWeight,
      awardCompanionReward("onboarding_completed")
    );
    const ids = afterOnboarding.achievements.map((achievement) => achievement.id);

    expect(ids.filter((id) => id === "first_meal_logged")).toHaveLength(1);
    expect(ids.filter((id) => id === "first_water_logged")).toHaveLength(1);
    expect(ids.filter((id) => id === "first_weight_updated")).toHaveLength(1);
    expect(ids.filter((id) => id === "onboarding_completed")).toHaveLength(1);
  });

  it("unlocks level 5 when a reward crosses that threshold", () => {
    const hydrated = companionReducer(
      undefined,
      hydrateCompanionState({
        level: 4,
        xp: 880,
        coins: 0,
        relationshipLevel: 1,
        achievements: [{ id: "level_2_reached", title: "Level 2" }],
        createdAt: "2026-06-08T10:00:00.000Z",
        updatedAt: "2026-06-08T10:00:00.000Z",
      })
    );
    const rewarded = companionReducer(hydrated, awardCompanionReward("goal_completed"));

    expect(rewarded.level).toBe(5);
    expect(rewarded.achievements).toContainEqual(
      expect.objectContaining({ id: "level_5_reached" })
    );
  });

  it("hydrates an existing companion state", () => {
    const state = companionReducer(
      undefined,
      hydrateCompanionState({
        level: 3,
        xp: 260,
        coins: 12,
        relationshipLevel: 2,
        achievements: [
          {
            id: "first-meal",
            title: "First meal",
            unlockedAt: "2026-06-08T10:00:00.000Z",
          },
        ],
        createdAt: "2026-06-08T09:00:00.000Z",
        updatedAt: "2026-06-08T10:00:00.000Z",
      })
    );

    expect(state).toMatchObject({
      level: 3,
      xp: 260,
      coins: 12,
      relationshipLevel: 2,
      createdAt: "2026-06-08T09:00:00.000Z",
      updatedAt: "2026-06-08T10:00:00.000Z",
    });
    expect(state.achievements).toHaveLength(1);
  });

  it("falls back safely when hydrated from a missing snapshot field", () => {
    const state = companionReducer(undefined, hydrateCompanionState(undefined));

    expect(state).toMatchObject({
      level: 1,
      xp: 0,
      coins: 0,
      achievements: [],
    });
  });

  it("unlocks achievements idempotently", () => {
    const achievement = {
      id: "first-water",
      title: "First water",
    };
    const unlocked = companionReducer(
      undefined,
      unlockCompanionAchievement(achievement)
    );
    const unlockedAgain = companionReducer(
      unlocked,
      unlockCompanionAchievement(achievement)
    );

    expect(unlocked.achievements).toHaveLength(1);
    expect(unlockedAgain).toBe(unlocked);
  });

  it("resets companion state", () => {
    const rewarded = companionReducer(undefined, awardCompanionReward("goal_completed"));
    const reset = companionReducer(rewarded, resetCompanionState());

    expect(reset).toMatchObject({
      level: 1,
      xp: 0,
      coins: 0,
      achievements: [],
    });
  });
});
