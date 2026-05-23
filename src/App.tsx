import { lazy, Suspense, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "./app/store";
import { initializeAuth, selectAuth } from "./features/auth/authSlice";
import Layout from "./shared/layout/AppLayout";
import ErrorBoundary from "./shared/components/ErrorBoundary";
import Loader from "./shared/components/Loader/PacmanLoader";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import { useLanguage } from "./shared/language";

const loadLandingPage = () => import("./pages/LandingPage");
const loadOnboardingPage = () => import("./pages/OnboardingPage");
const loadDashboardPage = () => import("./pages/DashboardPage");
const loadFoodPage = () => import("./pages/FoodPage");
const loadRecipesPage = () => import("./pages/RecipesPage");
const loadCommunityPage = () => import("./pages/CommunityPage");
const loadCoachPage = () => import("./pages/CoachPage");
const loadProfilePage = () => import("./pages/ProfilePage");
const loadAdminPage = () => import("./pages/AdminPage");
const loadProgressPage = () => import("./pages/ProgressPage");
const loadLoginPage = () => import("./pages/LoginPage");
const loadRegisterPage = () => import("./pages/RegisterPage");
const loadForgotPasswordPage = () => import("./pages/ForgotPasswordPage");
const loadResetPasswordPage = () => import("./pages/ResetPasswordPage");
const loadNotFoundPage = () => import("./pages/NotFoundPage");

const LandingPage = lazy(loadLandingPage);
const OnboardingPage = lazy(loadOnboardingPage);
const DashboardPage = lazy(loadDashboardPage);
const FoodPage = lazy(loadFoodPage);
const RecipesPage = lazy(loadRecipesPage);
const CommunityPage = lazy(loadCommunityPage);
const CoachPage = lazy(loadCoachPage);
const ProfilePage = lazy(loadProfilePage);
const AdminPage = lazy(loadAdminPage);
const ProgressPage = lazy(loadProgressPage);
const LoginPage = lazy(loadLoginPage);
const RegisterPage = lazy(loadRegisterPage);
const ForgotPasswordPage = lazy(loadForgotPasswordPage);
const ResetPasswordPage = lazy(loadResetPasswordPage);
const NotFoundPage = lazy(loadNotFoundPage);

const RouteFallback = () => <Loader fullScreen={false} size={80} />;

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isInitialized, isLoading } = useSelector(selectAuth);
  const { hasCompletedOnboarding } = useLanguage();
  const shouldShowOnboarding = isAuthenticated && !hasCompletedOnboarding;

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    if (!isInitialized || typeof window === "undefined") {
      return;
    }

    const preloadRoutes = () => {
      void loadDashboardPage();
      void loadFoodPage();
      void loadRecipesPage();
      void loadCommunityPage();
      void loadCoachPage();
      void loadProgressPage();
      void loadProfilePage();
      void loadAdminPage();
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

  return (
    <ErrorBoundary>
      <Helmet titleTemplate="%s | Smart Nutrition" defaultTitle="Smart Nutrition">
        <meta
          name="description"
          content="Smart Nutrition tracks meals, water, progress, and AI coaching in one responsive app."
        />
      </Helmet>
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
                path="/onboarding/*"
                element={
                  <ProtectedRoute>
                    <OnboardingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    {shouldShowOnboarding ? <Navigate to="/onboarding" replace /> : <DashboardPage />}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/food"
                element={
                  <ProtectedRoute>
                    {shouldShowOnboarding ? <Navigate to="/onboarding" replace /> : <FoodPage />}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recipes"
                element={
                  <ProtectedRoute>
                    {shouldShowOnboarding ? <Navigate to="/onboarding" replace /> : <RecipesPage />}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community"
                element={
                  <ProtectedRoute>
                    {shouldShowOnboarding ? <Navigate to="/onboarding" replace /> : <CommunityPage />}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coach"
                element={
                  <ProtectedRoute>
                    {shouldShowOnboarding ? <Navigate to="/onboarding" replace /> : <CoachPage />}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/progress"
                element={
                  <ProtectedRoute>
                    {shouldShowOnboarding ? <Navigate to="/onboarding" replace /> : <ProgressPage />}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    {shouldShowOnboarding ? <Navigate to="/onboarding" replace /> : <ProfilePage />}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={["NUTRITIONIST", "MODERATOR", "ADMIN", "SUPER_ADMIN"]}>
                    {shouldShowOnboarding ? <Navigate to="/onboarding" replace /> : <AdminPage />}
                  </ProtectedRoute>
                }
              />
              <Route path="/home" element={<Navigate to="/dashboard" replace />} />
              <Route path="/meals" element={<Navigate to="/food" replace />} />
              <Route path="/water" element={<Navigate to="/progress" replace />} />
              <Route path="/ai" element={<Navigate to="/coach" replace />} />
              <Route path="/meal-builder" element={<Navigate to="/food" replace />} />
              <Route
                path="*"
                element={shouldShowOnboarding ? <Navigate to="/onboarding" replace /> : <NotFoundPage />}
              />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
