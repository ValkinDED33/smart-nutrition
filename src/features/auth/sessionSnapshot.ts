import type { AnyAction } from "@reduxjs/toolkit";
import { getSnapshotMetaFromSnapshot } from "@domain/appSnapshot";
import { replaceCommunityState } from "@features/community/communitySlice";
import { hydrateCompanionState } from "@features/companion/model/store";
import { replaceFridgeState } from "@features/fridge/fridgeSlice";
import { replaceMealState } from "@features/meal/mealSlice";
import { replaceProfileState } from "@features/profile/profileSlice";
import { replaceWaterState } from "@features/water/waterSlice";
import type { AppSnapshot } from "@shared/types/appSnapshot";
import {
  resolveCloudSnapshotHydration,
  type CloudSnapshotHydrationDecision,
} from "@shared/lib/sessionSnapshot";
import {
  clearSyncOutbox,
  getSyncOutboxMeta,
  type SyncOutboxMeta,
} from "@shared/lib/syncOutbox";

type SnapshotDispatch = (action: AnyAction) => unknown;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const hasSnapshotSlice = (value: unknown) => value !== null && value !== undefined;

export const hasCompletedOnboardingSnapshot = (snapshot?: AppSnapshot | null) => {
  if (!isRecord(snapshot?.profile)) {
    return false;
  }

  const { assistant } = snapshot.profile;

  if (!isRecord(assistant) || !isRecord(assistant.onboarding)) {
    return false;
  }

  return (
    typeof assistant.onboarding.completedAt === "string" &&
    assistant.onboarding.completedAt.trim().length > 0
  );
};

export const getRemoteSnapshotMeta = (snapshot?: AppSnapshot | null) =>
  getSnapshotMetaFromSnapshot(snapshot ?? null);

export const applyRemoteSnapshotToStore = (
  dispatch: SnapshotDispatch,
  snapshot?: AppSnapshot | null
) => {
  if (!snapshot) {
    return false;
  }

  let applied = false;

  if (hasSnapshotSlice(snapshot.profile)) {
    dispatch(replaceProfileState(snapshot.profile));
    applied = true;
  }

  if (hasSnapshotSlice(snapshot.meal)) {
    dispatch(replaceMealState(snapshot.meal));
    applied = true;
  }

  if (hasSnapshotSlice(snapshot.water)) {
    dispatch(replaceWaterState(snapshot.water));
    applied = true;
  }

  if (hasSnapshotSlice(snapshot.fridge)) {
    dispatch(replaceFridgeState(snapshot.fridge));
    applied = true;
  }

  if (hasSnapshotSlice(snapshot.community)) {
    dispatch(replaceCommunityState(snapshot.community));
    applied = true;
  }

  if ("companion" in snapshot) {
    dispatch(hydrateCompanionState(snapshot.companion));
    applied = true;
  }

  return applied;
};

export const applyRemoteSnapshotWithSyncPolicy = (
  dispatch: SnapshotDispatch,
  snapshot?: AppSnapshot | null,
  syncOutbox: SyncOutboxMeta = getSyncOutboxMeta()
): {
  applied: boolean;
  cloudMeta: ReturnType<typeof getRemoteSnapshotMeta>;
  decision: CloudSnapshotHydrationDecision | null;
  syncOutbox: SyncOutboxMeta;
  useSnapshotForSessionBootstrap: boolean;
} => {
  const cloudMeta = getRemoteSnapshotMeta(snapshot);
  const decision = snapshot
    ? resolveCloudSnapshotHydration({
        cloudUpdatedAt: cloudMeta?.updatedAt ?? snapshot.updatedAt,
        syncOutbox,
      })
    : null;
  const resolvedSyncOutbox =
    decision?.shouldDiscardOutbox === true ? clearSyncOutbox() : syncOutbox;
  const applied =
    snapshot && decision?.shouldApplyCloudSnapshot
      ? applyRemoteSnapshotToStore(dispatch, snapshot)
      : false;

  return {
    applied,
    cloudMeta,
    decision,
    syncOutbox: resolvedSyncOutbox,
    useSnapshotForSessionBootstrap: Boolean(
      snapshot && decision?.shouldApplyCloudSnapshot
    ),
  };
};
