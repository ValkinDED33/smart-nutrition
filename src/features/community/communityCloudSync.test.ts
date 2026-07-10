import { describe, expect, it, vi } from "vitest";
import {
  addFriend,
  normalizeCommunityState,
  sendCommunityMessage,
} from "./communitySlice";
import {
  applyCommunityActionInCloud,
  buildCommunityStateAfterAction,
} from "./communityCloudSync";

const authApiMock = vi.hoisted(() => ({
  syncRemoteCommunityState: vi.fn(),
  pullRemoteAppSnapshot: vi.fn(),
}));

vi.mock("@shared/api/auth", () => authApiMock);

const COMMUNITY_MESSAGE_TEXT = "Cloud-first hello";
const COMMUNITY_AUTHOR_NAME = "Ihor";
const FRIEND_NAME = "Maks";

describe("communityCloudSync", () => {
  it("reuses the community reducer to build the next cloud state", () => {
    const current = normalizeCommunityState({});
    const next = buildCommunityStateAfterAction(
      current,
      sendCommunityMessage({ text: COMMUNITY_MESSAGE_TEXT, authorName: COMMUNITY_AUTHOR_NAME })
    );

    expect(next.roomMessages.at(-1)).toMatchObject({
      authorName: COMMUNITY_AUTHOR_NAME,
      text: COMMUNITY_MESSAGE_TEXT,
    });
    expect(current.roomMessages[0]?.text).not.toBe(COMMUNITY_MESSAGE_TEXT);
  });

  it("updates local community only after the cloud save succeeds", async () => {
    const dispatch = vi.fn();
    authApiMock.syncRemoteCommunityState.mockResolvedValueOnce({
      ok: true,
      meta: { updatedAt: "2026-07-01T08:00:00.000Z" },
    });

    await applyCommunityActionInCloud(
      dispatch as never,
      normalizeCommunityState({}),
      addFriend({ name: FRIEND_NAME })
    );

    expect(authApiMock.syncRemoteCommunityState).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      "community/replaceCommunityState",
    ]);
  });

  it("pulls the latest cloud snapshot instead of applying stale community state on conflict", async () => {
    const dispatch = vi.fn();
    authApiMock.syncRemoteCommunityState.mockResolvedValueOnce({
      ok: false,
      code: "STATE_CONFLICT",
      message: "conflict",
      meta: null,
    });
    authApiMock.pullRemoteAppSnapshot.mockResolvedValueOnce({
      profile: null,
      meal: null,
      water: null,
      fridge: null,
      community: normalizeCommunityState({}),
      companion: null,
      updatedAt: "2026-07-01T08:05:00.000Z",
      profileUpdatedAt: null,
      mealUpdatedAt: null,
      waterUpdatedAt: null,
    });

    await expect(
      applyCommunityActionInCloud(
        dispatch as never,
        normalizeCommunityState({}),
        addFriend({ name: FRIEND_NAME })
      )
    ).rejects.toThrow("latest cloud version has been loaded");

    expect(authApiMock.pullRemoteAppSnapshot).toHaveBeenCalledWith({ force: true });
    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      "auth/markSyncStarted",
      "community/replaceCommunityState",
      "companion/hydrateCompanionState",
      "auth/hydrateSyncOutbox",
      "auth/setCloudMeta",
      "auth/markSyncSuccess",
    ]);
  });
});
