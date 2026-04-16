import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WaterState {
    intake: number;
    goal: number;
}

const initialState: WaterState = {
    intake: 0,
    goal: 2000,
};

const waterSlice = createSlice({
    name: 'water',
    initialState,
    reducers: {
        addWater: (state, action: PayloadAction<number>) => {
            state.intake += action.payload;
        },
        updateGoal: (state, action: PayloadAction<number>) => {
            state.goal = action.payload;
        },
        resetTracker: (state) => {
            state.intake = 0;
        },
    },
});

export const { addWater, updateGoal, resetTracker } = waterSlice.actions;
export default waterSlice.reducer;
