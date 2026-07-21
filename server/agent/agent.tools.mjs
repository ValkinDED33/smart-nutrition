import crypto from "node:crypto";
import {
  calculateMealTotalNutrients,
  createInitialWaterState,
} from "../lib/domain.mjs";

const createDateKey = (date = new Date()) => date.toISOString().slice(0, 10);

const toPositiveInteger = (value, fallback) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) && nextValue > 0 ? Math.round(nextValue) : fallback;
};

const normalizeSearchQuery = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 120);

const toMealType = (value) =>
  value === "breakfast" || value === "lunch" || value === "dinner" || value === "snack"
    ? value
    : "snack";

const createAssistantMealIntakeKey = () => `assistant-meal-${crypto.randomUUID()}`;
const createAssistantRecipeTemplateId = () => `assistant-recipe-${crypto.randomUUID()}`;
const CUSTOM_RECIPE_PREFIX = "Recipe: ";

const toWeightKg = (value) => {
  const weight = Number(value);
  return Number.isFinite(weight) && weight >= 30 && weight <= 400
    ? Math.round(weight * 10) / 10
    : null;
};

const createAssistantSymptomId = () => `assistant-symptom-${crypto.randomUUID()}`;
const DEFAULT_REMINDER_TIMEZONE = "Europe/Warsaw";

const productMatchesById = (product, expectedId) =>
  Boolean(product?.id) && String(product.id) === String(expectedId);

const normalizeSymptomLabel = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);

const toSymptomSeverity = (value) => {
  const severity = Number(value);
  return Number.isFinite(severity) ? Math.max(1, Math.min(Math.round(severity), 10)) : 5;
};

const normalizeClockTime = (date, timeZone = DEFAULT_REMINDER_TIMEZONE) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hours = String(byType.hour ?? "00").padStart(2, "0");
  const minutes = String(byType.minute ?? "00").padStart(2, "0");

  return `${hours}:${minutes}`;
};

const readRelativeFollowUpMinutes = (text) => {
  const normalized = String(text ?? "").toLowerCase();
  const match = normalized.match(
    /(?:через|за|in)\s+(\d{1,3})\s*(мин(?:ут[уы]?)?|хв(?:илин[уы]?)?|minutes?|min|час(?:а|ов)?|год(?:ини|ин)?|hours?|h)(?=\s|$|[,.!?])/iu
  );

  if (!match) {
    return null;
  }

  const amount = Number(match[1]);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const unit = String(match[2] ?? "").toLowerCase();
  const minutes = /час|год|hour|^h$/iu.test(unit) ? amount * 60 : amount;

  return Math.min(Math.max(Math.round(minutes), 1), 24 * 60);
};

const removeRelativeFollowUpPhrase = (text) =>
  String(text ?? "")
    .replace(
      /(?:через|за|in)\s+\d{1,3}\s*(?:мин(?:ут[уы]?)?|хв(?:илин[уы]?)?|minutes?|min|час(?:а|ов)?|год(?:ини|ин)?|hours?|h)(?=\s|$|[,.!?])/giu,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();

const buildFollowUpReminderText = (text, currentNow) => {
  const normalized = normalizeSearchQuery(text);
  const relativeMinutes = readRelativeFollowUpMinutes(normalized);

  if (!relativeMinutes) {
    return normalized;
  }

  const followUpAt = new Date(currentNow.getTime() + relativeMinutes * 60 * 1000);
  const cleaned = removeRelativeFollowUpPhrase(normalized);

  return `${cleaned || "follow up"} о ${normalizeClockTime(followUpAt)}`;
};

const buildPlanReminderTime = (currentNow) => {
  const reminderAt = new Date(currentNow.getTime() + 90 * 60 * 1000);

  return normalizeClockTime(reminderAt);
};

const calculateEntryNutrients = (entry) =>
  calculateMealTotalNutrients([entry]);

const normalizeWaterGoal = (waterState) =>
  Math.min(
    Math.max(
      Math.round(Number(waterState?.dailyWaterGoal ?? waterState?.dailyTargetMl ?? 2000) || 2000),
      2000
    ),
    3000
  );

const normalizeWaterStateForToday = (waterState = {}, now = new Date()) => {
  const fallback = createInitialWaterState();
  const dateKey = createDateKey(now);
  const dailyWaterGoal = normalizeWaterGoal(waterState);
  const consumedMl =
    waterState?.lastLoggedOn === dateKey
      ? Math.max(Math.round(Number(waterState?.consumedMl ?? 0) || 0), 0)
      : 0;
  const history = Array.isArray(waterState?.history) ? waterState.history : fallback.history;
  const historyEntry = {
    date: dateKey,
    consumedMl,
    targetMl: dailyWaterGoal,
    updatedAt: new Date().toISOString(),
  };

  return {
    ...fallback,
    ...waterState,
    dailyWaterGoal,
    consumedMl,
    glassSizeMl: Math.max(Math.round(Number(waterState?.glassSizeMl ?? 250) || 250), 100),
    lastLoggedOn: dateKey,
    history: [historyEntry, ...history.filter((entry) => entry?.date !== dateKey)].slice(0, 30),
  };
};

const getTodayMealEntries = (mealState = {}, now = new Date()) => {
  const dateKey = createDateKey(now);
  const items = Array.isArray(mealState?.items) ? mealState.items : [];

  return items.filter((item) => String(item?.eatenAt ?? "").startsWith(dateKey));
};

const toWaterStatus = (waterState) => ({
  consumedMl: Math.max(Math.round(Number(waterState?.consumedMl ?? 0) || 0), 0),
  targetMl: normalizeWaterGoal(waterState),
  glassSizeMl: Math.max(Math.round(Number(waterState?.glassSizeMl ?? 250) || 250), 100),
});

const calculatePercent = (current, target) => {
  const currentNumber = Number(current) || 0;
  const targetNumber = Number(target) || 0;

  if (targetNumber <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(Math.round((currentNumber / targetNumber) * 100), 999));
};

const sortByIsoDateDesc = (items, dateKey) =>
  [...items].sort((first, second) => {
    const firstTime = Date.parse(first?.[dateKey] ?? "");
    const secondTime = Date.parse(second?.[dateKey] ?? "");

    return (Number.isFinite(secondTime) ? secondTime : 0) -
      (Number.isFinite(firstTime) ? firstTime : 0);
  });

const startOfUtcDay = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const addUtcDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);

  return nextDate;
};

