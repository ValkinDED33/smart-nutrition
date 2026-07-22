import type { AnyAction } from "@reduxjs/toolkit";
import { buildAppSnapshot } from "@domain/appSnapshot";
import type { AppSnapshotMeta } from "@shared/types/appSnapshot";
import { syncRemoteAppSnapshot, syncRemoteCompanionState } from "@shared/api/auth";
import { resolveCloudSyncFailureMessage } from "@shared/lib/cloudSyncErrors";
import { clearSyncOutbox } from "@shared/lib/syncOutbox";
import {
  hydrateSyncOutbox,
  markSyncError,
  markSyncStarted,
  markSyncSuccess,
  setCloudMeta,
} from "@features/auth/authSlice";
import {
  isCloudStateConflict,
  recoverLatestCloudSnapshotAfterConflict,
} from "@features/auth/cloudConflictRecovery";
import companionReducer, {
  awardCompanionReward,
  equipCompanionItem,
  hydrateCompanionState,
  purchaseCompanionItem,
} from "./model/store";
import type {
  CompanionCatalogItem,
  CompanionRewardEvent,
  CompanionState,
} from "../../companion";
import {
  hasCompanionItem,
  isCompanionItemEquipped,
} from "../../companion";
import profileReducer, {
  replaceProfileState,
  setAssistantCustomization,
  type ProfileState,
} from "@features/profile/profileSlice";

type CompanionCloudDispatch = (action: AnyAction) => unknown;

export type CompanionSnapshotState = {
  auth: {
    cloudMeta: AppSnapshotMeta | null;
  };
  profile: ProfileState;
  meal: unknown;
  water: unknown;
  fridge: unknown;
  community: unknown;
  companion: CompanionState;
};

const getCompanionSyncErrorMessage = (result: {
  message?: string;
  code?: string;
}) =>
  resolveCloudSyncFailureMessage({
    code: result.code,
    message: result.message,
    conflictMessage:
      "Cloud data changed on another device. Pull the latest cloud version before saving again.",
    fallbackMessage: "Cloud sync could not save the latest companion data.",
  });

const buildCompanionStateAfterAction = (
  companion: CompanionState,
  action: AnyAction
) => companionReducer(companion, action);

const buildProfileStateAfterAction = (
  profile: ProfileState,
  action: AnyAction
) => profileReducer(profile, action);

export const buildCompanionShopSelectionState = (
  state: Pick<CompanionSnapshotState, "profile" | "companion">,
  item: CompanionCatalogItem
) => {
  const isOwned = hasCompanionItem(state.companion, item.id);
  let nextCompanion = state.companion;

  if (!item.available || isCompanionItemEquipped(state.companion, item.id)) {
    return {
      changed: false,
      companion: state.companion,
      profile: state.profile,
    };
  }

  if (!isOwned) {
    nextCompanion = buildCompanionStateAfterAction(
      nextCompanion,
      purchaseCompanionItem(item.id)
    );

    if (!hasCompanionItem(nextCompanion, item.id)) {
      return {
        changed: false,
        companion: state.companion,
        profile: state.profile,
      };
    }
  }

  nextCompanion = buildCompanionStateAfterAction(
    nextCompanion,
    equipCompanionItem(item.id)
  );

  const nextProfile = item.companionKind
    ? buildProfileStateAfterAction(
        state.profile,
        setAssistantCustomization({
          companionKind: item.companionKind,
          assistantAvatar: item.companionKind,
        })
      )
    : state.profile;

  return {
    changed:
      nextCompanion !== state.companion || nextProfile !== state.profile,
    companion: nextCompanion,
    profile: nextProfile,
  };
};

export const buildCompanionRewardState = (
  state: Pick<CompanionSnapshotState, "companion">,
  event: CompanionRewardEvent
) => buildCompanionStateAfterAction(state.companion, awardCompanionReward(event));

const saveCompanionSnapshotToCloud = async (
  dispatch: CompanionCloudDispatch,
  state: CompanionSnapshotState,
  confirmedAt = new Date().toISOString()
) => {
  dispatch(markSyncStarted());

  const snapshot = buildAppSnapshot({
    profile: state.profile,
    meal: state.meal,
    water: state.water,
    fridge: state.fridge,
    community: state.community,
    companion: state.companion,
    meta: state.auth.cloudMeta,
  });
  const result = await syncRemoteAppSnapshot(snapshot);

  if (!result.ok) {
    if (isCloudStateConflict(result)) {
      await recoverLatestCloudSnapshotAfterConflict(dispatch);
      throw new Error(
        "Cloud data changed on another device. The latest cloud version has been loaded; please apply your companion change again."
      );
    }

    const message = getCompanionSyncErrorMessage(result);
    dispatch(markSyncError(message));
    throw new Error(message);
  }

  dispatch(hydrateSyncOutbox(clearSyncOutbox()));
  dispatch(setCloudMeta(result.meta ?? null));
  dispatch(markSyncSuccess(result.meta?.updatedAt ?? confirmedAt));

  return result;
};

const saveCompanionStateToCloud = async (
  dispatch: CompanionCloudDispatch,
  companion: CompanionState,
  confirmedAt = new Date().toISOString()
) => {
  dispatch(markSyncStarted());
  const result = await syncRemoteCompanionState(companion);

  if (!result.ok) {
    if (isCloudStateConflict(result)) {
      await recoverLatestCloudSnapshotAfterConflict(dispatch);
      throw new Error(
        "Cloud data changed on another device. The latest cloud version has been loaded; please apply your companion change again."
      );
    }

    const message = getCompanionSyncErrorMessage(result);
    dispatch(markSyncError(message));
    throw new Error(message);
  }

  dispatch(hydrateSyncOutbox(clearSyncOutbox()));
  dispatch(setCloudMeta(result.meta ?? null));
  dispatch(markSyncSuccess(result.meta?.updatedAt ?? confirmedAt));

  return result;
};

export const applyCompanionShopSelectionInCloud = async (
  dispatch: CompanionCloudDispatch,
  state: CompanionSnapshotState,
  item: CompanionCatalogItem,
  confirmedAt = new Date().toISOString()
) => {
  const nextState = buildCompanionShopSelectionState(state, item);

  if (!nextState.changed) {
    return nextState;
  }

  await saveCompanionSnapshotToCloud(
    dispatch,
    {
      ...state,
      companion: nextState.companion,
      profile: nextState.profile,
    },
    confirmedAt
  );
  dispatch(hydrateCompanionState(nextState.companion));
  dispatch(replaceProfileState(nextState.profile));

  return nextState;
};

export const applyCompanionRewardInCloud = async (
  dispatch: CompanionCloudDispatch,
  state: Pick<CompanionSnapshotState, "companion">,
  event: CompanionRewardEvent,
  confirmedAt = new Date().toISOString()
) => {
  const nextCompanion = buildCompanionRewardState(state, event);

  await saveCompanionStateToCloud(dispatch, nextCompanion, confirmedAt);
  dispatch(hydrateCompanionState(nextCompanion));

  return nextCompanion;
};
