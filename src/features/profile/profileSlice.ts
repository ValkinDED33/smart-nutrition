import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Goal } from "../../shared/types/user";

interface WeightHistoryItem {
  date: string;
  weight: number;
}

interface ProfileState {
  dailyCalories: number;
  goal: Goal;
  weightHistory: WeightHistoryItem[];
  maintenanceCalories: number;
  adaptiveCalories: number | null;
}

interface ProfileTargetsPayload {
  goal: Goal;
  weight: number;
  maintenanceCalories: number;
  targetCalories: number;
}

const initialState: ProfileState = {
  dailyCalories: 0,
  goal: "maintain",
  weightHistory: [],
  maintenanceCalories: 0,
  adaptiveCalories: null,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setDailyCalories(state, action: PayloadAction<number>) {
      state.dailyCalories = action.payload;
    },

    setMaintenanceCalories(state, action: PayloadAction<number>) {
      state.maintenanceCalories = action.payload;
    },

    setAdaptiveCalories(state, action: PayloadAction<number | null>) {
      state.adaptiveCalories = action.payload;
      if (action.payload !== null) {
        state.dailyCalories = action.payload;
      }
    },

    setGoal(state, action: PayloadAction<Goal>) {
      state.goal = action.payload;
    },

    updateWeight(state, action: PayloadAction<number>) {
      state.weightHistory.push({
        date: new Date().toISOString(),
        weight: action.payload,
      });
    },

    applyProfileTargets(state, action: PayloadAction<ProfileTargetsPayload>) {
      state.goal = action.payload.goal;
      state.maintenanceCalories = action.payload.maintenanceCalories;
      state.adaptiveCalories = action.payload.targetCalories;
      state.dailyCalories = action.payload.targetCalories;
      state.weightHistory.push({
        date: new Date().toISOString(),
        weight: action.payload.weight,
      });
    },

    resetProfile(state) {
      state.dailyCalories = 0;
      state.goal = "maintain";
      state.weightHistory = [];
      state.maintenanceCalories = 0;
      state.adaptiveCalories = null;
    },
  },
});

export const {
  setDailyCalories,
  setMaintenanceCalories,
  setAdaptiveCalories,
  setGoal,
  updateWeight,
  applyProfileTargets,
  resetProfile,
} = profileSlice.actions;

export default profileSlice.reducer;