const createReportWindow = (period, currentNow) => {
  const normalizedPeriod = period === "month" ? "month" : "week";
  const days = normalizedPeriod === "month" ? 30 : 7;
  const end = addUtcDays(startOfUtcDay(currentNow), 1);
  const start = addUtcDays(end, -days);

  return {
    period: normalizedPeriod,
    days,
    start,
    end,
    startDate: createDateKey(start),
    endDate: createDateKey(addUtcDays(end, -1)),
  };
};

const isInReportWindow = (value, window) => {
  const time = Date.parse(value ?? "");

  return Number.isFinite(time) && time >= window.start.getTime() && time < window.end.getTime();
};

const getReportMealEntries = (mealState = {}, window) => {
  const items = Array.isArray(mealState?.items) ? mealState.items : [];

  return items.filter((item) => isInReportWindow(item?.eatenAt, window));
};

const getReportWaterEntries = (waterState = {}, window) => {
  const history = Array.isArray(waterState?.history) ? waterState.history : [];

  return history.filter((entry) => {
    const date = String(entry?.date ?? "").slice(0, 10);
    return isInReportWindow(`${date}T00:00:00.000Z`, window);
  });
};

const getReportWeightEntries = (profile = {}, window) => {
  const history = Array.isArray(profile.weightHistory) ? profile.weightHistory : [];

  return sortByIsoDateDesc(
    history.filter((entry) => isInReportWindow(entry?.date, window)),
    "date"
  ).reverse();
};

const getReportSymptomEntries = (profile = {}, window, limit = 5) => {
  const symptomHistory = Array.isArray(profile?.womenHealth?.symptomHistory)
    ? profile.womenHealth.symptomHistory
    : [];

  return sortByIsoDateDesc(
    symptomHistory.filter((entry) => isInReportWindow(entry?.recordedAt, window)),
    "recordedAt"
  ).slice(0, limit);
};

const calculateReportWater = (waterState, window) => {
  const history = getReportWaterEntries(waterState, window);
  const fallbackTargetMl = normalizeWaterGoal(waterState);
  const totalConsumedMl = history.reduce(
    (sum, entry) => sum + Math.max(Math.round(Number(entry?.consumedMl ?? 0) || 0), 0),
    0
  );
  const totalTargetMl = history.reduce(
    (sum, entry) => sum + Math.max(Math.round(Number(entry?.targetMl ?? fallbackTargetMl) || 0), 0),
    0
  );

  return {
    daysLogged: history.filter((entry) => Number(entry?.consumedMl ?? 0) > 0).length,
    totalConsumedMl,
    averageConsumedMl: Math.round(totalConsumedMl / window.days),
    averageTargetMl: Math.round((totalTargetMl || fallbackTargetMl * window.days) / window.days),
    goalHitDays: history.filter(
      (entry) => Number(entry?.targetMl ?? fallbackTargetMl) > 0 &&
        Number(entry?.consumedMl ?? 0) >= Number(entry?.targetMl ?? fallbackTargetMl)
    ).length,
  };
};

const buildReportFocus = ({ mealCount, water, weight, symptoms }) => {
  const focus = [];

  if (mealCount === 0) {
    focus.push("add real meal entries so progress is measurable");
  }

  if (Number(water?.averageConsumedMl ?? 0) < Number(water?.averageTargetMl ?? 0) * 0.75) {
    focus.push("raise hydration gradually instead of catching up at night");
  }

  if (weight?.deltaKg !== null && Math.abs(Number(weight.deltaKg)) >= 2) {
    focus.push("review weight trend gently and avoid aggressive corrections");
  }

  if (Array.isArray(symptoms) && symptoms.length > 0) {
    focus.push("keep symptoms as care context and contact a clinician for severe or worsening signs");
  }

  if (focus.length === 0) {
    focus.push("keep the current rhythm and adjust one small habit at a time");
  }

  return focus.slice(0, 3);
};

