import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import type { AppDispatch } from "./app/store";
import { initializeAuth, selectAuth } from "./features/auth/authSlice";

import Layout from "./shared/layout/AppLayout";
import ErrorBoundary from "./shared/components/ErrorBoundary";
import Loader from "./shared/components/Loader/PacmanLoader";

import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import MealBuilderPage from "./pages/MealBuilderPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFoundPage from "./pages/NotFoundPage";

import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute"; // ← новий роут

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { isInitialized, isLoading } = useSelector(selectAuth);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // 🔥 Блокуємо додаток поки перевіряється токен
  if (!isInitialized || isLoading) {
    return <Loader />;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            {/* Публічні сторінки */}
            <Route
              path="/"
              element={
                <PublicRoute>
                  <LandingPage />
                </PublicRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

            {/* Захищені сторінки */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meal-builder"
              element={
                <ProtectedRoute>
                  <MealBuilderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
