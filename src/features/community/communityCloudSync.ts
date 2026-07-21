import type { AnyAction } from "@reduxjs/toolkit";
import type { AppDispatch } from "@app/store";
import {
  isCloudStateConflict,
  recoverLatestCloudSnapshotAfterConflict,
} from "@features/auth/cloudConflictRecovery";
import { syncRemoteCommunityState } from "@shared/api/auth";
import communityReducer, {
  replaceCommunityState,
  type CommunityState,
} from "./communitySlice";

type RemoteResult = Awaited<ReturnType<typeof syncRemoteCommunityState>>;
const MISSING_CANONICAL_COMMUNITY_ERROR =
  "Backend did not return canonical community state.";

export const buildCommunityStateAfterAction = (
  community: CommunityState,
  action: AnyAction
) => communityReducer(community, action);

const assertCloudSaved = async (
  dispatch: AppDispatch,
  result: RemoteResult
) => {
  if (result.ok) {
    return;
  }

  if (isCloudStateConflict(result)) {
    await recoverLatestCloudSnapshotAfterConflict(dispatch);
    throw new Error(
      "Cloud data changed on another device. The latest cloud version has been loaded; please repeat the community action."
    );
  }

  throw new Error(
    result.message || result.code || "Could not save community changes to cloud."
  );
};

const saveCommunityStateToCloud = async (
  dispatch: AppDispatch,
  nextCommunity: CommunityState
) => {
  const result = await syncRemoteCommunityState(nextCommunity);
  await assertCloudSaved(dispatch, result);

  if (!result.community) {
    throw new Error(MISSING_CANONICAL_COMMUNITY_ERROR);
  }

  const confirmedCommunity = result.community as CommunityState;
  dispatch(replaceCommunityState(confirmedCommunity));
  return confirmedCommunity;
};

export const applyCommunityActionInCloud = async (
  dispatch: AppDispatch,
  community: CommunityState,
  action: AnyAction
) =>
  saveCommunityStateToCloud(
    dispatch,
    buildCommunityStateAfterAction(community, action)
  );
