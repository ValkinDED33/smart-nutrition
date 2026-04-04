import { configureStore, combineReducers, type AnyAction } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import type { PersistedState } from "redux-persist/es/types";

import profileReducer, {
  normalizeProfileState,
} from "../features/profile/profileSlice";
import mealReducer, { normalizeMealState } from "../features/meal/mealSlice";
import authReducer from "../features/auth/authSlice";
import {
  registerRemoteSyncListeners,
  remoteSyncListenerMiddleware,
} from "./syncListeners";

const appReducer = combineReducers({
  profile: profileReducer,
  meal: mealReducer,
  auth: authReducer,
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

const persistConfig = {
  key: "root",
  version: 4,
  storage,
  whitelist: ["profile", "meal"],
  migrate: async (state: PersistedState): Promise<PersistedState> => {
    if (!state || typeof state !== "object") {
      return state;
    }

    const persistedState = state as PersistedState & Record<string, unknown>;

    return {
      ...persistedState,
      profile: normalizeProfileState(persistedState.profile),
      meal: normalizeMealState(persistedState.meal),
    } as PersistedState;
  },
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).prepend(remoteSyncListenerMiddleware.middleware),
});

export const persistor = persistStore(store);
export const resetAppState = () => ({ type: RESET_APP_ACTION } as const);
registerRemoteSyncListeners();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
