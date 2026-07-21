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

  return {
    addWater,
    addMeal,
    saveFavorite,
    logWeight,
    logSymptom,
    searchProducts,
    createMedicationReminder,
    createTaskReminder,
    createFollowUp,
    createTypedReminder,
    getDayStatus,
    generateDaySummary,
    getWaterStatus,
    getNutritionStatus,
  };
};