const getDailyPlanProteinTarget = (profile = {}, user = {}) => {
  const explicitTarget = Number(profile?.macroTargets?.protein ?? profile?.proteinTarget);

  if (Number.isFinite(explicitTarget) && explicitTarget > 0) {
    return Math.round(explicitTarget);
  }

  const weight = Number(profile?.weight ?? user?.weight ?? 0);

  return Number.isFinite(weight) && weight > 0
    ? Math.round(Math.min(Math.max(weight * 1.4, 70), 180))
    : 100;
};

const createDailyPlanSlot = (id, focusKey, actionKey, value, reasonKey) => ({
  id,
  focusKey,
  actionKey,
  value,
  reasonKey,
});

const buildDailyPlanDraft = ({ summary, activeReminders, user }) => {
  const dailyCalories = Number(summary.profile?.dailyCalories ?? 0) || 2000;
  const consumedCalories = Math.round(Number(summary.nutrients?.calories ?? 0) || 0);
  const proteinTarget = getDailyPlanProteinTarget(summary.profile, user);
  const proteinConsumed = Math.round(Number(summary.nutrients?.protein ?? 0) || 0);
  const caloriesLeft = Math.max(dailyCalories - consumedCalories, 0);
  const proteinLeft = Math.max(proteinTarget - proteinConsumed, 0);
  const waterLeftMl = Math.max(summary.water.targetMl - summary.water.consumedMl, 0);
  const mealCount = summary.mealEntries.length;
  const slots = [
    createDailyPlanSlot(
      "morning",
      mealCount === 0 ? "first_meal" : "morning_rhythm",
      mealCount === 0 ? "log_first_meal" : "keep_breakfast_stable",
      null,
      "confirmed_meals"
    ),
    createDailyPlanSlot(
      "midday",
      proteinLeft > 35 ? "protein_anchor" : "balanced_main_meal",
      proteinLeft > 35 ? "protein_lunch" : "steady_lunch",
      proteinLeft,
      "backend_gaps"
    ),
    createDailyPlanSlot(
      "evening",
      waterLeftMl > 500 ? "gentle_hydration" : "light_recovery",
      waterLeftMl > 500 ? "spread_water" : "simple_dinner",
      waterLeftMl,
      "confirmed_water"
    ),
    createDailyPlanSlot(
      "night",
      "close_day",
      activeReminders.length > 0 ? "review_with_reminders" : "review_without_reminders",
      activeReminders.length,
      "review_only"
    ),
  ];

  return {
    caloriesLeft,
    proteinLeft,
    waterLeftMl,
    slots,
    activeReminderCount: activeReminders.length,
  };
};

const splitRecipeIngredientQueries = (text) =>
  normalizeSearchQuery(text)
    .replace(/\s+(?:и|та|і|and|plus|with|з|с)\s+/giu, ",")
    .split(/[,/]+/u)
    .map((item) => normalizeSearchQuery(item))
    .filter((item) => item.length >= 2)
    .slice(0, 5);

const getProductName = (product) =>
  [product?.brand, product?.name]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .trim() || "Product";

const inferRecipeQuantity = (product) => {
  const unit = product?.unit === "ml" ? "ml" : product?.unit === "piece" ? "piece" : "g";
  const text = `${product?.name ?? ""} ${product?.category ?? ""}`.toLowerCase();

  if (unit === "piece") return 1;
  if (unit === "ml") return 250;
  if (/rice|pasta|греч|buckwheat|oats|овсян|рис|макарон|картоф|potato/u.test(text)) return 120;
  if (/yogurt|йогурт|twar|сир|cheese|curd/u.test(text)) return 150;
  if (/banana|apple|яблок|банан|fruit|фрукт/u.test(text)) return 100;
  if (/tomato|cucumber|salad|lettuce|овощ|овоч|vegetable|капуст/u.test(text)) return 120;
  if (/oil|масл|олія|butter/u.test(text)) return 10;
  if (/nuts|almond|орех|горіх/u.test(text)) return 20;

  return 150;
};

const normalizeRecipeProduct = (product) => ({
  id: String(product?.id ?? `recipe-product-${crypto.randomUUID()}`),
  name: String(product?.name ?? "Product").trim().slice(0, 160) || "Product",
  unit: product?.unit === "ml" || product?.unit === "piece" ? product.unit : "g",
  source: ["USDA", "OpenFoodFacts", "Manual", "Recipe"].includes(product?.source)
    ? product.source
    : "Manual",
  nutrients: product?.nutrients ?? {},
  brand: product?.brand,
  barcode: product?.barcode,
  category: product?.category,
  imageUrl: product?.imageUrl,
  status: product?.status,
  facts: product?.facts,
});

const createRecipeTemplate = ({ title, mealType, items, now }) => ({
  id: createAssistantRecipeTemplateId(),
  name: `${CUSTOM_RECIPE_PREFIX}${title}`,
  mealType: toMealType(mealType),
  items: items.map((item) => ({
    product: normalizeRecipeProduct(item.product),
    quantity: Math.max(Number(item.quantity) || inferRecipeQuantity(item.product), 1),
  })),
  createdAt: now.toISOString(),
});

