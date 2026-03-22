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

import profileReducer from "../features/profile/profileSlice";
import mealReducer from "../features/meal/mealSlice";
import authReducer from "../features/auth/authSlice";

/* ---------------- ROOT REDUCER ---------------- */

const rootReducer = combineReducers({
  profile: profileReducer,
  meal: mealReducer,
  auth: authReducer,
});

/* ---------------- PERSIST CONFIG ---------------- */

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"], // сохраняем только auth (токены)
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

/* ---------------- STORE ---------------- */

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

/* ---------------- TYPES ---------------- */

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
