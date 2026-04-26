import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import {
  createRemoteMealEntries,
  createRemoteMealTemplate,
  deleteRemoteMealEntry,
  deleteRemoteMealProduct,
  deleteRemoteMealTemplate,
  isCloudSyncActive,
  syncRemoteCommunityState,
  syncRemoteFridgeState,
  type RemoteSyncResult,
  saveRemoteMealProduct,
  syncRemoteMealState,
  syncRemoteProfileState,
  syncRemoteWaterState,
} from "../shared/api/auth";
import {
  hydrateSyncOutbox,
  setCloudMeta,
  markSyncError,
  markSyncStarted,
  markSyncSuccess,
} from "../features/auth/authSlice";
import {
  addFriend,
  likeCommunityPost,
  publishCommunityPost,
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
  setAdaptiveCalories,
  setDailyCalories,
  setGoal,
  setMaintenanceCalories,
  updateNotificationPreferences,
  updateWeight,
  type ProfileState,
} from "../features/profile/profileSlice";
import {
  incrementWater,
  resetWaterTracker,
  setWaterConsumed,
  setWaterGlassSize,
  setWaterTarget,
  syncWaterTargetFromWeight,
  type WaterState,
} from "../features/water/waterSlice";
import { clearSyncOutbox, enqueueSyncOutbox } from "../shared/lib/syncOutbox";
import {
  calculateAdaptiveCalorieTarget,
  calculateAverageDailyCalories,
} from "../shared/lib/adaptiveGoal";
import { buildAppSnapshot } from "../shared/lib/appSnapshot";
import { writeCachedRemoteSnapshot } from "../shared/lib/remoteStateCache";
import { broadcastTabSnapshot } from "../shared/lib/tabRealtimeSync";

type SyncState = {
  profile: ProfileState;
  meal: MealState;
  water: WaterState;
  fridge: unknown;
  community: unknown;
  auth: {
    user: {
      id: string;
    } | null;
  };
};

const getStateSnapshot = (state: unknown) => state as SyncState;

const syncWholeMealState = async (state: SyncState) => {
  return syncRemoteMealState(state.meal);
};

const broadcastCurrentTabState = (state: SyncState) => {
  if (!state.auth.user?.id) {
    return;
  }

  broadcastTabSnapshot({
    userId: state.auth.user.id,
    profile: state.profile,
    meal: state.meal,
    water: state.water,
  });
};

