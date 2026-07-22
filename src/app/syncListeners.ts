import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import {
  createRemoteMealEntries,
  createRemoteMealTemplate,
  deleteRemoteMealEntry,
  deleteRemoteMealProduct,
  deleteRemoteMealTemplate,
  isCloudSyncActive,
  syncRemoteCommunityState,
  syncRemoteCompanionState,
  syncRemoteFridgeState,
  type RemoteSyncResult,
  saveRemoteMealProduct,
  syncRemoteMealState,
  syncRemoteProfileState,
  syncRemoteWaterState,
} from "../shared/api/auth";
import { resolveCloudSyncFailureMessage } from "../shared/lib/cloudSyncErrors";
import type { AppSnapshotMeta } from "../shared/types/appSnapshot";
import {
  hydrateSyncOutbox,
  setCloudMeta,
  markSyncError,
  markSyncStarted,
  markSyncSuccess,
} from "../features/auth/authSlice";
import {
  addFriend,
  commentCommunityPost,
  likeCommunityPost,
  likeProgressCard,
  publishCommunityPost,
  publishProgressCard,
  reportCommunityContent,
  reviewCommunityPost,
  deleteCommunityCommentAsModerator,
  deleteCommunityPostAsSpam,
  mergeCommunityPosts,
  sendCommunityMessage,
  sendDirectMessage,
  toggleFavoritePost,
} from "../features/community/communitySlice";
import {
  removeFridgeItem,
  updateFridgeItemQuantity,
  upsertFridgeItem,
} from "../features/fridge/fridgeSlice";
import {
  addMealEntries,
  addProduct,
  applyMealTemplate,
  clearMeal,
  deleteMealTemplate,
  removeProduct,
  rememberRecentProduct,
  removeSavedProduct,
  saveMealTemplate,
  saveProduct,
  updateMealEntry,
  type MealState,
} from "../features/meal/mealSlice";
import {
  applyProfileTargets,
  activatePremiumPlan,
  addProgressPhoto,
  cancelPremiumSubscription,
  setAdaptiveCalories,
  setDailyCalories,
  setGoal,
  setMaintenanceCalories,
  recordMeasurementCheckIn,
  removeProgressPhoto,
  setAssistantCustomization,
  setProfileLanguage,
  updateNotificationPreferences,
  updatePersonalDetails,
  updateWomenHealth,
  updateWeight,
  startPremiumTrial,
  type ProfileState,
} from "../features/profile/profileSlice";
import {
  incrementWater,
  resetWaterTracker,
  setWaterConsumed,
  setWaterGlassSize,
  setWaterReminders,
  setWaterTarget,
  syncWaterTargetFromWeight,
  type WaterState,
} from "../features/water/waterSlice";
import {
  awardCompanionReward,
  equipCompanionItem,
  purchaseCompanionItem,
  resetCompanionState,
  unlockCompanionAchievement,
} from "../features/companion/model/store";
import { clearSyncOutbox, enqueueSyncOutbox } from "../shared/lib/syncOutbox";
import type { CompanionState } from "../companion";
import {
  calculateAdaptiveCalorieTarget,
  calculateAverageDailyCalories,
} from "@domain/profile/adaptiveGoal";
import { buildAppSnapshot } from "@domain/appSnapshot";
import { writeCachedRemoteSnapshot } from "../shared/lib/remoteStateCache";

type SyncState = {
  auth: {
    cloudMeta: AppSnapshotMeta | null;
  };
  profile: ProfileState;
  meal: MealState;
  water: WaterState;
  fridge: unknown;
  community: unknown;
  companion: CompanionState;
};

const getStateSnapshot = (state: unknown) => state as SyncState;

type RemoteSyncListenerApi = Parameters<
  typeof remoteSyncListenerMiddleware.startListening
>[0]["effect"] extends (
  action: infer _Action,
  api: infer Api
) => unknown
  ? Api
  : never;

