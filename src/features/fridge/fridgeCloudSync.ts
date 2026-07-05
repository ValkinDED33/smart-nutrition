import type { AppDispatch } from "@app/store";
import {
  isCloudStateConflict,
  recoverLatestCloudSnapshotAfterConflict,
} from "@features/auth/cloudConflictRecovery";
import { syncRemoteFridgeState } from "@shared/api/auth";
import type { Product } from "@domain/products/types";
import { replaceFridgeState, type FridgeState } from "./fridgeSlice";
import {
  buildFridgeStateAfterConsumeItems,
  buildFridgeStateAfterRemoveItem,
  buildFridgeStateAfterUpdateQuantity,
  buildFridgeStateAfterUpsertItem,
} from "./fridgeSaveModel";

type RemoteResult = Awaited<ReturnType<typeof syncRemoteFridgeState>>;

const assertCloudSaved = async (dispatch: AppDispatch, result: RemoteResult) => {
  if (result.ok) {
    return;
  }

  if (isCloudStateConflict(result)) {
    await recoverLatestCloudSnapshotAfterConflict(dispatch);
    throw new Error(
      "Cloud data changed on another device. The latest cloud version has been loaded; please repeat the fridge action."
    );
  }

  throw new Error(
    result.message || result.code || "Could not save fridge to cloud."
  );
};

export const saveFridgeStateToCloud = async (
  dispatch: AppDispatch,
  nextFridge: FridgeState
) => {
  const result = await syncRemoteFridgeState(nextFridge);
  await assertCloudSaved(dispatch, result);
  dispatch(replaceFridgeState(nextFridge));
  return nextFridge;
};

export const upsertFridgeItemInCloud = async (
  dispatch: AppDispatch,
  fridge: FridgeState,
  payload: { product: Product; quantity?: number }
) =>
  saveFridgeStateToCloud(
    dispatch,
    buildFridgeStateAfterUpsertItem(fridge, payload)
  );

export const updateFridgeItemQuantityInCloud = async (
  dispatch: AppDispatch,
  fridge: FridgeState,
  payload: { itemId: string; quantity: number }
) =>
  saveFridgeStateToCloud(
    dispatch,
    buildFridgeStateAfterUpdateQuantity(fridge, payload)
  );

export const removeFridgeItemFromCloud = async (
  dispatch: AppDispatch,
  fridge: FridgeState,
  itemId: string
) =>
  saveFridgeStateToCloud(
    dispatch,
    buildFridgeStateAfterRemoveItem(fridge, itemId)
  );

export const consumeFridgeItemsInCloud = async (
  dispatch: AppDispatch,
  fridge: FridgeState,
  consumedItems: Array<{ product: Product; quantity: number }>
) =>
  saveFridgeStateToCloud(
    dispatch,
    buildFridgeStateAfterConsumeItems(fridge, consumedItems)
  );
