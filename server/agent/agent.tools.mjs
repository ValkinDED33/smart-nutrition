import { calculateMealTotalNutrients, createInitialWaterState } from "../lib/domain.mjs";

const createDateKey = (date = new Date()) => date.toISOString().slice(0, 10);

const toPositiveInteger = (value, fallback) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) && nextValue > 0 ? Math.round(nextValue) : fallback;
};

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

export const createAgentTools = ({
  stateService = null,
  medicationReminderService = null,
  now = () => new Date(),
} = {}) => {
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

  const createMedicationReminder = async (user, { text }) => {
    if (!medicationReminderService?.createReminderFromText) {
      return { ok: false, code: "MEDICATION_TOOL_UNAVAILABLE" };
    }

    const result = await medicationReminderService.createReminderFromText(user, text, now());
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
    createMedicationReminder,
    getDayStatus,
    getWaterStatus,
    getNutritionStatus,
  };
};