type CloudSyncTask = (state: SyncState) => Promise<RemoteSyncResult>;

const syncWholeMealState = async (state: SyncState) => {
  return syncRemoteMealState(state.meal);
};

const writeCachedSnapshotFromState = (
  state: SyncState,
  meta: AppSnapshotMeta | null | undefined
) => {
  writeCachedRemoteSnapshot(
    buildAppSnapshot({
      profile: state.profile,
      meal: state.meal,
      water: state.water,
      fridge: state.fridge,
      community: state.community,
      companion: state.companion,
      meta,
    })
  );
};

const maybeApplyAutomaticAdaptiveTarget = (
  listenerApi: RemoteSyncListenerApi
) => {
  const state = getStateSnapshot(listenerApi.getState());

  if (state.profile.adaptiveMode !== "automatic" || state.profile.maintenanceCalories <= 0) {
    return;
  }

  const averageIntake = calculateAverageDailyCalories(state.meal.items);
  const firstWeight = state.profile.weightHistory[0]?.weight ?? 0;
  const lastWeight = state.profile.weightHistory.at(-1)?.weight ?? 0;
  const suggestedCalories = calculateAdaptiveCalorieTarget({
    maintenanceCalories: state.profile.maintenanceCalories,
    goal: state.profile.goal,
    averageIntake,
    weightChange: lastWeight - firstWeight,
  });
  const currentTarget = state.profile.adaptiveCalories ?? state.profile.dailyCalories;

  if (Math.abs(suggestedCalories - currentTarget) >= 25) {
    listenerApi.dispatch(setAdaptiveCalories(suggestedCalories));
  }
};

export const remoteSyncListenerMiddleware = createListenerMiddleware();
let listenersRegistered = false;

const SYNC_ERROR_MESSAGE = "Cloud sync could not save the latest change.";
const WATER_SYNC_DEBOUNCE_MS = 250;
let cloudSyncQueue: Promise<void> = Promise.resolve();

const getRemoteSyncErrorMessage = (result: RemoteSyncResult) =>
  resolveCloudSyncFailureMessage({
    code: result.code,
    message: result.message,
    conflictMessage:
      "Cloud data changed on another device. Use the latest cloud version before retrying.",
    fallbackMessage: SYNC_ERROR_MESSAGE,
  });

const runCloudSync = async (
  listenerApi: RemoteSyncListenerApi,
  task: CloudSyncTask
) => {
  const execute = async () => {
    listenerApi.dispatch(markSyncStarted());

    try {
      const stateBeforeSync = getStateSnapshot(listenerApi.getState());
      const result = await task(stateBeforeSync);

      if (result.ok) {
        const stateAfterSync = getStateSnapshot(listenerApi.getState());
        const clearedOutbox = clearSyncOutbox();
        writeCachedSnapshotFromState(stateAfterSync, result.meta);
        listenerApi.dispatch(hydrateSyncOutbox(clearedOutbox));
        listenerApi.dispatch(setCloudMeta(result.meta ?? null));
        listenerApi.dispatch(markSyncSuccess(result.meta?.updatedAt ?? undefined));
        return;
      }

      const nextOutbox = enqueueSyncOutbox(getRemoteSyncErrorMessage(result));
      listenerApi.dispatch(hydrateSyncOutbox(nextOutbox));
      listenerApi.dispatch(setCloudMeta(result.meta ?? null));
      listenerApi.dispatch(markSyncError(nextOutbox.lastError ?? getRemoteSyncErrorMessage(result)));
    } catch (error) {
      void error;
      const nextOutbox = enqueueSyncOutbox(SYNC_ERROR_MESSAGE);
      listenerApi.dispatch(hydrateSyncOutbox(nextOutbox));
      listenerApi.dispatch(markSyncError(nextOutbox.lastError ?? SYNC_ERROR_MESSAGE));
    }
  };

  const queuedSync = cloudSyncQueue.catch(() => undefined).then(execute);
  cloudSyncQueue = queuedSync.catch(() => undefined);
  await queuedSync;
};

