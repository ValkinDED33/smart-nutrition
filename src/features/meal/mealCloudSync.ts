import type { AppDispatch } from "@app/store";
import {
  isCloudStateConflict,
  recoverLatestCloudSnapshotAfterConflict,
} from "@features/auth/cloudConflictRecovery";
import {
  createRemoteMealEntries,
  createRemoteProductIntake,
  createRemoteMealTemplate,
  deleteRemoteMealEntry,
  deleteRemoteMealProduct,
  deleteRemoteMealTemplate,
  saveRemoteMealProduct,
  syncRemoteMealState,
  type ProductIntakePayload,
} from "@shared/api/auth";
import type { MealEntry } from "@domain/meal/types";
import type { Product } from "@domain/products/types";
import type { MealState } from "./mealSlice";
import { replaceMealState } from "./mealSlice";
import {
  buildMealStateAfterApplyTemplate,
  buildMealStateAfterDeleteTemplate,
  buildMealStateAfterRememberRecentProduct,
  buildMealStateAfterRemoveEntry,
  buildMealStateAfterRemoveSavedProduct,
  buildMealStateAfterSaveProduct,
  buildMealStateAfterSaveTemplate,
  buildMealStateAfterUpdateEntry,
} from "./mealSaveModel";

type RemoteResult = Awaited<ReturnType<typeof syncRemoteMealState>>;
const MISSING_CANONICAL_MEAL_ERROR = "Backend did not return canonical meal state.";

const recoverIfCloudConflict = async (
  dispatch: AppDispatch,
  result: RemoteResult
) => {
  if (isCloudStateConflict(result)) {
    await recoverLatestCloudSnapshotAfterConflict(dispatch);
    throw new Error(
      "Cloud data changed on another device. The latest cloud version has been loaded; please repeat the meal action."
    );
  }
};

const assertCloudSaved = async (dispatch: AppDispatch, result: RemoteResult) => {
  if (!result.ok) {
    await recoverIfCloudConflict(dispatch, result);

    throw new Error(
      result.message || result.code || "Could not save meal to cloud."
    );
  }
};

const getConfirmedMealState = (
  result: RemoteResult,
  fallbackMeal: MealState
): MealState => (result.meal ? (result.meal as MealState) : fallbackMeal);

const requireConfirmedMealState = (result: RemoteResult): MealState => {
  if (!result.meal) {
    throw new Error(MISSING_CANONICAL_MEAL_ERROR);
  }

  return result.meal as MealState;
};

const saveMealStateToCloud = async (
  dispatch: AppDispatch,
  nextMeal: MealState
) => {
  const result = await syncRemoteMealState(nextMeal);
  await assertCloudSaved(dispatch, result);
  const confirmedMeal = getConfirmedMealState(result, nextMeal);
  dispatch(replaceMealState(confirmedMeal));
  return confirmedMeal;
};

export const addMealEntriesToCloud = async (
  dispatch: AppDispatch,
  _meal: MealState,
  entries: MealEntry[]
) => {
  const result = await createRemoteMealEntries(entries);

  await assertCloudSaved(dispatch, result);

  const confirmedMeal = requireConfirmedMealState(result);
  dispatch(replaceMealState(confirmedMeal));
  return confirmedMeal;
};

export const addProductIntakeToCloud = async (
  dispatch: AppDispatch,
  payload: ProductIntakePayload
) => {
  const result = await createRemoteProductIntake(payload);

  await assertCloudSaved(dispatch, result);

  if (!result.meal) {
    throw new Error(MISSING_CANONICAL_MEAL_ERROR);
  }

  dispatch(replaceMealState(result.meal));

  return result;
};

export const removeMealEntryFromCloud = async (
  dispatch: AppDispatch,
  meal: MealState,
  entryId: string
) => {
  const nextMeal = buildMealStateAfterRemoveEntry(meal, entryId);
  const result = await deleteRemoteMealEntry(entryId);

  if (!result.ok) {
    await recoverIfCloudConflict(dispatch, result);
    return saveMealStateToCloud(dispatch, nextMeal);
  }

  const confirmedMeal = requireConfirmedMealState(result);
  dispatch(replaceMealState(confirmedMeal));
  return confirmedMeal;
};

export const updateMealEntryInCloud = async (
  dispatch: AppDispatch,
  meal: MealState,
  update: {
    id: string;
    product: Product;
    quantity: number;
    mealType: MealEntry["mealType"];
  }
) => saveMealStateToCloud(dispatch, buildMealStateAfterUpdateEntry(meal, update));

export const saveMealTemplateToCloud = async (
  dispatch: AppDispatch,
  meal: MealState,
  template: MealState["templates"][number]
) => {
  const nextMeal = buildMealStateAfterSaveTemplate(meal, template);
  const result = await createRemoteMealTemplate(template);

  if (!result.ok) {
    await recoverIfCloudConflict(dispatch, result);
    return saveMealStateToCloud(dispatch, nextMeal);
  }

  const confirmedMeal = requireConfirmedMealState(result);
  dispatch(replaceMealState(confirmedMeal));
  return confirmedMeal;
};

export const deleteMealTemplateFromCloud = async (
  dispatch: AppDispatch,
  meal: MealState,
  templateId: string
) => {
  const nextMeal = buildMealStateAfterDeleteTemplate(meal, templateId);
  const result = await deleteRemoteMealTemplate(templateId);

  if (!result.ok) {
    await recoverIfCloudConflict(dispatch, result);
    return saveMealStateToCloud(dispatch, nextMeal);
  }

  const confirmedMeal = requireConfirmedMealState(result);
  dispatch(replaceMealState(confirmedMeal));
  return confirmedMeal;
};

export const applyMealTemplateInCloud = async (
  dispatch: AppDispatch,
  meal: MealState,
  templateId: string,
  entries: MealEntry[]
) =>
  saveMealStateToCloud(
    dispatch,
    buildMealStateAfterApplyTemplate(meal, templateId, entries)
  );

export const saveMealProductToCloud = async (
  dispatch: AppDispatch,
  meal: MealState,
  product: Product
) => {
  const nextMeal = buildMealStateAfterSaveProduct(meal, product);
  const result = await saveRemoteMealProduct("saved", product);

  if (!result.ok) {
    await recoverIfCloudConflict(dispatch, result);
    return saveMealStateToCloud(dispatch, nextMeal);
  }

  const confirmedMeal = requireConfirmedMealState(result);
  dispatch(replaceMealState(confirmedMeal));
  return confirmedMeal;
};

export const removeSavedMealProductFromCloud = async (
  dispatch: AppDispatch,
  meal: MealState,
  productKey: string
) => {
  const nextMeal = buildMealStateAfterRemoveSavedProduct(meal, productKey);
  const result = await deleteRemoteMealProduct("saved", productKey);

  if (!result.ok) {
    await recoverIfCloudConflict(dispatch, result);
    return saveMealStateToCloud(dispatch, nextMeal);
  }

  const confirmedMeal = requireConfirmedMealState(result);
  dispatch(replaceMealState(confirmedMeal));
  return confirmedMeal;
};

export const rememberRecentMealProductInCloud = async (
  dispatch: AppDispatch,
  meal: MealState,
  product: Product
) => {
  const nextMeal = buildMealStateAfterRememberRecentProduct(meal, product);
  const result = await saveRemoteMealProduct("recent", product);

  if (!result.ok) {
    await recoverIfCloudConflict(dispatch, result);
    return saveMealStateToCloud(dispatch, nextMeal);
  }

  const confirmedMeal = requireConfirmedMealState(result);
  dispatch(replaceMealState(confirmedMeal));
  return confirmedMeal;
};
