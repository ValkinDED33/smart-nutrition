import { StateApiError } from "../lib/domain.mjs";

const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const requireNonEmptyString = (value, code, message) => {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    throw new StateApiError(code, message);
  }

  return normalized;
};

const requireRecord = (value, code, message) => {
  if (!isRecord(value)) {
    throw new StateApiError(code, message);
  }

  return value;
};

const requireEntries = (value) => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new StateApiError(
      "INVALID_MEAL_ENTRIES",
      "Meal entries payload must contain at least one entry."
    );
  }

  return value;
};

const requireMealProductBucket = (bucket) => {
  if (bucket !== "saved" && bucket !== "recent") {
    throw new StateApiError(
      "INVALID_BUCKET",
      "Meal product bucket must be either 'saved' or 'recent'."
    );
  }

  return bucket;
};

const requireWaterState = (value) =>
  requireRecord(value, "INVALID_WATER_STATE", "Water state payload is required.");
const requireFridgeState = (value) =>
  requireRecord(value, "INVALID_FRIDGE_STATE", "Fridge state payload is required.");
const requireCommunityState = (value) =>
  requireRecord(value, "INVALID_COMMUNITY_STATE", "Community state payload is required.");

export const createStateService = ({ stateRepository }) => ({
  getSnapshot: (user) => stateRepository.getSnapshotByUserId(user.id, user),

  getSnapshotMeta: (user) => stateRepository.getSnapshotMetaByUserId(user.id),

  saveSnapshot: (user, snapshot, syncContext = undefined) =>
    stateRepository.upsertSnapshot(user.id, {
      profile: snapshot?.profile ?? null,
      meal: snapshot?.meal ?? null,
      water: snapshot?.water ?? null,
      fridge: snapshot?.fridge ?? null,
      community: snapshot?.community ?? null,
      updatedAt: new Date().toISOString(),
    }, syncContext),

  getProfileState: (user) => stateRepository.getProfileStateByUserId(user.id, user),

  saveProfileState: (user, profileState, syncContext = undefined) =>
    stateRepository.upsertProfileState(user.id, profileState, syncContext),

  getMealState: (user) => stateRepository.getMealStateByUserId(user.id),

  saveMealState: (user, mealState, syncContext = undefined) =>
    stateRepository.upsertMealState(user.id, mealState, syncContext),

  getWaterState: (user) => stateRepository.getWaterStateByUserId(user.id),

  saveWaterState: (user, waterState, syncContext = undefined) =>
    stateRepository.upsertWaterState(user.id, requireWaterState(waterState), syncContext),

  getFridgeState: (user) => stateRepository.getFridgeStateByUserId(user.id),

  saveFridgeState: (user, fridgeState, syncContext = undefined) =>
    stateRepository.upsertFridgeState(
      user.id,
      requireFridgeState(fridgeState),
      syncContext
    ),

  getCommunityState: (user) => stateRepository.getCommunityStateByUserId(user.id),

  saveCommunityState: (user, communityState, syncContext = undefined) =>
    stateRepository.upsertCommunityState(
      user.id,
      requireCommunityState(communityState),
      syncContext
    ),

  addMealEntries: (user, requestBody, syncContext = undefined) =>
    stateRepository.addMealEntries(user.id, requireEntries(requestBody?.entries), syncContext),

  removeMealEntry: (user, entryId, syncContext = undefined) =>
    stateRepository.removeMealEntry(
      user.id,
      requireNonEmptyString(entryId, "INVALID_MEAL_ENTRY_ID", "Meal entry id is required."),
      syncContext
    ),

  addMealTemplate: (user, template, syncContext = undefined) =>
    stateRepository.addMealTemplate(
      user.id,
      requireRecord(template, "INVALID_MEAL_TEMPLATE", "Meal template payload is required."),
      syncContext
    ),

  deleteMealTemplate: (user, templateId, syncContext = undefined) =>
    stateRepository.deleteMealTemplate(
      user.id,
      requireNonEmptyString(
        templateId,
        "INVALID_MEAL_TEMPLATE_ID",
        "Meal template id is required."
      ),
      syncContext
    ),

  upsertMealProduct: (user, bucket, product, syncContext = undefined) =>
    stateRepository.upsertMealProduct(
      user.id,
      requireMealProductBucket(bucket),
      requireRecord(product, "INVALID_MEAL_PRODUCT", "Meal product payload is required."),
      syncContext
    ),

  removeMealProduct: (user, bucket, productKey, syncContext = undefined) =>
    stateRepository.removeMealProduct(
      user.id,
      requireMealProductBucket(bucket),
      requireNonEmptyString(
        productKey,
        "INVALID_MEAL_PRODUCT_KEY",
        "Meal product key is required."
      ),
      syncContext
    ),
});
