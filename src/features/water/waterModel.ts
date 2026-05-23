import { addDays, getLocalDateKey } from "../../shared/lib/date";

export interface WaterState {
  dailyWaterGoal: number;
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

export interface WeeklyWaterRecord {
  date: string;
  consumedMl: number;
  targetMl: number;
}

export interface WaterGlassSlot {
  index: number;
  slotStart: number;
  slotEnd: number;
  fill: number;
}

const MIN_DAILY_TARGET_ML = 2000;
const MAX_DAILY_TARGET_ML = 3000;
const MIN_GLASS_SIZE_ML = 100;
const DEFAULT_DAILY_TARGET_ML = 2000;
const DEFAULT_GLASS_SIZE_ML = 250;
const WATER_HISTORY_LIMIT = 30;

const toPositiveNumber = (value: unknown, fallback: number) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) && nextValue > 0 ? nextValue : fallback;
};

const clampToZero = (value: unknown) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 0;
};

const isDateKey = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const isTimeString = (value: unknown) =>
  typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const minutesFromTime = (value: string) => {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
};

export const createWaterDayKey = (date = new Date()) => getLocalDateKey(date);

export const getWaterDayKeyOffset = (daysAgo: number, baseDate = new Date()) =>
  createWaterDayKey(addDays(baseDate, -daysAgo));

export const formatWaterLiters = (valueMl: number) => (valueMl / 1000).toFixed(1);

export const normalizeDailyWaterGoal = (value: unknown) =>
  Math.min(
    Math.max(Math.round(toPositiveNumber(value, DEFAULT_DAILY_TARGET_ML)), MIN_DAILY_TARGET_ML),
    MAX_DAILY_TARGET_ML
  );

export const calculateRecommendedWaterTarget = (weightKg: number) =>
  normalizeDailyWaterGoal(Math.round(weightKg * 33));

export const createWaterHistoryEntry = (
  date: string,
  consumedMl: number,
  targetMl: number,
  updatedAt = new Date().toISOString()
): WaterHistoryEntry => ({
  date,
  consumedMl: Math.max(Math.round(consumedMl), 0),
  targetMl: normalizeDailyWaterGoal(targetMl),
  updatedAt,
});

export const createDefaultWaterReminders = (): WaterReminderSettings => ({
  enabled: false,
  intervalMinutes: 120,
  startTime: "09:00",
  endTime: "21:00",
  lastReminderAt: null,
});

export const normalizeWaterHistoryEntry = (
  value: unknown
): WaterHistoryEntry | null => {
  const record =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  const date = typeof record.date === "string" ? record.date : "";

  if (!isDateKey(date)) {
    return null;
  }

  return createWaterHistoryEntry(
    date,
    clampToZero(record.consumedMl),
    normalizeDailyWaterGoal(record.targetMl),
    typeof record.updatedAt === "string" ? record.updatedAt : new Date().toISOString()
  );
};

export const normalizeWaterReminders = (value: unknown): WaterReminderSettings => {
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

export const upsertWaterHistory = (
  state: WaterState,
  date = state.lastLoggedOn ?? createWaterDayKey()
) => {
  const nextEntry = createWaterHistoryEntry(
    date,
    state.consumedMl,
    state.dailyWaterGoal
  );
  const nextHistory = [
    nextEntry,
    ...state.history.filter((entry) => entry.date !== date),
  ]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, WATER_HISTORY_LIMIT);

  state.history = nextHistory;
};

export const syncTodayWaterState = (state: WaterState) => {
  const today = createWaterDayKey();

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
  const today = createWaterDayKey();

  return {
    dailyWaterGoal: DEFAULT_DAILY_TARGET_ML,
    consumedMl: 0,
    glassSizeMl: DEFAULT_GLASS_SIZE_ML,
    lastLoggedOn: today,
    targetMode: "automatic",
    history: [createWaterHistoryEntry(today, 0, DEFAULT_DAILY_TARGET_ML)],
    reminders: createDefaultWaterReminders(),
  };
};

