import { describe, expect, it, vi } from "vitest";
import type { StorageLike } from "./remoteStateCache";
import { createRemoteStateCache } from "./remoteStateCache";

const SNAPSHOT_UPDATED_AT = "2026-04-03T10:00:00.000Z";
const PROFILE_UPDATED_AT = "2026-04-03T09:58:00.000Z";
const DEVICE_A_ID = "device-a";
const SAMPLE_PROFILE_CALORIES = 2200;

const createEmptyItemsState = () => ({ items: [] });

const createMemoryStorage = (): StorageLike => {
  const state = new Map<string, string>();

  return {
    getItem: (key) => state.get(key) ?? null,
    setItem: (key, value) => {
      state.set(key, value);
    },
    removeItem: (key) => {
      state.delete(key);
    },
  };
};

describe("remoteStateCache", () => {
  it("stores snapshot and mirrors its meta", () => {
    const cache = createRemoteStateCache(createMemoryStorage());

    cache.writeSnapshot({
      profile: { calories: SAMPLE_PROFILE_CALORIES },
      meal: createEmptyItemsState(),
      water: { consumedMl: 1200 },
      fridge: createEmptyItemsState(),
      community: { posts: [] },
      updatedAt: SNAPSHOT_UPDATED_AT,
      profileUpdatedAt: PROFILE_UPDATED_AT,
      mealUpdatedAt: SNAPSHOT_UPDATED_AT,
      lastWriterDeviceId: DEVICE_A_ID,
      backupEnabled: true,
    });

    expect(cache.readSnapshot()?.updatedAt).toBe(SNAPSHOT_UPDATED_AT);
    expect(cache.readMeta()).toEqual({
      updatedAt: SNAPSHOT_UPDATED_AT,
      profileUpdatedAt: PROFILE_UPDATED_AT,
      mealUpdatedAt: SNAPSHOT_UPDATED_AT,
      waterUpdatedAt: null,
      communityUpdatedAt: null,
      lastWriterDeviceId: DEVICE_A_ID,
      backupEnabled: true,
    });
  });

  it("expires fresh meta reads after TTL but still allows stale access", () => {
    vi.useFakeTimers();
    const cache = createRemoteStateCache(createMemoryStorage());

    cache.writeMeta({
      updatedAt: SNAPSHOT_UPDATED_AT,
      lastWriterDeviceId: "device-b",
    });

    vi.advanceTimersByTime(15_001);

    expect(cache.readMeta()).toBeNull();
    expect(cache.readMeta({ allowStale: true })).toEqual({
      updatedAt: SNAPSHOT_UPDATED_AT,
      lastWriterDeviceId: "device-b",
    });

    vi.useRealTimers();
  });

  it("clears both snapshot and meta", () => {
    const cache = createRemoteStateCache(createMemoryStorage());

    cache.writeSnapshot({
      profile: { calories: SAMPLE_PROFILE_CALORIES },
      meal: createEmptyItemsState(),
      water: { consumedMl: 0 },
      fridge: createEmptyItemsState(),
      community: { posts: [] },
      updatedAt: SNAPSHOT_UPDATED_AT,
    });

    cache.clear();

    expect(cache.readSnapshot()).toBeNull();
    expect(cache.readMeta({ allowStale: true })).toBeNull();
  });

  it("preserves cached companion state when an older snapshot omits companion", () => {
    const cache = createRemoteStateCache(createMemoryStorage());

    cache.writeSnapshot({
      profile: { calories: SAMPLE_PROFILE_CALORIES },
      meal: createEmptyItemsState(),
      water: { consumedMl: 1200 },
      fridge: createEmptyItemsState(),
      community: { posts: [] },
      companion: { xp: 150, level: 2 },
      updatedAt: SNAPSHOT_UPDATED_AT,
    });

    cache.writeSnapshot({
      profile: { calories: 2300 },
      meal: createEmptyItemsState(),
      water: { consumedMl: 1400 },
      fridge: createEmptyItemsState(),
      community: { posts: [] },
      updatedAt: "2026-04-03T11:00:00.000Z",
    });

    expect(cache.readSnapshot()?.companion).toEqual({ xp: 150, level: 2 });
    expect(cache.readSnapshot()?.profile).toEqual({ calories: 2300 });
  });
});