const maybeApplyAutomaticAdaptiveTarget = (
  listenerApi: Parameters<typeof remoteSyncListenerMiddleware.startListening>[0]["effect"] extends (
    action: infer _Action,
    api: infer Api
  ) => unknown
    ? Api
    : never
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

const getRemoteSyncErrorMessage = (result: RemoteSyncResult) =>
  result.code === "STATE_CONFLICT"
    ? "Cloud data changed on another device. Use the latest cloud version before retrying."
    : result.message ?? SYNC_ERROR_MESSAGE;

const runCloudSync = async (
  listenerApi: Parameters<typeof remoteSyncListenerMiddleware.startListening>[0]["effect"] extends (
    action: infer _Action,
    api: infer Api
  ) => unknown
    ? Api
    : never,
  task: () => Promise<RemoteSyncResult>
) => {
  listenerApi.dispatch(markSyncStarted());

  try {
    const result = await task();

    if (result.ok) {
      const state = getStateSnapshot(listenerApi.getState());
      const clearedOutbox = clearSyncOutbox();
      writeCachedRemoteSnapshot(
        buildAppSnapshot({
          profile: state.profile,
          meal: state.meal,
          water: state.water,
          fridge: state.fridge,
          community: state.community,
          meta: result.meta,
        })
      );
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

export const registerRemoteSyncListeners = () => {
  if (listenersRegistered) {
    return;
  }

  listenersRegistered = true;

  remoteSyncListenerMiddleware.startListening({
    matcher: isAnyOf(
      setDailyCalories,
      setMaintenanceCalories,
      setGoal,
      updateWeight,
      applyProfileTargets,
      updateNotificationPreferences
    ),
    effect: async (_, listenerApi) => {
      maybeApplyAutomaticAdaptiveTarget(listenerApi);
      broadcastCurrentTabState(getStateSnapshot(listenerApi.getState()));

      if (!isCloudSyncActive()) {
        return;
      }

      const state = getStateSnapshot(listenerApi.getState());
      await runCloudSync(listenerApi, () => syncRemoteProfileState(state.profile));
    },
  });

  remoteSyncListenerMiddleware.startListening({
    matcher: isAnyOf(
      setWaterTarget,
      syncWaterTargetFromWeight,
      setWaterGlassSize,
      setWaterConsumed,
      incrementWater,
      resetWaterTracker
    ),
    effect: async (_, listenerApi) => {
      broadcastCurrentTabState(getStateSnapshot(listenerApi.getState()));

      if (!isCloudSyncActive()) {
        return;
      }

      const state = getStateSnapshot(listenerApi.getState());
      await runCloudSync(listenerApi, () => syncRemoteWaterState(state.water));
    },
  });

  remoteSyncListenerMiddleware.startListening({
    matcher: isAnyOf(upsertFridgeItem, updateFridgeItemQuantity, removeFridgeItem),
    effect: async (_, listenerApi) => {
      if (!isCloudSyncActive()) {
        return;
      }

      const state = getStateSnapshot(listenerApi.getState());
      await runCloudSync(listenerApi, () => syncRemoteFridgeState(state.fridge));
    },
  });

  remoteSyncListenerMiddleware.startListening({
    matcher: isAnyOf(
      addFriend,
      sendDirectMessage,
      publishCommunityPost,
      toggleFavoritePost,
      likeCommunityPost
    ),
    effect: async (_, listenerApi) => {
      if (!isCloudSyncActive()) {
        return;
      }

      const state = getStateSnapshot(listenerApi.getState());
      await runCloudSync(listenerApi, () => syncRemoteCommunityState(state.community));
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
      broadcastCurrentTabState(getStateSnapshot(listenerApi.getState()));
    },
  });

  remoteSyncListenerMiddleware.startListening({
    actionCreator: setAdaptiveCalories,
    effect: async (_, listenerApi) => {
      broadcastCurrentTabState(getStateSnapshot(listenerApi.getState()));

      if (!isCloudSyncActive()) {
        return;
      }

      const state = getStateSnapshot(listenerApi.getState());
      await runCloudSync(listenerApi, () => syncRemoteProfileState(state.profile));
    },
  });

  remoteSyncListenerMiddleware.startListening({
    actionCreator: addProduct,
    effect: async (_, listenerApi) => {
      if (!isCloudSyncActive()) {
        return;
      }

      const state = getStateSnapshot(listenerApi.getState());
      const entry = state.meal.items[0];

      await runCloudSync(listenerApi, async () => {
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

      const state = getStateSnapshot(listenerApi.getState());

      await runCloudSync(listenerApi, async () => {
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

      const state = getStateSnapshot(listenerApi.getState());

      await runCloudSync(listenerApi, async () => {
        const granularResult = await deleteRemoteMealEntry(action.payload);
        return granularResult.ok ? granularResult : syncWholeMealState(state);
      });
    },
  });

  remoteSyncListenerMiddleware.startListening({
    actionCreator: saveMealTemplate,
    effect: async (_, listenerApi) => {
      broadcastCurrentTabState(getStateSnapshot(listenerApi.getState()));

      if (!isCloudSyncActive()) {
        return;
      }

      const state = getStateSnapshot(listenerApi.getState());
      const template = state.meal.templates[0];

      await runCloudSync(listenerApi, async () => {
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
      broadcastCurrentTabState(getStateSnapshot(listenerApi.getState()));

      if (!isCloudSyncActive()) {
        return;
      }

      const state = getStateSnapshot(listenerApi.getState());

      await runCloudSync(listenerApi, async () => {
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

      const state = getStateSnapshot(listenerApi.getState());
      await runCloudSync(listenerApi, () => syncWholeMealState(state));
    },
  });

  remoteSyncListenerMiddleware.startListening({
    actionCreator: saveProduct,
    effect: async (action, listenerApi) => {
      broadcastCurrentTabState(getStateSnapshot(listenerApi.getState()));

      if (!isCloudSyncActive()) {
        return;
      }

      const state = getStateSnapshot(listenerApi.getState());

      await runCloudSync(listenerApi, async () => {
        const granularResult = await saveRemoteMealProduct("saved", action.payload);
        return granularResult.ok ? granularResult : syncWholeMealState(state);
      });
    },
  });

  remoteSyncListenerMiddleware.startListening({
    actionCreator: removeSavedProduct,
    effect: async (action, listenerApi) => {
      broadcastCurrentTabState(getStateSnapshot(listenerApi.getState()));

      if (!isCloudSyncActive()) {
        return;
      }

      const state = getStateSnapshot(listenerApi.getState());

      await runCloudSync(listenerApi, async () => {
        const granularResult = await deleteRemoteMealProduct("saved", action.payload);
        return granularResult.ok ? granularResult : syncWholeMealState(state);
      });
    },
  });

  remoteSyncListenerMiddleware.startListening({
    actionCreator: rememberRecentProduct,
    effect: async (action, listenerApi) => {
      broadcastCurrentTabState(getStateSnapshot(listenerApi.getState()));

      if (!isCloudSyncActive()) {
        return;
      }

      const state = getStateSnapshot(listenerApi.getState());

      await runCloudSync(listenerApi, async () => {
        const granularResult = await saveRemoteMealProduct("recent", action.payload);
        return granularResult.ok ? granularResult : syncWholeMealState(state);
      });
    },
  });
};
