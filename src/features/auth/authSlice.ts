import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import type { User } from "../../shared/types/user";
import { AuthApiError, restoreSession } from "../../shared/api/auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

export const initializeAuth = createAsyncThunk<
  { accessToken: string; user: User },
  void,
  { rejectValue: string | null }
>("auth/initialize", async (_, { rejectWithValue }) => {
  try {
    const data = await restoreSession();

    if (!data) {
      return rejectWithValue(null);
    }

    return {
      accessToken: data.token,
      user: data.user,
    };
  } catch (error) {
    const errorCode =
      error instanceof AuthApiError && error.code === "INVALID_CREDENTIALS"
        ? "SESSION_EXPIRED"
        : null;

    return rejectWithValue(errorCode);
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.accessToken = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setCredentials(
      state,
      action: PayloadAction<{ accessToken: string; user: User }>
    ) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.isInitialized = true;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.accessToken = null;
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.isInitialized = true;
        state.error = null;
      });
  },
});

export const { logout, setUser, setCredentials } = authSlice.actions;
export const selectAuth = (state: RootState) => state.auth;

export default authSlice.reducer;
