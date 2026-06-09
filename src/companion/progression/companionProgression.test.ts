import { describe, expect, it } from "vitest";
import {
  applyCompanionReward,
  createInitialCompanionState,
  getCompanionLevelForXp,
  getNextLevelProgress,
} from "./companionProgression";

describe("companionProgression", () => {
  it("creates an initial level 1 state with zero xp", () => {
    const state = createInitialCompanionState("2026-06-08T10:00:00.000Z");

    expect(state).toMatchObject({
      level: 1,
      xp: 0,
      coins: 0,
      relationshipLevel: 1,
      achievements: [],
      ownedItemIds: [],
      equippedItemIds: [],
      createdAt: "2026-06-08T10:00:00.000Z",
      updatedAt: "2026-06-08T10:00:00.000Z",
    });
  });

  it("increases xp when a known reward is applied", () => {
    const state = createInitialCompanionState("2026-06-08T10:00:00.000Z");
    const nextState = applyCompanionReward(
      state,
      "meal_added",
      "2026-06-08T10:05:00.000Z"
    );

    expect(nextState.xp).toBe(10);
    expect(nextState.coins).toBe(2);
    expect(nextState.level).toBe(1);
    expect(nextState.updatedAt).toBe("2026-06-08T10:05:00.000Z");
  });

  it("changes level when a threshold is reached", () => {
    expect(getCompanionLevelForXp(0)).toBe(1);
    expect(getCompanionLevelForXp(100)).toBe(2);
    expect(getCompanionLevelForXp(250)).toBe(3);
    expect(getCompanionLevelForXp(4800)).toBe(10);
  });

  it("calculates progress to the next level", () => {
    expect(getNextLevelProgress(50)).toEqual({
      level: 1,
      currentXp: 50,
      nextLevelXp: 100,
      progress: 0.5,
    });

    expect(getNextLevelProgress(175)).toEqual({
      level: 2,
      currentXp: 175,
      nextLevelXp: 250,
      progress: 0.5,
    });
  });

  it("reports full progress at max level", () => {
    expect(getNextLevelProgress(5000)).toEqual({
      level: 10,
      currentXp: 5000,
      nextLevelXp: null,
      progress: 1,
    });
  });

  it("uses safe no-op behavior for unknown reward events", () => {
    const state = createInitialCompanionState("2026-06-08T10:00:00.000Z");
    const nextState = applyCompanionReward(
      state,
      "unknown_event",
      "2026-06-08T10:05:00.000Z"
    );

    expect(nextState).toBe(state);
  });
});