const getSnapshotRecipeItems = (snapshot, { fromFridge }) => {
  const fridgeItems = Array.isArray(snapshot?.fridge?.items) ? snapshot.fridge.items : [];
  const savedProducts = Array.isArray(snapshot?.meal?.savedProducts)
    ? snapshot.meal.savedProducts
    : [];
  const recentProducts = Array.isArray(snapshot?.meal?.recentProducts)
    ? snapshot.meal.recentProducts
    : [];

  if (fridgeItems.length > 0 || fromFridge) {
    return fridgeItems
      .filter((item) => item?.product)
      .map((item) => ({
        product: item.product,
        quantity: Math.max(Number(item.quantity) || inferRecipeQuantity(item.product), 1),
      }))
      .slice(0, 5);
  }

  return [...savedProducts, ...recentProducts]
    .filter(Boolean)
    .slice(0, 5)
    .map((product) => ({
      product,
      quantity: inferRecipeQuantity(product),
    }));
};

const buildRecipeTitle = (items, mealType) => {
  const names = items
    .slice(0, 3)
    .map((item) => getProductName(item.product).replace(/\s+/g, " "))
    .filter(Boolean);

  return `${mealType === "breakfast" ? "Breakfast" : mealType === "dinner" ? "Dinner" : mealType === "lunch" ? "Lunch" : "Smart"} recipe: ${names.join(" + ") || "daily ingredients"}`.slice(0, 120);
};

const findConfirmedTemplate = (mealState, templateId) =>
  Array.isArray(mealState?.templates)
    ? mealState.templates.find((template) => template?.id === templateId)
    : null;

const getLatestWeightEntry = (profile = {}) =>
  Array.isArray(profile.weightHistory) && profile.weightHistory.length > 0
    ? sortByIsoDateDesc(profile.weightHistory, "date")[0]
    : null;

const getRecentSymptoms = (profile = {}, limit = 3) => {
  const symptomHistory = Array.isArray(profile?.womenHealth?.symptomHistory)
    ? profile.womenHealth.symptomHistory
    : [];

  return sortByIsoDateDesc(symptomHistory, "recordedAt").slice(0, limit);
};

const getActiveReminders = (reminders, user, limit = 5) => {
  if (!reminders?.getUserReminders) {
    return [];
  }

  const items = reminders.getUserReminders(user);

  return Array.isArray(items)
    ? items.filter((reminder) => reminder?.active !== false).slice(0, limit)
    : [];
};

const createSnapshotSummary = async ({ user, stateService, now }) => {
  if (!stateService?.getSnapshot) {
    return null;
  }

  const snapshot = await stateService.getSnapshot(user);
  const mealEntries = getTodayMealEntries(snapshot?.meal, now);
  const nutrients = calculateMealTotalNutrients(mealEntries);
  const water = normalizeWaterStateForToday(snapshot?.water, now);

  return {
    snapshot,
    mealEntries,
    nutrients,
    water: toWaterStatus(water),
    profile: snapshot?.profile ?? {},
  };
};

const getTypedReminderCreator = (reminders, type) => {
  if (reminders?.createReminderFromUserText) {
    return (user, text, currentNow) =>
      reminders.createReminderFromUserText(user, { type, text }, currentNow);
  }

  if (type === "medication") {
    return reminders?.createMedicationReminderFromText ?? reminders?.createReminderFromText ?? null;
  }

  if (type === "medication_course") {
    return reminders?.createMedicationCourseReminderFromText ?? null;
  }

  if (type === "pregnancy_supplement") {
    return reminders?.createPregnancySupplementReminderFromText ?? null;
  }

  if (type === "water") {
    return reminders?.createWaterReminderFromText ?? null;
  }

  if (type === "habit") {
    return reminders?.createHabitReminderFromText ?? null;
  }

  if (type === "task") {
    return reminders?.createTaskReminderFromText ?? null;
  }

  return null;
};

