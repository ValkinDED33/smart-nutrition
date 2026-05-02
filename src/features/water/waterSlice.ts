import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface WaterState {
  dailyTargetMl: number;
  consumedMl: number;
  glassSizeMl: number;
  lastLoggedOn: string | null;
  targetMode: "automatic" | "manual";
  history: WaterHistoryEntry[];
  reminders: WaterReminderSettings;
}

export interface WaterHistoryEntry {
  date: string;
  consumedMl: number;
  targetMl: number;
  updatedAt: string;
}

export interface WaterReminderSettings {
  enabled: boolean;
  intervalMinutes: number;
  startTime: string;
  endTime: string;
  lastReminderAt: string | null;
}

const createLocalDayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toPositiveNumber = (value: unknown, fallback: number) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) && nextValue > 0 ? nextValue : fallback;
};

const clampToZero = (value: unknown) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 0;
};

const calculateRecommendedTarget = (weightKg: number) =>
  Math.max(Math.round(weightKg * 33), 250);

const isTimeString = (value: unknown) =>
  typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const createWaterHistoryEntry = (
  date: string,
  consumedMl: number,
  targetMl: number,
  updatedAt = new Date().toISOString()
): WaterHistoryEntry => ({
  date,
  consumedMl: Math.max(Math.round(consumedMl), 0),
  targetMl: Math.max(Math.round(targetMl), 250),
  updatedAt,
});

const createDefaultWaterReminders = (): WaterReminderSettings => ({
  enabled: false,
  intervalMinutes: 120,
  startTime: "09:00",
  endTime: "21:00",
  lastReminderAt: null,
});

const normalizeWaterHistoryEntry = (value: unknown): WaterHistoryEntry | null => {
  const record =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  const date = typeof record.date === "string" ? record.date : "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  return createWaterHistoryEntry(
    date,
    clampToZero(record.consumedMl),
    toPositiveNumber(record.targetMl, 2000),
    typeof record.updatedAt === "string" ? record.updatedAt : new Date().toISOString()
  );
};

const normalizeWaterReminders = (value: unknown): WaterReminderSettings => {
  const fallback = createDefaultWaterReminders();
  const record =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  return {
    enabled: Boolean(record.enabled),
    intervalMinutes: Math.max(
      Math.round(toPositiveNumber(record.intervalMinutes, fallback.intervalMinutes)),
      30
    ),
    startTime: isTimeString(record.startTime) ? String(record.startTime) : fallback.startTime,
    endTime: isTimeString(record.endTime) ? String(record.endTime) : fallback.endTime,
    lastReminderAt:
      typeof record.lastReminderAt === "string" && record.lastReminderAt.trim().length > 0
        ? record.lastReminderAt
        : null,
  };
};

const upsertWaterHistory = (
  state: WaterState,
  date = state.lastLoggedOn ?? createLocalDayKey()
) => {
  const nextEntry = createWaterHistoryEntry(
    date,
    state.consumedMl,
    state.dailyTargetMl
  );
  const nextHistory = [
    nextEntry,
    ...state.history.filter((entry) => entry.date !== date),
  ]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 30);

  state.history = nextHistory;
};

const getTodayWaterState = (state: WaterState) => {
  const today = createLocalDayKey();

  if (state.lastLoggedOn !== today) {
    if (state.lastLoggedOn) {
      upsertWaterHistory(state, state.lastLoggedOn);
    }

    state.lastLoggedOn = today;
    state.consumedMl = 0;
    upsertWaterHistory(state, today);
  }
};

export const createInitialWaterState = (): WaterState => {
  const today = createLocalDayKey();

  return {
    dailyTargetMl: 2000,
    consumedMl: 0,
    glassSizeMl: 250,
    lastLoggedOn: today,
    targetMode: "automatic",
    history: [createWaterHistoryEntry(today, 0, 2000)],
    reminders: createDefaultWaterReminders(),
  };
};

export const normalizeWaterState = (value: unknown): WaterState => {
  const record =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  const state: WaterState = {
    dailyTargetMl: toPositiveNumber(record.dailyTargetMl, 2000),
    consumedMl: clampToZero(record.consumedMl),
    glassSizeMl: toPositiveNumber(record.glassSizeMl, 250),
    lastLoggedOn:
      typeof record.lastLoggedOn === "string" && record.lastLoggedOn.trim().length > 0
        ? record.lastLoggedOn
        : createLocalDayKey(),
    targetMode: record.targetMode === "manual" ? "manual" : "automatic",
    history: Array.isArray(record.history)
      ? record.history
          .map((item) => normalizeWaterHistoryEntry(item))
          .filter((item): item is WaterHistoryEntry => item !== null)
          .slice(0, 30)
      : [],
    reminders: normalizeWaterReminders(record.reminders),
  };

  upsertWaterHistory(state, state.lastLoggedOn ?? createLocalDayKey());

  return state;
};

const initialState = createInitialWaterState();

const waterSlice = createSlice({
  name: "water",
  initialState,
  reducers: {
    replaceWaterState: (_, action: PayloadAction<unknown>) =>
      normalizeWaterState(action.payload),

    syncWaterDay(state) {
      getTodayWaterState(state);
      upsertWaterHistory(state);
    },

    setWaterTarget(state, action: PayloadAction<number>) {
      getTodayWaterState(state);
      state.dailyTargetMl = Math.max(Math.round(action.payload), 250);
      state.consumedMl = Math.min(state.consumedMl, state.dailyTargetMl + state.glassSizeMl * 4);
      state.targetMode = "manual";
      upsertWaterHistory(state);
    },

    syncWaterTargetFromWeight(state, action: PayloadAction<number | null | undefined>) {
      getTodayWaterState(state);

      if (state.targetMode !== "automatic") {
        return;
      }

      const weight = Number(action.payload ?? 0);

      if (!Number.isFinite(weight) || weight <= 0) {
        return;
      }

      state.dailyTargetMl = calculateRecommendedTarget(weight);
      state.consumedMl = Math.min(state.consumedMl, state.dailyTargetMl + state.glassSizeMl * 4);
      upsertWaterHistory(state);
    },

    setWaterGlassSize(state, action: PayloadAction<number>) {
      getTodayWaterState(state);
      state.glassSizeMl = Math.max(Math.round(action.payload), 100);
      upsertWaterHistory(state);
    },

    setWaterConsumed(state, action: PayloadAction<number>) {
      getTodayWaterState(state);
      state.consumedMl = Math.max(Math.round(action.payload), 0);
      upsertWaterHistory(state);
    },

    incrementWater(state, action: PayloadAction<number>) {
      getTodayWaterState(state);
      state.consumedMl = Math.max(state.consumedMl + Math.round(action.payload), 0);
      upsertWaterHistory(state);
    },

    resetWaterTracker(state) {
      state.consumedMl = 0;
      state.lastLoggedOn = createLocalDayKey();
      upsertWaterHistory(state);
    },

    setWaterReminders(
      state,
      action: PayloadAction<Partial<WaterReminderSettings>>
    ) {
      state.reminders = normalizeWaterReminders({
        ...state.reminders,
        ...action.payload,
      });
    },

    markWaterReminderShown(state, action: PayloadAction<string | undefined>) {
      state.reminders.lastReminderAt = action.payload ?? new Date().toISOString();
    },
  },
});

export const {
  replaceWaterState,
  syncWaterDay,
  setWaterTarget,
  syncWaterTargetFromWeight,
  setWaterGlassSize,
  setWaterConsumed,
  incrementWater,
  resetWaterTracker,
  setWaterReminders,
  markWaterReminderShown,
} = waterSlice.actions;

export default waterSlice.reducer;
