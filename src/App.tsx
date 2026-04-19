import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "./app/store";
import { initializeAuth, selectAuth } from "./features/auth/authSlice";
import Layout from "./shared/layout/AppLayout";
import ErrorBoundary from "./shared/components/ErrorBoundary";
import Loader from "./shared/components/Loader/PacmanLoader";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import { useLanguage } from "./shared/language";
import LanguageSetupPage from "./pages/LanguageSetupPage";

const loadLandingPage = () => import("./pages/LandingPage");
const loadDashboardPage = () => import("./pages/DashboardPage");
const loadProfilePage = () => import("./pages/ProfilePage");
const loadMealBuilderPage = () => import("./pages/MealBuilderPage");
const loadLoginPage = () => import("./pages/LoginPage");
const loadRegisterPage = () => import("./pages/RegisterPage");
const loadForgotPasswordPage = () => import("./pages/ForgotPasswordPage");
const loadResetPasswordPage = () => import("./pages/ResetPasswordPage");
const loadNotFoundPage = () => import("./pages/NotFoundPage");

const LandingPage = lazy(loadLandingPage);
const DashboardPage = lazy(loadDashboardPage);
const ProfilePage = lazy(loadProfilePage);
const MealBuilderPage = lazy(loadMealBuilderPage);
const LoginPage = lazy(loadLoginPage);
const RegisterPage = lazy(loadRegisterPage);
const ForgotPasswordPage = lazy(loadForgotPasswordPage);
const ResetPasswordPage = lazy(loadResetPasswordPage);
const NotFoundPage = lazy(loadNotFoundPage);

const RouteFallback = () => <Loader fullScreen={false} size={80} />;

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { isInitialized, isLoading } = useSelector(selectAuth);
  const { hasExplicitChoice } = useLanguage();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    if (!isInitialized || typeof window === "undefined") {
      return;
    }

    const preloadRoutes = () => {
      void loadDashboardPage();
      void loadMealBuilderPage();
      void loadProfilePage();
    };
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (
      typeof idleWindow.requestIdleCallback === "function" &&
      typeof idleWindow.cancelIdleCallback === "function"
    ) {
      const idleId = idleWindow.requestIdleCallback(() => {
        preloadRoutes();
      });
      return () => {
        idleWindow.cancelIdleCallback?.(idleId);
      };
    }

    const timeoutId = globalThis.setTimeout(preloadRoutes, 1200);
    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [isInitialized]);

  if (!isInitialized || isLoading) {
    return <Loader />;
  }

  if (!hasExplicitChoice) {
    return <LanguageSetupPage />;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<Layout />}>
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
              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPasswordPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <PublicRoute>
                    <ResetPasswordPage />
                  </PublicRoute>
                }
              />
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
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