export const createAgentTools = ({
  stateService = null,
  platformService = null,
  reminderService = null,
  medicationReminderService = null,
  now = () => new Date(),
} = {}) => {
  const reminders = reminderService ?? medicationReminderService;

  const addWater = async (user, { amountMl }) => {
    if (!stateService?.getWaterState || !stateService?.saveWaterState) {
      return { ok: false, code: "WATER_TOOL_UNAVAILABLE" };
    }

    const normalizedAmountMl = Math.min(toPositiveInteger(amountMl, 250), 3000);
    const currentWaterState = normalizeWaterStateForToday(
      await stateService.getWaterState(user),
      now()
    );
    const nextWaterState = normalizeWaterStateForToday(
      {
        ...currentWaterState,
        consumedMl: currentWaterState.consumedMl + normalizedAmountMl,
      },
      now()
    );

    await stateService.saveWaterState(user, nextWaterState, {
      source: "assistant-agent",
    });

    return {
      ok: true,
      type: "water_added",
      amountMl: normalizedAmountMl,
      water: toWaterStatus(nextWaterState),
    };
  };

  const searchProducts = async (_user, { productQuery, limit = 5 }) => {
    if (!platformService?.listVisibleCatalogProducts) {
      return { ok: false, code: "PRODUCT_SEARCH_TOOL_UNAVAILABLE" };
    }

    const search = normalizeSearchQuery(productQuery);

    if (!search) {
      return { ok: false, code: "PRODUCT_QUERY_REQUIRED" };
    }

    const products = await platformService.listVisibleCatalogProducts(_user, {
      search,
      limit: Math.max(1, Math.min(Number(limit) || 5, 8)),
    });

    return {
      ok: true,
      type: "product_search",
      query: search,
      products: Array.isArray(products) ? products.slice(0, 8) : [],
    };
  };

  const addMeal = async (user, { productQuery, quantity, mealType }) => {
    if (!stateService?.addProductIntake) {
      return { ok: false, code: "MEAL_TOOL_UNAVAILABLE" };
    }

    const productResult = await searchProducts(user, {
      productQuery,
      limit: 4,
    });

    if (!productResult.ok) {
      return productResult;
    }

    const product = productResult.products[0] ?? null;

    if (!product) {
      return {
        ok: false,
        code: "PRODUCT_NOT_FOUND",
        query: productResult.query,
      };
    }

    const normalizedQuantity = Math.min(toPositiveInteger(quantity, 100), 5000);
    const normalizedMealType = toMealType(mealType);
    const eatenAt = now().toISOString();
    const intakeResult = await stateService.addProductIntake(
      user,
      {
        source: "recommendation",
        product,
        quantity: normalizedQuantity,
        mealType: normalizedMealType,
        eatenAt,
        idempotencyKey: createAssistantMealIntakeKey(),
        options: {
          saveToLibrary: false,
          submitToCatalog: false,
        },
      },
      undefined,
      { source: "assistant-agent" }
    );

    if (intakeResult?.outcomes?.mealAdded !== true) {
      return { ok: false, code: "MEAL_NOT_CONFIRMED" };
    }

    const entry = intakeResult?.entry ?? {
      product,
      quantity: normalizedQuantity,
      mealType: normalizedMealType,
      eatenAt,
      origin: "manual",
    };

    return {
      ok: true,
      type: "meal_added",
      entry,
      product: intakeResult?.product ?? product,
      quantity: normalizedQuantity,
      mealType: entry.mealType,
      nutrients: calculateEntryNutrients(entry),
    };
  };

  const saveFavorite = async (user, { productQuery }) => {
    if (!stateService?.upsertMealProduct || !stateService?.getMealState) {
      return { ok: false, code: "FAVORITE_TOOL_UNAVAILABLE" };
    }

    const productResult = await searchProducts(user, {
      productQuery,
      limit: 4,
    });

    if (!productResult.ok) {
      return productResult;
    }

    const product = productResult.products[0] ?? null;

    if (!product) {
      return {
        ok: false,
        code: "PRODUCT_NOT_FOUND",
        query: productResult.query,
      };
    }

    await stateService.upsertMealProduct(user, "saved", product, {
      source: "assistant-agent",
    });

    const confirmedMealState = await stateService.getMealState(user);
    const confirmedProduct = Array.isArray(confirmedMealState?.savedProducts)
      ? confirmedMealState.savedProducts.find((item) => productMatchesById(item, product.id))
      : null;

    if (!confirmedProduct) {
      return { ok: false, code: "FAVORITE_NOT_CONFIRMED" };
    }

    return {
      ok: true,
      type: "favorite_saved",
      product: confirmedProduct,
    };
  };

  const createRecipe = async (user, { text = "", mealType = "snack", fromFridge = false } = {}) => {
    if (!stateService?.addMealTemplate || !stateService?.getMealState) {
      return { ok: false, code: "RECIPE_TOOL_UNAVAILABLE" };
    }

    const ingredientQueries = splitRecipeIngredientQueries(text);
    let items = [];
    let source = "snapshot";

    if (ingredientQueries.length > 0) {
      if (!platformService?.listVisibleCatalogProducts) {
        return { ok: false, code: "PRODUCT_SEARCH_TOOL_UNAVAILABLE" };
      }

      const results = [];

      for (const query of ingredientQueries) {
        const products = await platformService.listVisibleCatalogProducts(user, {
          search: query,
          limit: 3,
        });
        const product = Array.isArray(products) ? products[0] : null;

        if (product) {
          results.push({
            product,
            quantity: inferRecipeQuantity(product),
          });
        }
      }

      items = results;
      source = "catalog";
    }

    if (items.length === 0) {
      if (!stateService?.getSnapshot) {
        return { ok: false, code: "RECIPE_CONTEXT_UNAVAILABLE" };
      }

      const snapshot = await stateService.getSnapshot(user);
      items = getSnapshotRecipeItems(snapshot, { fromFridge });
    }

    if (items.length === 0) {
      return { ok: false, code: "RECIPE_INGREDIENTS_NOT_FOUND" };
    }

    const normalizedMealType = toMealType(mealType);
    const template = createRecipeTemplate({
      title: buildRecipeTitle(items, normalizedMealType),
      mealType: normalizedMealType,
      items: items.slice(0, 5),
      now: now(),
    });
    const nutrients = calculateMealTotalNutrients(
      template.items.map((item, index) => ({
        id: `${template.id}-${index}`,
        product: item.product,
        quantity: item.quantity,
        mealType: template.mealType,
        eatenAt: template.createdAt,
        origin: "recipe",
      }))
    );

    await stateService.addMealTemplate(user, template, { source: "assistant-agent" });

    const confirmedMealState = await stateService.getMealState(user);
    const confirmedTemplate = findConfirmedTemplate(confirmedMealState, template.id);

    if (!confirmedTemplate) {
      return { ok: false, code: "RECIPE_NOT_CONFIRMED" };
    }

    return {
      ok: true,
      type: "recipe_created",
      template: confirmedTemplate,
      source,
      nutrients,
    };
  };

  const openScanner = async () => ({
    ok: true,
    type: "navigation_handoff",
    targetSurface: "scanner",
    targetRoute: "/meals?mode=barcode",
  });

  const requestPhotoMealAnalysis = async () => ({
    ok: true,
    type: "navigation_handoff",
    targetSurface: "photo_meal",
    targetRoute: "/meals?mode=photo",
  });

  const logWeight = async (user, { weightKg }) => {
    if (!stateService?.getProfileState || !stateService?.saveProfileState) {
      return { ok: false, code: "WEIGHT_TOOL_UNAVAILABLE" };
    }

    const normalizedWeightKg = toWeightKg(weightKg);

    if (!normalizedWeightKg) {
      return { ok: false, code: "INVALID_WEIGHT" };
    }

    const currentProfileState = await stateService.getProfileState(user);
    const previousWeight =
      Array.isArray(currentProfileState?.weightHistory) &&
      currentProfileState.weightHistory.length > 0
        ? Number(currentProfileState.weightHistory.at(-1)?.weight)
        : Number(user?.weight ?? 0);
    const recordedAt = now().toISOString();
    const weightHistory = Array.isArray(currentProfileState?.weightHistory)
      ? currentProfileState.weightHistory
      : [];
    const nextProfileState = {
      ...currentProfileState,
      weightHistory: [
        ...weightHistory,
        {
          date: recordedAt,
          weight: normalizedWeightKg,
        },
      ].slice(-180),
    };

    await stateService.saveProfileState(user, nextProfileState, {
      source: "assistant-agent",
    });

    const confirmedProfileState = await stateService.getProfileState(user);
    const confirmedEntry = Array.isArray(confirmedProfileState?.weightHistory)
      ? confirmedProfileState.weightHistory.find(
          (entry) => entry?.date === recordedAt && Number(entry?.weight) === normalizedWeightKg
        )
      : null;

    if (!confirmedEntry) {
      return { ok: false, code: "WEIGHT_NOT_CONFIRMED" };
    }

    return {
      ok: true,
      type: "weight_logged",
      weightKg: normalizedWeightKg,
      previousWeightKg: Number.isFinite(previousWeight) && previousWeight > 0 ? previousWeight : null,
      recordedAt,
    };
  };

  const logSymptom = async (user, { label, severity = 5, text = "" }) => {
    if (!stateService?.getProfileState || !stateService?.saveProfileState) {
      return { ok: false, code: "SYMPTOM_TOOL_UNAVAILABLE" };
    }

    const normalizedLabel = normalizeSymptomLabel(label);

    if (!normalizedLabel) {
      return { ok: false, code: "INVALID_SYMPTOM" };
    }

    const currentProfileState = await stateService.getProfileState(user);
    const currentWomenHealth = currentProfileState?.womenHealth ?? {};
    const currentHistory = Array.isArray(currentWomenHealth.symptomHistory)
      ? currentWomenHealth.symptomHistory
      : [];
    const entry = {
      id: createAssistantSymptomId(),
      recordedAt: now().toISOString(),
      label: normalizedLabel,
      severity: toSymptomSeverity(severity),
      note: String(text ?? "").trim().replace(/\s+/g, " ").slice(0, 180),
      source: "assistant",
    };
    const nextProfileState = {
      ...currentProfileState,
      womenHealth: {
        ...currentWomenHealth,
        symptomHistory: [...currentHistory, entry].slice(-60),
        updatedAt: entry.recordedAt,
      },
    };

    await stateService.saveProfileState(user, nextProfileState, {
      source: "assistant-agent",
    });

    const confirmedProfileState = await stateService.getProfileState(user);
    const confirmedEntry = Array.isArray(confirmedProfileState?.womenHealth?.symptomHistory)
      ? confirmedProfileState.womenHealth.symptomHistory.find((item) => item?.id === entry.id)
      : null;

    if (!confirmedEntry) {
      return { ok: false, code: "SYMPTOM_NOT_CONFIRMED" };
    }

    return {
      ok: true,
      type: "symptom_logged",
      symptom: confirmedEntry,
    };
  };

  const createMedicationReminder = async (user, { text }) => {
    const createMedicationReminderFromText = getTypedReminderCreator(
      reminders,
      "medication"
    );

    if (!createMedicationReminderFromText) {
      return { ok: false, code: "MEDICATION_TOOL_UNAVAILABLE" };
    }

    const result = await createMedicationReminderFromText(user, text, now());
    const profile = await stateService?.getProfileState?.(user).catch(() => null);
    const womenHealth = profile?.womenHealth ?? null;

    if (!result?.ok) {
      return {
        ok: false,
        code: result?.code ?? "MEDICATION_REMINDER_PARSE_FAILED",
      };
    }

    return {
      ok: true,
      type: "medication_reminder_created",
      reminder: result.reminder,
      healthContext: {
        womenHealthMode: womenHealth?.mode ?? "none",
        doctorConfirmed: Boolean(womenHealth?.doctorConfirmed),
      },
    };
  };

  const createTaskReminder = async (user, { text }) => {
    const createTaskReminderFromText = getTypedReminderCreator(reminders, "task");

    if (!createTaskReminderFromText) {
      return { ok: false, code: "TASK_REMINDER_TOOL_UNAVAILABLE" };
    }

    const result = await createTaskReminderFromText(
      user,
      text,
      now()
    );

    if (!result?.ok) {
      return {
        ok: false,
        code: result?.code ?? "TASK_REMINDER_PARSE_FAILED",
      };
    }

    return {
      ok: true,
      type: "task_reminder_created",
      reminder: result.reminder,
    };
  };

  const createFollowUp = async (user, { text }) => {
    const createTaskReminderFromText = getTypedReminderCreator(reminders, "task");

    if (!createTaskReminderFromText) {
      return { ok: false, code: "FOLLOW_UP_TOOL_UNAVAILABLE" };
    }

    const currentNow = now();
    const reminderText = buildFollowUpReminderText(text, currentNow);
    const result = await createTaskReminderFromText(user, reminderText, currentNow);

    if (!result?.ok) {
      return {
        ok: false,
        code: result?.code ?? "FOLLOW_UP_PARSE_FAILED",
      };
    }

    return {
      ok: true,
      type: "follow_up_created",
      reminder: result.reminder,
      reminderText,
    };
  };

  const createTypedReminder = async (user, { type, text }) => {
    const createReminder = getTypedReminderCreator(reminders, type);

    if (!createReminder) {
      return { ok: false, code: "REMINDER_TOOL_UNAVAILABLE" };
    }

    const result = await createReminder(user, text, now());

    if (!result?.ok) {
      return {
        ok: false,
        code: result?.code ?? "REMINDER_PARSE_FAILED",
      };
    }

    return {
      ok: true,
      type: "reminder_created",
      reminderKind: result.reminder?.type ?? type,
      reminder: result.reminder,
    };
  };


  const getDayStatus = async (user) => {
    const summary = await createSnapshotSummary({ user, stateService, now: now() });

    if (!summary) {
      return { ok: false, code: "STATE_TOOL_UNAVAILABLE" };
    }

    return {
      ok: true,
      type: "day_status",
      mealCount: summary.mealEntries.length,
      nutrients: summary.nutrients,
      water: summary.water,
      dailyCalories: Number(summary.profile?.dailyCalories ?? 0) || 0,
    };
  };

  const getWaterStatus = async (user) => {
    if (!stateService?.getWaterState) {
      return { ok: false, code: "WATER_TOOL_UNAVAILABLE" };
    }

    const waterState = normalizeWaterStateForToday(await stateService.getWaterState(user), now());

    return {
      ok: true,
      type: "water_status",
      water: toWaterStatus(waterState),
    };
  };

  const getNutritionStatus = async (user) => {
    const summary = await createSnapshotSummary({ user, stateService, now: now() });

    if (!summary) {
      return { ok: false, code: "STATE_TOOL_UNAVAILABLE" };
    }

    return {
      ok: true,
      type: "nutrition_status",
      mealCount: summary.mealEntries.length,
      nutrients: summary.nutrients,
      dailyCalories: Number(summary.profile?.dailyCalories ?? 0) || 0,
    };
  };

  const generateDaySummary = async (user) => {
    const summary = await createSnapshotSummary({ user, stateService, now: now() });

    if (!summary) {
      return { ok: false, code: "STATE_TOOL_UNAVAILABLE" };
    }

    const dailyCalories = Number(summary.profile?.dailyCalories ?? 0) || 0;
    const activeReminders = getActiveReminders(reminders, user);
    const latestWeight = getLatestWeightEntry(summary.profile);
    const recentSymptoms = getRecentSymptoms(summary.profile);

    return {
      ok: true,
      type: "day_summary",
      date: createDateKey(now()),
      mealCount: summary.mealEntries.length,
      nutrients: summary.nutrients,
      dailyCalories,
      caloriePercent: calculatePercent(summary.nutrients.calories, dailyCalories),
      water: {
        ...summary.water,
        percent: calculatePercent(summary.water.consumedMl, summary.water.targetMl),
      },
      activeReminders,
      latestWeight,
      recentSymptoms,
      womenHealthMode: summary.profile?.womenHealth?.mode ?? "none",
    };
  };

  const generateDailyPlan = async (user) => {
    const summary = await createSnapshotSummary({ user, stateService, now: now() });

    if (!summary) {
      return { ok: false, code: "STATE_TOOL_UNAVAILABLE" };
    }

    const activeReminders = getActiveReminders(reminders, user);
    const dailyCalories = Number(summary.profile?.dailyCalories ?? 0) || 2000;
    const plan = buildDailyPlanDraft({ summary, activeReminders, user });

    return {
      ok: true,
      type: "daily_plan_draft",
      date: createDateKey(now()),
      mealCount: summary.mealEntries.length,
      nutrients: summary.nutrients,
      dailyCalories,
      water: {
        ...summary.water,
        percent: calculatePercent(summary.water.consumedMl, summary.water.targetMl),
      },
      activeReminders,
      plan,
      reviewOnly: true,
    };
  };

  const applyDailyPlanItem = async (user, { planItem = "food" } = {}) => {
    const normalizedPlanItem = String(planItem ?? "food");

    if (normalizedPlanItem === "water" || normalizedPlanItem === "review") {
      const type = normalizedPlanItem === "water" ? "water" : "task";
      const createReminder = getTypedReminderCreator(reminders, type);

      if (!createReminder) {
        return { ok: false, code: "PLAN_REMINDER_TOOL_UNAVAILABLE" };
      }

      const reminderTime = buildPlanReminderTime(now());
      const text =
        normalizedPlanItem === "water"
          ? `пити воду о ${reminderTime}`
          : `перевірити план Smart Nutrition о ${reminderTime}`;
      const result = await createReminder(user, text, now());

      if (!result?.ok) {
        return {
          ok: false,
          code: result?.code ?? "PLAN_REMINDER_PARSE_FAILED",
        };
      }

      return {
        ok: true,
        type: "daily_plan_item_applied",
        appliedAction: normalizedPlanItem === "water" ? "water_reminder" : "review_reminder",
        reminder: result.reminder,
        reminderText: text,
      };
    }

    if (normalizedPlanItem === "photo") {
      return requestPhotoMealAnalysis(user, {});
    }

    if (normalizedPlanItem === "scanner") {
      return openScanner(user, {});
    }

    return {
      ok: true,
      type: "navigation_handoff",
      targetSurface: "food",
      planItem: normalizedPlanItem === "protein" ? "protein" : "food",
      targetRoute:
        normalizedPlanItem === "protein"
          ? "/meals?mode=search&focus=protein"
          : "/meals?mode=search&focus=food",
    };
  };

  const generateReport = async (user, { period = "week" } = {}) => {
    const currentNow = now();
    const summary = await createSnapshotSummary({ user, stateService, now: currentNow });

    if (!summary) {
      return { ok: false, code: "STATE_TOOL_UNAVAILABLE" };
    }

    const window = createReportWindow(period, currentNow);
    const mealEntries = getReportMealEntries(summary.snapshot?.meal, window);
    const nutrients = calculateMealTotalNutrients(mealEntries);
    const water = calculateReportWater(summary.snapshot?.water, window);
    const weightEntries = getReportWeightEntries(summary.profile, window);
    const firstWeight = Number(weightEntries[0]?.weight);
    const lastWeight = Number(weightEntries.at(-1)?.weight);
    const hasWeightTrend =
      Number.isFinite(firstWeight) && firstWeight > 0 &&
      Number.isFinite(lastWeight) && lastWeight > 0;
    const symptoms = getReportSymptomEntries(summary.profile, window);
    const activeReminders = getActiveReminders(reminders, user);
    const averageCalories = Math.round(Number(nutrients.calories ?? 0) / window.days);
    const dailyCalories = Number(summary.profile?.dailyCalories ?? 0) || 0;
    const weight = {
      entries: weightEntries.length,
      firstKg: hasWeightTrend ? firstWeight : null,
      lastKg: hasWeightTrend ? lastWeight : null,
      deltaKg: hasWeightTrend ? Math.round((lastWeight - firstWeight) * 10) / 10 : null,
    };

    return {
      ok: true,
      type: "progress_report",
      period: window.period,
      startDate: window.startDate,
      endDate: window.endDate,
      days: window.days,
      mealCount: mealEntries.length,
      nutrients,
      averageCalories,
      dailyCalories,
      caloriePercent: calculatePercent(averageCalories, dailyCalories),
      water,
      weight,
      recentSymptoms: symptoms,
      activeReminders,
      womenHealthMode: summary.profile?.womenHealth?.mode ?? "none",
      coachingFocus: buildReportFocus({
        mealCount: mealEntries.length,
        water,
        weight,
        symptoms,
      }),
    };
  };

  return {
    addWater,
    addMeal,
    saveFavorite,
    createRecipe,
    openScanner,
    requestPhotoMealAnalysis,
    logWeight,
    logSymptom,
    searchProducts,
    createMedicationReminder,
    createTaskReminder,
    createFollowUp,
    createTypedReminder,
    getDayStatus,
    generateDaySummary,
    generateDailyPlan,
    applyDailyPlanItem,
    generateReport,
    getWaterStatus,
    getNutritionStatus,
  };
};
