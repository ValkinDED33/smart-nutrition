import { describe, expect, it, vi } from "vitest";
import type { StorageLike } from "./remoteStateCache";
import { createRemoteStateCache } from "./remoteStateCache";

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
      profile: { calories: 2200 },
      meal: { items: [] },
      water: { consumedMl: 1200 },
      fridge: { items: [] },
      community: { posts: [] },
      updatedAt: "2026-04-03T10:00:00.000Z",
      profileUpdatedAt: "2026-04-03T09:58:00.000Z",
      mealUpdatedAt: "2026-04-03T10:00:00.000Z",
      lastWriterDeviceId: "device-a",
      backupEnabled: true,
    });

    expect(cache.readSnapshot()?.updatedAt).toBe("2026-04-03T10:00:00.000Z");
    expect(cache.readMeta()).toEqual({
      updatedAt: "2026-04-03T10:00:00.000Z",
      profileUpdatedAt: "2026-04-03T09:58:00.000Z",
      mealUpdatedAt: "2026-04-03T10:00:00.000Z",
      waterUpdatedAt: null,
      lastWriterDeviceId: "device-a",
      backupEnabled: true,
    });
  });

  it("expires fresh meta reads after TTL but still allows stale access", () => {
    vi.useFakeTimers();
    const cache = createRemoteStateCache(createMemoryStorage());

    cache.writeMeta({
      updatedAt: "2026-04-03T10:00:00.000Z",
      lastWriterDeviceId: "device-b",
    });

    vi.advanceTimersByTime(15_001);

    expect(cache.readMeta()).toBeNull();
    expect(cache.readMeta({ allowStale: true })).toEqual({
      updatedAt: "2026-04-03T10:00:00.000Z",
      lastWriterDeviceId: "device-b",
    });

    vi.useRealTimers();
  });

  it("clears both snapshot and meta", () => {
    const cache = createRemoteStateCache(createMemoryStorage());

    cache.writeSnapshot({
      profile: { calories: 2200 },
      meal: { items: [] },
      water: { consumedMl: 0 },
      fridge: { items: [] },
      community: { posts: [] },
      updatedAt: "2026-04-03T10:00:00.000Z",
    });

    cache.clear();

    expect(cache.readSnapshot()).toBeNull();
    expect(cache.readMeta({ allowStale: true })).toBeNull();
  });

  it("preserves cached companion state when an older snapshot omits companion", () => {
    const cache = createRemoteStateCache(createMemoryStorage());

    cache.writeSnapshot({
      profile: { calories: 2200 },
      meal: { items: [] },
      water: { consumedMl: 1200 },
      fridge: { items: [] },
      community: { posts: [] },
      companion: { xp: 150, level: 2 },
      updatedAt: "2026-04-03T10:00:00.000Z",
    });

    cache.writeSnapshot({
      profile: { calories: 2300 },
      meal: { items: [] },
      water: { consumedMl: 1400 },
      fridge: { items: [] },
      community: { posts: [] },
      updatedAt: "2026-04-03T11:00:00.000Z",
    });

    expect(cache.readSnapshot()?.companion).toEqual({ xp: 150, level: 2 });
    expect(cache.readSnapshot()?.profile).toEqual({ calories: 2300 });
  });
});
