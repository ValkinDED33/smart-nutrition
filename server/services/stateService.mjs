import crypto from "node:crypto";
import { createEmptyNutrients, StateApiError } from "../lib/domain.mjs";

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

const mealTypes = new Set(["breakfast", "lunch", "dinner", "snack"]);
const intakeSources = new Set(["barcode", "search", "manual", "recommendation", "photo"]);
const productCatalogStatuses = new Set(["pending", "approved", "rejected", "personal"]);
const CATALOG_SUBMISSION_RETRY_MESSAGE =
  "Catalog review is temporarily unavailable. The meal was saved; try catalog submission again later.";

const toSafeIdPart = (value) =>
  String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);

const createIntakeEntryId = (idempotencyKey) => {
  const safeKey = toSafeIdPart(idempotencyKey);

  if (safeKey) {
    return `meal-intake-${safeKey}`;
  }

  return `meal-intake-${crypto.randomUUID()}`;
};

const toNumber = (value) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : 0;
};

const normalizeNutrients = (value) => {
  const raw = isRecord(value) ? value : {};
  const nutrients = createEmptyNutrients();

  Object.keys(nutrients).forEach((key) => {
    nutrients[key] = Math.min(Math.max(toNumber(raw[key]), 0), 100000);
  });

  return nutrients;
};

const requireProductPayload = (value) => {
  const product = requireRecord(value, "INVALID_PRODUCT", "Product payload is required.");
  const id = String(product.id ?? "").trim() || `manual-${crypto.randomUUID()}`;
  const name = String(product.name ?? "").trim().replace(/\s+/g, " ").slice(0, 160);

  if (!name) {
    throw new StateApiError("INVALID_PRODUCT", "Product name is required.");
  }

  const nutrients = normalizeNutrients(product.nutrients);

  if (
    nutrients.calories <= 0 &&
    nutrients.protein <= 0 &&
    nutrients.fat <= 0 &&
    nutrients.carbs <= 0
  ) {
    throw new StateApiError(
      "INVALID_PRODUCT_NUTRITION",
      "Product nutrition must include calories or macros."
    );
  }

  return {
    id,
    name,
    unit: ["g", "ml", "piece"].includes(product.unit) ? product.unit : "g",
    source: ["USDA", "OpenFoodFacts", "Manual", "Recipe"].includes(product.source)
      ? product.source
      : "Manual",
    nutrients,
    brand: String(product.brand ?? "").trim().slice(0, 120) || undefined,
    barcode: String(product.barcode ?? "").trim().slice(0, 64) || undefined,
    category: String(product.category ?? "").trim().slice(0, 120) || undefined,
    imageUrl: String(product.imageUrl ?? "").trim().slice(0, 1700000) || undefined,
    status: productCatalogStatuses.has(product.status) ? product.status : undefined,
    facts: isRecord(product.facts) ? product.facts : undefined,
  };
};

