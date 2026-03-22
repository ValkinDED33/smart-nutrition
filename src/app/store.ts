import { configureStore, combineReducers } from "@reduxjs/toolkit";
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

import profileReducer from "../features/profile/profileSlice";
import mealReducer, { normalizeMealState } from "../features/meal/mealSlice";
import authReducer from "../features/auth/authSlice";

const rootReducer = combineReducers({
  profile: profileReducer,
  meal: mealReducer,
  auth: authReducer,
});

const persistConfig = {
  key: "root",
  version: 2,
  storage,
  whitelist: ["profile", "meal"],
  migrate: async (state: PersistedState): Promise<PersistedState> => {
    if (!state || typeof state !== "object") {
      return state;
    }

    const persistedState = state as PersistedState & Record<string, unknown>;

    return {
      ...persistedState,
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
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
