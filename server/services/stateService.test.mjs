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
  addMealEntries: vi.fn(),
  removeMealEntry: vi.fn(),
  addMealTemplate: vi.fn(),
  deleteMealTemplate: vi.fn(),
  upsertMealProduct: vi.fn(),
  removeMealProduct: vi.fn(),
});

describe("stateService", () => {
  it("persists water, fridge, and community when saving a full snapshot", () => {
    const stateRepository = createStateRepositoryFixture();
    const service = createStateService({ stateRepository });
    const user = { id: "user-1" };
    const snapshot = {
      profile: { dailyCalories: 2100 },
      meal: { items: [] },
      water: { consumedMl: 1250, dailyTargetMl: 2300 },
      fridge: { items: [{ id: "fridge-1" }] },
      community: { score: 180, posts: [{ id: "post-1" }] },
    };

    service.saveSnapshot(user, snapshot);

    expect(stateRepository.upsertSnapshot).toHaveBeenCalledTimes(1);
    expect(stateRepository.upsertSnapshot).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({
        profile: snapshot.profile,
        meal: snapshot.meal,
        water: snapshot.water,
        fridge: snapshot.fridge,
        community: snapshot.community,
      }),
      undefined
    );
  });

  it("rejects incomplete full snapshots instead of normalizing them into empty state", () => {
    const stateRepository = createStateRepositoryFixture();
    const service = createStateService({ stateRepository });

    expect(() =>
      service.saveSnapshot(
        { id: "user-1" },
        {
          profile: { dailyCalories: 2100 },
          meal: { items: [] },
        }
      )
    ).toThrow(/Water state payload is required/);
    expect(stateRepository.upsertSnapshot).not.toHaveBeenCalled();
  });

  it("rejects invalid granular profile and meal payloads", () => {
    const stateRepository = createStateRepositoryFixture();
    const service = createStateService({ stateRepository });
    const user = { id: "user-1" };

    expect(() => service.saveProfileState(user, null)).toThrow(/Profile state/);
    expect(() => service.saveMealState(user, [])).toThrow(/Meal state/);
    expect(stateRepository.upsertProfileState).not.toHaveBeenCalled();
    expect(stateRepository.upsertMealState).not.toHaveBeenCalled();
  });
});
