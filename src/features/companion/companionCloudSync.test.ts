import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialCompanionState, getCompanionCatalogItemById } from "../../companion";
import { normalizeProfileState } from "@features/profile/profileSlice";
import {
  applyCompanionRewardInCloud,
  applyCompanionShopSelectionInCloud,
  buildCompanionRewardState,
  buildCompanionShopSelectionState,
} from "./companionCloudSync";

const authApiMock = vi.hoisted(() => ({
  syncRemoteAppSnapshot: vi.fn(),
  syncRemoteCompanionState: vi.fn(),
  pullRemoteAppSnapshot: vi.fn(),
}));

vi.mock("@shared/api/auth", () => authApiMock);

const CLOUD_DEVICE_ID = "device-1";
const CLOUD_CREATED_AT = "2026-07-01T08:00:00.000Z";
const SHOP_SYNCED_AT = "2026-07-01T08:10:00.000Z";
const REWARD_SYNCED_AT = "2026-07-01T08:12:00.000Z";
const PREMIUM_DRAGON_ITEM_ID = "dragon-premium";
const MEAL_ADDED_REWARD_EVENT = "meal_added";
const MARK_SYNC_STARTED_ACTION = "auth/markSyncStarted";

const createCompanionSnapshotState = () => ({
  auth: {
    cloudMeta: {
      updatedAt: CLOUD_CREATED_AT,
      deviceId: CLOUD_DEVICE_ID,
    },
  },
  profile: normalizeProfileState({}),
  meal: { items: [] },
  water: { consumedMl: 0 },
  fridge: { items: [] },
  community: { posts: [] },
  companion: {
    ...createInitialCompanionState(CLOUD_CREATED_AT),
    coins: 300,
  },
});

describe("companionCloudSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds one state change for companion purchase and assistant avatar", () => {
    const item = getCompanionCatalogItemById(PREMIUM_DRAGON_ITEM_ID);

    expect(item).not.toBeNull();

    const state = createCompanionSnapshotState();
    const result = buildCompanionShopSelectionState(state, item!);

    expect(result.changed).toBe(true);
    expect(result.companion.coins).toBe(40);
    expect(result.companion.ownedItemIds).toContain(PREMIUM_DRAGON_ITEM_ID);
    expect(result.companion.equippedItemIds).toContain(PREMIUM_DRAGON_ITEM_ID);
    expect(result.profile.assistant.companionKind).toBe("dragon");
    expect(state.companion.ownedItemIds).not.toContain(PREMIUM_DRAGON_ITEM_ID);
  });

  it("updates local companion and profile only after the cloud snapshot save succeeds", async () => {
    const dispatch = vi.fn();
    const item = getCompanionCatalogItemById(PREMIUM_DRAGON_ITEM_ID);
    const state = createCompanionSnapshotState();
    authApiMock.syncRemoteAppSnapshot.mockResolvedValueOnce({
      ok: true,
      meta: {
        updatedAt: SHOP_SYNCED_AT,
        deviceId: CLOUD_DEVICE_ID,
      },
    });

    await applyCompanionShopSelectionInCloud(dispatch, state, item!);

    expect(authApiMock.syncRemoteAppSnapshot).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      MARK_SYNC_STARTED_ACTION,
      "auth/hydrateSyncOutbox",
      "auth/setCloudMeta",
      "auth/markSyncSuccess",
      "companion/hydrateCompanionState",
      "profile/replaceProfileState",
    ]);
  });

  it("builds reward state without mutating the current companion state", () => {
    const state = createCompanionSnapshotState();
    const nextCompanion = buildCompanionRewardState(state, MEAL_ADDED_REWARD_EVENT);

    expect(nextCompanion.xp).toBeGreaterThan(state.companion.xp);
    expect(state.companion.xp).toBe(0);
  });

  it("updates local companion reward only after the cloud snapshot save succeeds", async () => {
    const dispatch = vi.fn();
    const state = createCompanionSnapshotState();
    authApiMock.syncRemoteCompanionState.mockResolvedValueOnce({
      ok: true,
      meta: {
        updatedAt: REWARD_SYNCED_AT,
        deviceId: CLOUD_DEVICE_ID,
      },
    });

    await applyCompanionRewardInCloud(dispatch, state, MEAL_ADDED_REWARD_EVENT);

    expect(authApiMock.syncRemoteCompanionState).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      MARK_SYNC_STARTED_ACTION,
      "auth/hydrateSyncOutbox",
      "auth/setCloudMeta",
      "auth/markSyncSuccess",
      "companion/hydrateCompanionState",
    ]);
  });

  it("does not update local companion reward when the cloud snapshot save fails", async () => {
    const dispatch = vi.fn();
    const state = createCompanionSnapshotState();
    authApiMock.syncRemoteCompanionState.mockResolvedValueOnce({
      ok: false,
      code: "SYNC_FAILED",
      message: "reward failed",
    });

    await expect(
      applyCompanionRewardInCloud(dispatch, state, MEAL_ADDED_REWARD_EVENT)
    ).rejects.toThrow("reward failed");

    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      MARK_SYNC_STARTED_ACTION,
      "auth/markSyncError",
    ]);
  });

  it("does not update local companion or profile when the cloud save fails", async () => {
    const dispatch = vi.fn();
    const item = getCompanionCatalogItemById(PREMIUM_DRAGON_ITEM_ID);
    const state = createCompanionSnapshotState();
    authApiMock.syncRemoteAppSnapshot.mockResolvedValueOnce({
      ok: false,
      code: "SYNC_FAILED",
      message: "snapshot failed",
    });

    await expect(
      applyCompanionShopSelectionInCloud(dispatch, state, item!)
    ).rejects.toThrow("snapshot failed");

    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      MARK_SYNC_STARTED_ACTION,
      "auth/markSyncError",
    ]);
  });
});