const requireProductIntakeRequest = (body) => {
  const request = requireRecord(
    body,
    "INVALID_PRODUCT_INTAKE",
    "Product intake payload is required."
  );
  const source = String(request.source ?? "").trim();
  const mealType = String(request.mealType ?? request.mealTarget?.mealType ?? "snack").trim();
  const quantity = toNumber(request.quantity ?? request.mealTarget?.quantity);
  const idempotencyKey = String(request.idempotencyKey ?? "").trim();
  const options = isRecord(request.options) ? request.options : {};

  if (!intakeSources.has(source)) {
    throw new StateApiError("INVALID_INTAKE_SOURCE", "Product intake source is invalid.");
  }

  if (!mealTypes.has(mealType)) {
    throw new StateApiError("INVALID_MEAL_TYPE", "Meal type is invalid.");
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new StateApiError("INVALID_QUANTITY", "Meal quantity must be positive.");
  }

  if (!idempotencyKey) {
    throw new StateApiError("INVALID_IDEMPOTENCY_KEY", "Idempotency key is required.");
  }

  return {
    source,
    mealType,
    quantity: Math.min(Math.max(quantity, 0.1), 100000),
    eatenAt:
      typeof request.eatenAt === "string" && request.eatenAt.trim()
        ? request.eatenAt.trim()
        : new Date().toISOString(),
    product: request.product ? requireProductPayload(request.product) : null,
    barcode: String(request.barcode ?? "").replace(/\D/g, ""),
    query: String(request.query ?? "").trim().slice(0, 120),
    idempotencyKey,
    options: {
      saveToLibrary: options.saveToLibrary === true,
      submitToCatalog: options.submitToCatalog === true,
    },
  };
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
const requireProfileState = (value) =>
  requireRecord(value, "INVALID_PROFILE_STATE", "Profile state payload is required.");
const requireMealState = (value) =>
  requireRecord(value, "INVALID_MEAL_STATE", "Meal state payload is required.");
const requireFridgeState = (value) =>
  requireRecord(value, "INVALID_FRIDGE_STATE", "Fridge state payload is required.");
const requireCommunityState = (value) =>
  requireRecord(value, "INVALID_COMMUNITY_STATE", "Community state payload is required.");
const requireCompanionState = (value) =>
  requireRecord(value, "INVALID_COMPANION_STATE", "Companion state payload is required.");

const requireSnapshot = (value) => {
  const snapshot = requireRecord(value, "INVALID_STATE", "Full state snapshot is required.");

  return {
    profile: requireProfileState(snapshot.profile),
    meal: requireMealState(snapshot.meal),
    water: requireWaterState(snapshot.water),
    fridge: requireFridgeState(snapshot.fridge),
    community: requireCommunityState(snapshot.community),
    companion: requireCompanionState(snapshot.companion),
  };
};

export const createStateService = ({ stateRepository }) => ({
  getSnapshot: async (user) => stateRepository.getSnapshotByUserId(user.id, user),

  getSnapshotMeta: async (user) => stateRepository.getSnapshotMetaByUserId(user.id),

  saveSnapshot: async (user, snapshot, syncContext = undefined) => {
    const nextSnapshot = requireSnapshot(snapshot);

    return stateRepository.upsertSnapshot(user.id, {
      ...nextSnapshot,
      updatedAt: new Date().toISOString(),
    }, syncContext);
  },

  getProfileState: async (user) => stateRepository.getProfileStateByUserId(user.id, user),

  saveProfileState: async (user, profileState, syncContext = undefined) =>
    stateRepository.upsertProfileState(
      user.id,
      requireProfileState(profileState),
      syncContext
    ),

  getMealState: async (user) => stateRepository.getMealStateByUserId(user.id),

  saveMealState: async (user, mealState, syncContext = undefined) =>
    stateRepository.upsertMealState(user.id, requireMealState(mealState), syncContext),

  getWaterState: async (user) => stateRepository.getWaterStateByUserId(user.id),

  saveWaterState: async (user, waterState, syncContext = undefined) =>
    stateRepository.upsertWaterState(user.id, requireWaterState(waterState), syncContext),

  getFridgeState: async (user) => stateRepository.getFridgeStateByUserId(user.id),

  saveFridgeState: async (user, fridgeState, syncContext = undefined) =>
    stateRepository.upsertFridgeState(
      user.id,
      requireFridgeState(fridgeState),
      syncContext
    ),

  getCommunityState: async (user) => stateRepository.getCommunityStateByUserId(user.id),

  saveCommunityState: async (user, communityState, syncContext = undefined) =>
    stateRepository.upsertCommunityState(
      user.id,
      requireCommunityState(communityState),
      syncContext
    ),

  getCompanionState: async (user) => stateRepository.getCompanionStateByUserId(user.id),

  saveCompanionState: async (user, companionState, syncContext = undefined) =>
    stateRepository.upsertCompanionState(
      user.id,
      requireCompanionState(companionState),
      syncContext
    ),

  addMealEntries: async (user, requestBody, syncContext = undefined) =>
    stateRepository.addMealEntries(user.id, requireEntries(requestBody?.entries), syncContext),

  addProductIntake: async (
    user,
    requestBody,
    { resolveProduct, submitCatalog } = {},
    syncContext = undefined
  ) => {
    const intake = requireProductIntakeRequest(requestBody);
    let product = intake.product;

    if (!product && resolveProduct) {
      product = await resolveProduct({
        barcode: intake.barcode,
        query: intake.query,
        source: intake.source,
      });
    }

    if (!product) {
      throw new StateApiError("PRODUCT_NOT_FOUND", "Product could not be resolved.");
    }

    product = requireProductPayload(product);

    const entry = {
      id: createIntakeEntryId(intake.idempotencyKey),
      product,
      quantity: intake.quantity,
      mealType: intake.mealType,
      eatenAt: intake.eatenAt,
      origin: intake.source === "barcode" ? "barcode" : "manual",
    };

    let catalogStatus = {
      requested: intake.options.submitToCatalog,
      accepted: false,
      failed: false,
      retryable: false,
      message: null,
    };

    const meal = await stateRepository.addMealEntries(user.id, [entry], syncContext);

    if (intake.options.saveToLibrary) {
      await stateRepository.upsertMealProduct(user.id, "saved", product, undefined);
    }

    if (intake.options.submitToCatalog && submitCatalog) {
      try {
        await submitCatalog(product);
        catalogStatus = {
          requested: true,
          accepted: true,
          failed: false,
          retryable: false,
          message: null,
        };
      } catch {
        catalogStatus = {
          requested: true,
          accepted: false,
          failed: true,
          retryable: true,
          message: CATALOG_SUBMISSION_RETRY_MESSAGE,
        };
      }
    }

    const canonicalMeal = (await stateRepository.getMealStateByUserId(user.id)) ?? meal;
    const mealAdded = canonicalMeal?.items?.some((item) => item.id === entry.id) === true;
    const librarySaved = intake.options.saveToLibrary
      ? canonicalMeal?.savedProducts?.some((item) => item.id === product.id) === true
      : false;

    return {
      ok: true,
      meal: canonicalMeal ?? meal,
      entry,
      product,
      outcomes: {
        mealAdded,
        librarySaved,
        catalogAccepted: catalogStatus.accepted,
        catalogFailedRetryable: catalogStatus.failed && catalogStatus.retryable,
      },
      catalog: catalogStatus,
    };
  },

  removeMealEntry: async (user, entryId, syncContext = undefined) =>
    stateRepository.removeMealEntry(
      user.id,
      requireNonEmptyString(entryId, "INVALID_MEAL_ENTRY_ID", "Meal entry id is required."),
      syncContext
    ),

  addMealTemplate: async (user, template, syncContext = undefined) =>
    stateRepository.addMealTemplate(
      user.id,
      requireRecord(template, "INVALID_MEAL_TEMPLATE", "Meal template payload is required."),
      syncContext
    ),

  deleteMealTemplate: async (user, templateId, syncContext = undefined) =>
    stateRepository.deleteMealTemplate(
      user.id,
      requireNonEmptyString(
        templateId,
        "INVALID_MEAL_TEMPLATE_ID",
        "Meal template id is required."
      ),
      syncContext
    ),

  upsertMealProduct: async (user, bucket, product, syncContext = undefined) =>
    stateRepository.upsertMealProduct(
      user.id,
      requireMealProductBucket(bucket),
      requireRecord(product, "INVALID_MEAL_PRODUCT", "Meal product payload is required."),
      syncContext
    ),

  removeMealProduct: async (user, bucket, productKey, syncContext = undefined) =>
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
