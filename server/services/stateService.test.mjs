import { describe, expect, it, vi } from "vitest";
import { createStateService } from "./stateService.mjs";

describe("stateService", () => {
  it("persists water, fridge, and community when saving a full snapshot", () => {
    const stateRepository = {
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
    };
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
});
