import type { AnyAction } from "@reduxjs/toolkit";
import { getSnapshotMetaFromSnapshot } from "@domain/appSnapshot";
import { replaceCommunityState } from "@features/community/communitySlice";
import { hydrateCompanionState } from "@features/companion/model/store";
import { replaceFridgeState } from "@features/fridge/fridgeSlice";
import { replaceMealState } from "@features/meal/mealSlice";
import { replaceProfileState } from "@features/profile/profileSlice";
import { replaceWaterState } from "@features/water/waterSlice";
import type { AppSnapshot } from "@shared/types/appSnapshot";

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
