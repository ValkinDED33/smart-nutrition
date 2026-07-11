import { describe, expect, it } from "vitest";
import { createInitialCompanionState } from "../../companion";
import { buildCompanionProgressCardModel } from "./companionProgressCardModel";

const COMPANION_CREATED_AT = "2026-06-08T00:00:00.000Z";

describe("buildCompanionProgressCardModel", () => {
  it("uses an initial state fallback when companion state is missing", () => {
    const model = buildCompanionProgressCardModel(null);

    expect(model.level).toBe(1);
    expect(model.xp).toBe(0);
    expect(model.coins).toBe(0);
    expect(model.relationshipLevel).toBe(1);
    expect(model.progressPercent).toBe(0);
    expect(model.evolutionStage).toBe("spark");
    expect(model.bondPercent).toBe(10);
    expect(model.nextRitual).toBe("complete_onboarding");
  });

  it("calculates progress to the next level", () => {
    const state = {
      ...createInitialCompanionState(COMPANION_CREATED_AT),
      xp: 120,
      coins: 7,
      relationshipLevel: 3,
    };
    const model = buildCompanionProgressCardModel(state);

    expect(model.level).toBe(2);
    expect(model.nextLevelXp).toBe(250);
    expect(model.xpToNextLevel).toBe(130);
    expect(model.progressPercent).toBe(13);
    expect(model.coins).toBe(7);
    expect(model.relationshipLevel).toBe(3);
    expect(model.evolutionStage).toBe("aware");
    expect(model.bondPercent).toBe(30);
    expect(model.nextRitual).toBe("complete_onboarding");
  });

  it("derives trusted and deep evolution stages from real companion progress", () => {
    const trustedState = {
      ...createInitialCompanionState(COMPANION_CREATED_AT),
      xp: 900,
      relationshipLevel: 5,
      achievements: [
        {
          id: "first-meal",
          title: "First meal",
          unlockedAt: COMPANION_CREATED_AT,
        },
      ],
    };
    const deepState = {
      ...trustedState,
      xp: 2800,
      relationshipLevel: 8,
    };

    expect(buildCompanionProgressCardModel(trustedState)).toMatchObject({
      evolutionStage: "trusted",
      nextRitual: "keep_rhythm",
    });
    expect(buildCompanionProgressCardModel(deepState)).toMatchObject({
      evolutionStage: "deep",
      bondPercent: 80,
    });
  });

  it("returns the latest achievements first", () => {
    const state = {
      ...createInitialCompanionState(COMPANION_CREATED_AT),
      achievements: [
        {
          id: "first",
          title: "First",
          unlockedAt: "2026-06-01T00:00:00.000Z",
        },
        {
          id: "latest",
          title: "Latest",
          unlockedAt: COMPANION_CREATED_AT,
        },
      ],
    };
    const model = buildCompanionProgressCardModel(state);

    expect(model.recentAchievements.map((achievement) => achievement.id)).toEqual([
      "latest",
      "first",
    ]);
  });
});
