import { describe, expect, it } from "vitest";
import companionReducer, {
  awardCompanionReward,
  equipCompanionItem,
  hydrateCompanionState,
  purchaseCompanionItem,
  resetCompanionState,
  unlockCompanionAchievement,
} from "./store";

const CREATED_AT = "2026-06-08T09:00:00.000Z";
const UPDATED_AT = "2026-06-08T10:00:00.000Z";
const DRAGON_ITEM_ID = "dragon-premium";
const FIRST_MEAL_ACHIEVEMENT_ID = "first_meal_logged";
const FIRST_WATER_ACHIEVEMENT_ID = "first_water_logged";
const FIRST_WEIGHT_ACHIEVEMENT_ID = "first_weight_updated";
const ONBOARDING_ACHIEVEMENT_ID = "onboarding_completed";
const LEVEL_2_ACHIEVEMENT_ID = "level_2_reached";
const LEVEL_5_ACHIEVEMENT_ID = "level_5_reached";

describe("companion store", () => {
  it("creates initial companion state", () => {
    const state = companionReducer(undefined, { type: "init" });

    expect(state).toMatchObject({
      level: 1,
      xp: 0,
      coins: 0,
      relationshipLevel: 1,
      achievements: [],
      ownedItemIds: [],
      equippedItemIds: [],
    });
  });

  it("awards xp for a known reward", () => {
    const state = companionReducer(undefined, awardCompanionReward("meal_added"));

    expect(state.xp).toBe(10);
    expect(state.level).toBe(1);
    expect(state.achievements).toContainEqual(
      expect.objectContaining({ id: FIRST_MEAL_ACHIEVEMENT_ID })
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
    expect(afterMeal.coins).toBe(2);
    expect(afterWater.xp).toBe(15);
    expect(afterWater.coins).toBe(3);
    expect(afterWeight.xp).toBe(25);
    expect(afterWeight.coins).toBe(6);
    expect(afterOnboarding.xp).toBe(125);
    expect(afterOnboarding.coins).toBe(26);
    expect(afterOnboarding.level).toBe(2);
    expect(afterOnboarding.achievements.map((achievement) => achievement.id)).toEqual(
      expect.arrayContaining([
        FIRST_MEAL_ACHIEVEMENT_ID,
        FIRST_WATER_ACHIEVEMENT_ID,
        FIRST_WEIGHT_ACHIEVEMENT_ID,
        ONBOARDING_ACHIEVEMENT_ID,
        LEVEL_2_ACHIEVEMENT_ID,
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
        ownedItemIds: [],
        equippedItemIds: [],
        createdAt: UPDATED_AT,
        updatedAt: UPDATED_AT,
      })
    );
    const rewarded = companionReducer(hydrated, awardCompanionReward("login_daily"));

    expect(rewarded.xp).toBe(100);
    expect(rewarded.level).toBe(2);
    expect(rewarded.achievements).toContainEqual(
      expect.objectContaining({ id: LEVEL_2_ACHIEVEMENT_ID })
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

    expect(ids.filter((id) => id === FIRST_MEAL_ACHIEVEMENT_ID)).toHaveLength(1);
    expect(ids.filter((id) => id === FIRST_WATER_ACHIEVEMENT_ID)).toHaveLength(1);
    expect(ids.filter((id) => id === FIRST_WEIGHT_ACHIEVEMENT_ID)).toHaveLength(1);
    expect(ids.filter((id) => id === ONBOARDING_ACHIEVEMENT_ID)).toHaveLength(1);
  });

  it("unlocks level 5 when a reward crosses that threshold", () => {
    const hydrated = companionReducer(
      undefined,
      hydrateCompanionState({
        level: 4,
        xp: 880,
        coins: 0,
        relationshipLevel: 1,
        achievements: [{ id: LEVEL_2_ACHIEVEMENT_ID, title: "Level 2" }],
        ownedItemIds: [],
        equippedItemIds: [],
        createdAt: UPDATED_AT,
        updatedAt: UPDATED_AT,
      })
    );
    const rewarded = companionReducer(hydrated, awardCompanionReward("goal_completed"));

    expect(rewarded.level).toBe(5);
    expect(rewarded.achievements).toContainEqual(
      expect.objectContaining({ id: LEVEL_5_ACHIEVEMENT_ID })
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
            unlockedAt: UPDATED_AT,
          },
        ],
        ownedItemIds: [DRAGON_ITEM_ID],
        equippedItemIds: [DRAGON_ITEM_ID],
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT,
      })
    );

    expect(state).toMatchObject({
      level: 3,
      xp: 260,
      coins: 12,
      relationshipLevel: 2,
      ownedItemIds: [DRAGON_ITEM_ID],
      equippedItemIds: [DRAGON_ITEM_ID],
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    });
    expect(state.achievements).toHaveLength(1);
  });

  it("drops equipped inventory items that are not owned during hydration", () => {
    const state = companionReducer(
      undefined,
      hydrateCompanionState({
        level: 1,
        xp: 0,
        coins: 0,
        relationshipLevel: 1,
        achievements: [],
        ownedItemIds: [],
        equippedItemIds: [DRAGON_ITEM_ID],
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT,
      })
    );

    expect(state.equippedItemIds).toEqual([]);
  });

  it("falls back safely when hydrated from a missing snapshot field", () => {
    const state = companionReducer(undefined, hydrateCompanionState(undefined));

    expect(state).toMatchObject({
      level: 1,
      xp: 0,
      coins: 0,
      achievements: [],
      ownedItemIds: [],
      equippedItemIds: [],
    });
  });

  it("purchases and equips companion items through persistent state", () => {
    const hydrated = companionReducer(
      undefined,
      hydrateCompanionState({
        level: 1,
        xp: 0,
        coins: 300,
        relationshipLevel: 1,
        achievements: [],
        ownedItemIds: [],
        equippedItemIds: [],
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT,
      })
    );
    const purchased = companionReducer(hydrated, purchaseCompanionItem(DRAGON_ITEM_ID));
    const equipped = companionReducer(purchased, equipCompanionItem(DRAGON_ITEM_ID));

    expect(purchased.coins).toBe(40);
    expect(purchased.ownedItemIds).toContain(DRAGON_ITEM_ID);
    expect(equipped.equippedItemIds).toContain(DRAGON_ITEM_ID);
  });

  it("does not purchase items when coins are insufficient", () => {
    const state = companionReducer(
      undefined,
      hydrateCompanionState({
        level: 1,
        xp: 0,
        coins: 5,
        relationshipLevel: 1,
        achievements: [],
        ownedItemIds: [],
        equippedItemIds: [],
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT,
      })
    );
    const nextState = companionReducer(state, purchaseCompanionItem(DRAGON_ITEM_ID));

    expect(nextState).toBe(state);
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
      ownedItemIds: [],
      equippedItemIds: [],
    });
  });
});
