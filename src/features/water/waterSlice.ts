import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface WaterState {
  dailyTargetMl: number;
  consumedMl: number;
  glassSizeMl: number;
  lastLoggedOn: string | null;
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

const getTodayWaterState = (state: WaterState) => {
  const today = createLocalDayKey();

  if (state.lastLoggedOn !== today) {
    state.lastLoggedOn = today;
    state.consumedMl = 0;
  }
};

export const createInitialWaterState = (): WaterState => ({
  dailyTargetMl: 2000,
  consumedMl: 0,
  glassSizeMl: 250,
  lastLoggedOn: createLocalDayKey(),
});

export const normalizeWaterState = (value: unknown): WaterState => {
  const record =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  return {
    dailyTargetMl: toPositiveNumber(record.dailyTargetMl, 2000),
    consumedMl: clampToZero(record.consumedMl),
    glassSizeMl: toPositiveNumber(record.glassSizeMl, 250),
    lastLoggedOn:
      typeof record.lastLoggedOn === "string" && record.lastLoggedOn.trim().length > 0
        ? record.lastLoggedOn
        : createLocalDayKey(),
  };
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
    },

    setWaterTarget(state, action: PayloadAction<number>) {
      getTodayWaterState(state);
      state.dailyTargetMl = Math.max(Math.round(action.payload), 250);
      state.consumedMl = Math.min(state.consumedMl, state.dailyTargetMl + state.glassSizeMl * 4);
    },

    setWaterGlassSize(state, action: PayloadAction<number>) {
      getTodayWaterState(state);
      state.glassSizeMl = Math.max(Math.round(action.payload), 100);
    },

    setWaterConsumed(state, action: PayloadAction<number>) {
      getTodayWaterState(state);
      state.consumedMl = Math.max(Math.round(action.payload), 0);
    },

    incrementWater(state, action: PayloadAction<number>) {
      getTodayWaterState(state);
      state.consumedMl = Math.max(state.consumedMl + Math.round(action.payload), 0);
    },

    resetWaterTracker(state) {
      state.consumedMl = 0;
      state.lastLoggedOn = createLocalDayKey();
    },
  },
});

export const {
  replaceWaterState,
  syncWaterDay,
  setWaterTarget,
  setWaterGlassSize,
  setWaterConsumed,
  incrementWater,
  resetWaterTracker,
} = waterSlice.actions;

export default waterSlice.reducer;
