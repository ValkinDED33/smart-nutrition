import { describe, expect, it, vi } from "vitest";
import { createStateService } from "./stateService.mjs";

const createStateRepositoryFixture = () => ({
  getSnapshotByUserId: vi.fn(),
  getSnapshotMetaByUserId: vi.fn(),
  upsertSnapshot: vi.fn(),
  getProfileStateByUserId: vi.fn(),
  upsertProfileState: vi.fn(),
  getMealStateByUserId: vi.fn(),
  upsertMealState: vi.fn(),
  getWaterStateByUserId: vi.fn(),
  upsertWaterState: vi.fn(),
  getFridgeStateByUserId: vi.fn(),
  upsertFridgeState: vi.fn(),
  getCommunityStateByUserId: vi.fn(),
  upsertCommunityState: vi.fn(),
  getCompanionStateByUserId: vi.fn(),
  upsertCompanionState: vi.fn(),
  addMealEntries: vi.fn(),
  removeMealEntry: vi.fn(),
  addMealTemplate: vi.fn(),
  deleteMealTemplate: vi.fn(),
  upsertMealProduct: vi.fn(),
  removeMealProduct: vi.fn(),
});

describe("stateService", () => {
  it("persists water, fridge, community, and companion when saving a full snapshot", async () => {
    const stateRepository = createStateRepositoryFixture();
    const service = createStateService({ stateRepository });
    const user = { id: "user-1" };
    const snapshot = {
      profile: { dailyCalories: 2100 },
      meal: { items: [] },
      water: { consumedMl: 1250, dailyWaterGoal: 2300 },
      fridge: { items: [{ id: "fridge-1" }] },
      community: { score: 180, posts: [{ id: "post-1" }] },
      companion: { level: 2, xp: 130, coins: 12, achievements: [] },
    };

    await service.saveSnapshot(user, snapshot);

    expect(stateRepository.upsertSnapshot).toHaveBeenCalledTimes(1);
    expect(stateRepository.upsertSnapshot).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({
        profile: snapshot.profile,
        meal: snapshot.meal,
        water: snapshot.water,
        fridge: snapshot.fridge,
        community: snapshot.community,
        companion: snapshot.companion,
      }),
      undefined
    );
  });

  it("rejects incomplete full snapshots instead of normalizing them into empty state", async () => {
    const stateRepository = createStateRepositoryFixture();
    const service = createStateService({ stateRepository });

    await expect(
      service.saveSnapshot(
        { id: "user-1" },
        {
          profile: { dailyCalories: 2100 },
          meal: { items: [] },
          water: { consumedMl: 0 },
          fridge: { items: [] },
          community: { score: 0 },
        }
      )
    ).rejects.toThrow(/Companion state payload is required/);
    expect(stateRepository.upsertSnapshot).not.toHaveBeenCalled();
  });

  it("rejects invalid granular profile and meal payloads", async () => {
    const stateRepository = createStateRepositoryFixture();
    const service = createStateService({ stateRepository });
    const user = { id: "user-1" };

    await expect(service.saveProfileState(user, null)).rejects.toThrow(/Profile state/);
    await expect(service.saveMealState(user, [])).rejects.toThrow(/Meal state/);
    await expect(service.saveCompanionState(user, null)).rejects.toThrow(/Companion state/);
    expect(stateRepository.upsertProfileState).not.toHaveBeenCalled();
    expect(stateRepository.upsertMealState).not.toHaveBeenCalled();
    expect(stateRepository.upsertCompanionState).not.toHaveBeenCalled();
  });
});
