import { describe, expect, it, vi } from "vitest";
import { createStateRepository } from "./stateRepository.mjs";

const createStorage = (overrides = {}) => ({
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
  ...overrides,
});

describe("stateRepository", () => {
  it("exposes atomic profile/user persistence only when storage supports it", async () => {
    const atomicStorage = createStorage({
      upsertUserProfileAndState: vi.fn(async () => ({
        user: { id: "user-1" },
        profile: { dailyCalories: 2100 },
      })),
    });

    const repository = createStateRepository(atomicStorage);

    expect(typeof repository.upsertUserProfileAndState).toBe("function");
    await expect(
      repository.upsertUserProfileAndState(
        "user-1",
        { dailyCalories: 2100 },
        { id: "user-1" },
        { baseVersion: "v1" }
      )
    ).resolves.toMatchObject({
      user: { id: "user-1" },
      profile: { dailyCalories: 2100 },
    });
    expect(atomicStorage.upsertUserProfileAndState).toHaveBeenCalledWith(
      "user-1",
      { dailyCalories: 2100 },
      { id: "user-1" },
      { baseVersion: "v1" }
    );
  });

  it("does not fake atomic profile/user persistence when storage lacks it", () => {
    const repository = createStateRepository(createStorage());

    expect(repository).not.toHaveProperty("upsertUserProfileAndState");
  });
});
