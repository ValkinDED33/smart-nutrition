import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  calculateRecommendedWaterTarget,
  createInitialWaterState,
  createWaterDayKey,
  normalizeWaterReminders,
  normalizeWaterState,
  syncTodayWaterState,
  upsertWaterHistory,
} from "./waterModel";
import type { WaterReminderSettings } from "./waterModel";

export type {
  WaterHistoryEntry,
  WaterReminderSettings,
  WaterState,
} from "./waterModel";
export { createInitialWaterState, normalizeWaterState } from "./waterModel";

const initialState = createInitialWaterState();

const waterSlice = createSlice({
  name: "water",
  initialState,
  reducers: {
    replaceWaterState: (_, action: PayloadAction<unknown>) =>
      normalizeWaterState(action.payload),

    syncWaterDay(state) {
      syncTodayWaterState(state);
      upsertWaterHistory(state);
    },

    setWaterTarget(state, action: PayloadAction<number>) {
      syncTodayWaterState(state);
      state.dailyTargetMl = Math.max(Math.round(action.payload), 250);
      state.consumedMl = Math.min(state.consumedMl, state.dailyTargetMl + state.glassSizeMl * 4);
      state.targetMode = "manual";
      upsertWaterHistory(state);
    },

    syncWaterTargetFromWeight(state, action: PayloadAction<number | null | undefined>) {
      syncTodayWaterState(state);

      if (state.targetMode !== "automatic") {
        return;
      }

      const weight = Number(action.payload ?? 0);

      if (!Number.isFinite(weight) || weight <= 0) {
        return;
      }

      state.dailyTargetMl = calculateRecommendedWaterTarget(weight);
      state.consumedMl = Math.min(state.consumedMl, state.dailyTargetMl + state.glassSizeMl * 4);
      upsertWaterHistory(state);
    },

    setWaterGlassSize(state, action: PayloadAction<number>) {
      syncTodayWaterState(state);
      state.glassSizeMl = Math.max(Math.round(action.payload), 100);
      upsertWaterHistory(state);
    },

    setWaterConsumed(state, action: PayloadAction<number>) {
      syncTodayWaterState(state);
      state.consumedMl = Math.max(Math.round(action.payload), 0);
      upsertWaterHistory(state);
    },

    incrementWater(state, action: PayloadAction<number>) {
      syncTodayWaterState(state);
      state.consumedMl = Math.max(state.consumedMl + Math.round(action.payload), 0);
      upsertWaterHistory(state);
    },

    resetWaterTracker(state) {
      state.consumedMl = 0;
      state.lastLoggedOn = createWaterDayKey();
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
