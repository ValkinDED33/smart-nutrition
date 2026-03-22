import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type Goal = "cut" | "bulk" | "maintain";

interface WeightHistoryItem {
  date: string; // ISO
  weight: number;
}

interface ProfileState {
  dailyCalories: number;
  goal: Goal;
  weightHistory: WeightHistoryItem[];
}

const initialState: ProfileState = {
  dailyCalories: 0,
  goal: "maintain",
  weightHistory: [],
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setDailyCalories(state, action: PayloadAction<number>) {
      state.dailyCalories = action.payload;
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

    resetProfile(state) {
      state.dailyCalories = 0;
      state.goal = "maintain";
      state.weightHistory = [];
    },
  },
});

export const { setDailyCalories, setGoal, updateWeight, resetProfile } =
  profileSlice.actions;

export default profileSlice.reducer;
