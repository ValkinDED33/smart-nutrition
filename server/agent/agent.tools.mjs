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

const createMealEntryId = () => `meal-${crypto.randomUUID()}`;

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
    if (!stateService?.addMealEntries) {
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
    const entry = {
      id: createMealEntryId(),
      product,
      quantity: normalizedQuantity,
      mealType: toMealType(mealType),
      eatenAt: now().toISOString(),
      origin: "manual",
    };

    await stateService.addMealEntries(
      user,
      {
        entries: [entry],
      },
      { source: "assistant-agent" }
    );

    return {
      ok: true,
      type: "meal_added",
      entry,
      product,
      quantity: normalizedQuantity,
      mealType: entry.mealType,
      nutrients: calculateEntryNutrients(entry),
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

  return {
    addWater,
    addMeal,
    searchProducts,
    createMedicationReminder,
    createTaskReminder,
    createTypedReminder,
    getDayStatus,
    getWaterStatus,
    getNutritionStatus,
  };
};