export const registerRemoteSyncListeners = () => {
  if (listenersRegistered) {
    return;
  }

  listenersRegistered = true;

  remoteSyncListenerMiddleware.startListening({
    matcher: isAnyOf(
      awardCompanionReward,
      unlockCompanionAchievement,
      purchaseCompanionItem,
      equipCompanionItem,
      resetCompanionState
    ),
    effect: async (_, listenerApi) => {
      const state = getStateSnapshot(listenerApi.getState());
      writeCachedSnapshotFromState(state, state.auth.cloudMeta);

      if (!isCloudSyncActive()) {
        return;
      }

      await runCloudSync(listenerApi, (nextState) =>
        syncRemoteCompanionState(nextState.companion)
      );
    },
  });

  remoteSyncListenerMiddleware.startListening({
    matcher: isAnyOf(
      setDailyCalories,
      setMaintenanceCalories,
      setGoal,
      updateWeight,
      recordMeasurementCheckIn,
      addProgressPhoto,
      removeProgressPhoto,
      applyProfileTargets,
      setAssistantCustomization,
      updatePersonalDetails,
      updateWomenHealth,
      setProfileLanguage,
      updateNotificationPreferences,
      startPremiumTrial,
      activatePremiumPlan,
      cancelPremiumSubscription
    ),
    effect: async (_, listenerApi) => {
      maybeApplyAutomaticAdaptiveTarget(listenerApi);

      if (!isCloudSyncActive()) {
        return;
      }

      await runCloudSync(listenerApi, (state) => syncRemoteProfileState(state.profile));
    },
  });

  remoteSyncListenerMiddleware.startListening({
    matcher: isAnyOf(
      setWaterTarget,
      syncWaterTargetFromWeight,
      setWaterGlassSize,
      setWaterReminders,
      setWaterConsumed,
      incrementWater,
      resetWaterTracker
    ),
    effect: async (_, listenerApi) => {
      listenerApi.cancelActiveListeners();
      await listenerApi.delay(WATER_SYNC_DEBOUNCE_MS);

      if (!isCloudSyncActive()) {
        return;
      }

      await runCloudSync(listenerApi, (state) => syncRemoteWaterState(state.water));
    },
  });

  remoteSyncListenerMiddleware.startListening({
    matcher: isAnyOf(upsertFridgeItem, updateFridgeItemQuantity, removeFridgeItem),
    effect: async (_, listenerApi) => {
      if (!isCloudSyncActive()) {
        return;
      }

      await runCloudSync(listenerApi, (state) => syncRemoteFridgeState(state.fridge));
    },
  });

  remoteSyncListenerMiddleware.startListening({
    matcher: isAnyOf(
      addFriend,
      sendCommunityMessage,
      sendDirectMessage,
      publishCommunityPost,
      commentCommunityPost,
      publishProgressCard,
      reportCommunityContent,
      reviewCommunityPost,
      deleteCommunityCommentAsModerator,
      deleteCommunityPostAsSpam,
      mergeCommunityPosts,
      toggleFavoritePost,
      likeCommunityPost,
      likeProgressCard
    ),
    effect: async (_, listenerApi) => {
      if (!isCloudSyncActive()) {
        return;
      }

      await runCloudSync(listenerApi, (state) => syncRemoteCommunityState(state.community));
    },
  });

  remoteSyncListenerMiddleware.startListening({
    matcher: isAnyOf(
      addProduct,
      addMealEntries,
      removeProduct,
      updateMealEntry,
      applyMealTemplate,
      clearMeal
    ),
    effect: async (_, listenerApi) => {
      maybeApplyAutomaticAdaptiveTarget(listenerApi);
    },
  });

  remoteSyncListenerMiddleware.startListening({
    actionCreator: setAdaptiveCalories,
    effect: async (_, listenerApi) => {
      if (!isCloudSyncActive()) {
        return;
      }

      await runCloudSync(listenerApi, (state) => syncRemoteProfileState(state.profile));
    },
  });

  remoteSyncListenerMiddleware.startListening({
    actionCreator: addProduct,
    effect: async (_, listenerApi) => {
      if (!isCloudSyncActive()) {
        return;
      }

      await runCloudSync(listenerApi, async (state) => {
        const entry = state.meal.items[0];

        if (!entry) {
          return syncWholeMealState(state);
        }

        const granularResult = await createRemoteMealEntries([entry]);
        return granularResult.ok ? granularResult : syncWholeMealState(state);
      });
    },
  });

  remoteSyncListenerMiddleware.startListening({
    actionCreator: addMealEntries,
    effect: async (action, listenerApi) => {
      if (!isCloudSyncActive()) {
        return;
      }

      await runCloudSync(listenerApi, async (state) => {
        const granularResult = await createRemoteMealEntries(action.payload);
        return granularResult.ok ? granularResult : syncWholeMealState(state);
      });
    },
  });

  remoteSyncListenerMiddleware.startListening({
    actionCreator: removeProduct,
    effect: async (action, listenerApi) => {
      if (!isCloudSyncActive()) {
        return;
      }

      await runCloudSync(listenerApi, async (state) => {
        const granularResult = await deleteRemoteMealEntry(action.payload);
        return granularResult.ok ? granularResult : syncWholeMealState(state);
      });
    },
  });

  remoteSyncListenerMiddleware.startListening({
    actionCreator: saveMealTemplate,
    effect: async (_, listenerApi) => {
      if (!isCloudSyncActive()) {
        return;
      }

      await runCloudSync(listenerApi, async (state) => {
        const template = state.meal.templates[0];

        if (!template) {
          return syncWholeMealState(state);
        }

        const granularResult = await createRemoteMealTemplate(template);
        return granularResult.ok ? granularResult : syncWholeMealState(state);
      });
    },
  });

  remoteSyncListenerMiddleware.startListening({
    actionCreator: deleteMealTemplate,
    effect: async (action, listenerApi) => {
      if (!isCloudSyncActive()) {
        return;
      }

      await runCloudSync(listenerApi, async (state) => {
        const granularResult = await deleteRemoteMealTemplate(action.payload);
        return granularResult.ok ? granularResult : syncWholeMealState(state);
      });
    },
  });

  remoteSyncListenerMiddleware.startListening({
    matcher: isAnyOf(applyMealTemplate, clearMeal, updateMealEntry),
    effect: async (_, listenerApi) => {
      if (!isCloudSyncActive()) {
        return;
      }

      await runCloudSync(listenerApi, (state) => syncWholeMealState(state));
    },
  });

  remoteSyncListenerMiddleware.startListening({
    actionCreator: saveProduct,
    effect: async (action, listenerApi) => {
      if (!isCloudSyncActive()) {
        return;
      }

      await runCloudSync(listenerApi, async (state) => {
        const granularResult = await saveRemoteMealProduct("saved", action.payload);
        return granularResult.ok ? granularResult : syncWholeMealState(state);
      });
    },
  });

  remoteSyncListenerMiddleware.startListening({
    actionCreator: removeSavedProduct,
    effect: async (action, listenerApi) => {
      if (!isCloudSyncActive()) {
        return;
      }

      await runCloudSync(listenerApi, async (state) => {
        const granularResult = await deleteRemoteMealProduct("saved", action.payload);
        return granularResult.ok ? granularResult : syncWholeMealState(state);
      });
    },
  });

  remoteSyncListenerMiddleware.startListening({
    actionCreator: rememberRecentProduct,
    effect: async (action, listenerApi) => {
      if (!isCloudSyncActive()) {
        return;
      }

      await runCloudSync(listenerApi, async (state) => {
        const granularResult = await saveRemoteMealProduct("recent", action.payload);
        return granularResult.ok ? granularResult : syncWholeMealState(state);
      });
    },
  });
};