export const normalizeWaterState = (value: unknown): WaterState => {
  const record =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  const legacyDailyTargetMl = record.dailyTargetMl;

  const state: WaterState = {
    dailyWaterGoal: normalizeDailyWaterGoal(
      record.dailyWaterGoal ?? legacyDailyTargetMl,
    ),
    consumedMl: clampToZero(record.consumedMl),
    glassSizeMl: toPositiveNumber(record.glassSizeMl, DEFAULT_GLASS_SIZE_ML),
    lastLoggedOn:
      typeof record.lastLoggedOn === "string" && record.lastLoggedOn.trim().length > 0
        ? record.lastLoggedOn
        : createWaterDayKey(),
    targetMode: record.targetMode === "manual" ? "manual" : "automatic",
    history: Array.isArray(record.history)
      ? record.history
          .map((item) => normalizeWaterHistoryEntry(item))
          .filter((item): item is WaterHistoryEntry => item !== null)
          .slice(0, WATER_HISTORY_LIMIT)
      : [],
    reminders: normalizeWaterReminders(record.reminders),
  };

  upsertWaterHistory(state, state.lastLoggedOn ?? createWaterDayKey());

  return state;
};

export const createWeeklyWaterRecords = (
  water: Pick<WaterState, "history" | "consumedMl" | "dailyWaterGoal">,
  baseDate = new Date()
): WeeklyWaterRecord[] => {
  const historyByDate = new Map(water.history.map((entry) => [entry.date, entry]));
  const todayKey = createWaterDayKey(baseDate);

  return Array.from({ length: 7 }, (_, index) => {
    const date = getWaterDayKeyOffset(6 - index, baseDate);
    const historyEntry = historyByDate.get(date);
    const consumedMl = date === todayKey ? water.consumedMl : historyEntry?.consumedMl ?? 0;
    const targetMl =
      date === todayKey ? water.dailyWaterGoal : historyEntry?.targetMl ?? water.dailyWaterGoal;

    return {
      date,
      consumedMl,
      targetMl,
    };
  });
};

export const createWaterGlassSlots = (
  consumedMl: number,
  dailyWaterGoal: number,
  glassSizeMl: number,
  minSlotCount = 6
): WaterGlassSlot[] => {
  const normalizedGlassSize = Math.max(Math.round(glassSizeMl), MIN_GLASS_SIZE_ML);
  const glassCount = Math.max(
    Math.ceil(Math.max(dailyWaterGoal, 0) / normalizedGlassSize),
    minSlotCount
  );

  return Array.from({ length: glassCount }, (_, index) => {
    const slotStart = index * normalizedGlassSize;
    const fill = Math.min(
      Math.max((Math.max(consumedMl, 0) - slotStart) / normalizedGlassSize, 0),
      1
    );

    return {
      index,
      slotStart,
      slotEnd: slotStart + normalizedGlassSize,
      fill,
    };
  });
};

export const getQuickWaterAmounts = (glassSizeMl: number) =>
  [...new Set([100, 150, Math.max(Math.round(glassSizeMl), MIN_GLASS_SIZE_ML)])].sort(
    (left, right) => left - right
  );

export const getEditableWaterSlot = (
  consumedMl: number,
  glassSizeMl: number,
  slotCount: number
) => {
  const normalizedGlassSize = Math.max(Math.round(glassSizeMl), MIN_GLASS_SIZE_ML);
  const index = Math.min(
    Math.floor(Math.max(consumedMl, 0) / normalizedGlassSize),
    Math.max(slotCount - 1, 0)
  );
  const slotStart = index * normalizedGlassSize;
  const currentAmount = Math.max(consumedMl - slotStart, 0);

  return {
    index,
    amountMl: currentAmount > 0 ? Math.round(currentAmount) : normalizedGlassSize,
  };
};

export const normalizeWaterSlotAmount = (amountMl: number, glassSizeMl: number) =>
  Math.min(
    Math.max(Math.round(amountMl), 0),
    Math.max(Math.round(glassSizeMl), MIN_GLASS_SIZE_ML)
  );

export const isWithinReminderWindow = (
  startTime: string,
  endTime: string,
  date = new Date()
) => {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const startMinutes = minutesFromTime(startTime);
  const endMinutes = minutesFromTime(endTime);

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
};
