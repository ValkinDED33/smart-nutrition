import { configureStore, combineReducers, type AnyAction } from "@reduxjs/toolkit";

import profileReducer from "../features/profile/profileSlice";
import mealReducer from "../features/meal/mealSlice";
import waterReducer from "../features/water/waterSlice";
import authReducer from "../features/auth/authSlice";
import fridgeReducer from "../features/fridge/fridgeSlice";
import communityReducer from "../features/community/communitySlice";
import {
  registerRemoteSyncListeners,
  remoteSyncListenerMiddleware,
} from "./syncListeners";

const appReducer = combineReducers({
  profile: profileReducer,
  meal: mealReducer,
  water: waterReducer,
  auth: authReducer,
  fridge: fridgeReducer,
  community: communityReducer,
});

const RESET_APP_ACTION = "app/reset";

const rootReducer = (
  state: ReturnType<typeof appReducer> | undefined,
  action: AnyAction
) => {
  if (action.type === RESET_APP_ACTION) {
    return appReducer(undefined, action);
  }

  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(remoteSyncListenerMiddleware.middleware),
});

export const resetAppState = () => ({ type: RESET_APP_ACTION } as const);
registerRemoteSyncListeners();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
