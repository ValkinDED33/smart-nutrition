import { lazy, Suspense, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./app/store";
import {
  clearSavedSessionHint,
  initializeAuth,
  selectAuth,
} from "./features/auth/authSlice";
import Layout from "@app/layouts/AppLayout";
import ErrorBoundary from "./shared/components/ErrorBoundary";
import Loader from "./shared/components/Loader/PacmanLoader";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import { useLanguage } from "./shared/language";
import { adminRouteRoles } from "@app/navigation/appNavigation";
import { canAccessAdminCenter } from "@domain/user/roles";
import {
  getSessionStorageItem,
  recoverApplicationAfterStaleBuild,
  setSessionStorageItem,
  shouldAttemptStaleBuildRecovery,
  STALE_BUILD_RECOVERY_KEY,
} from "@shared/lib/errorRecovery";

const loadLanguageSetupPage = () => import("./pages/LanguageSetupPage");
const loadLandingPage = () => import("./pages/LandingPage");
const loadOnboardingPage = () => import("./pages/OnboardingPage");
const loadDashboardPage = () => import("./pages/DashboardPage");
const loadMealsPage = () => import("./pages/MealsPage");
const loadRecipesPage = () => import("./pages/RecipesPage");
const loadCommunityPage = () => import("./pages/CommunityPage");
const loadCoachPage = () => import("./pages/CoachPage");
const loadProfilePage = () => import("./pages/ProfilePage");
const loadAdminPage = () => import("./pages/AdminPage");
const loadProgressPage = () => import("./pages/ProgressPage");
const loadLoginPage = () => import("./pages/LoginPage");
const loadRegisterPage = () => import("./pages/RegisterPage");
const loadPartnerInvitePage = () => import("./pages/PartnerInvitePage");
const loadVerifyEmailPage = () => import("./pages/VerifyEmailPage");
const loadForgotPasswordPage = () => import("./pages/ForgotPasswordPage");
const loadResetPasswordPage = () => import("./pages/ResetPasswordPage");
const loadNotFoundPage = () => import("./pages/NotFoundPage");

const LanguageSetupPage = lazy(loadLanguageSetupPage);
const LandingPage = lazy(loadLandingPage);
const OnboardingPage = lazy(loadOnboardingPage);
const DashboardPage = lazy(loadDashboardPage);
const MealsPage = lazy(loadMealsPage);
const RecipesPage = lazy(loadRecipesPage);
const CommunityPage = lazy(loadCommunityPage);
const CoachPage = lazy(loadCoachPage);
const ProfilePage = lazy(loadProfilePage);
const AdminPage = lazy(loadAdminPage);
const ProgressPage = lazy(loadProgressPage);
const LoginPage = lazy(loadLoginPage);
const RegisterPage = lazy(loadRegisterPage);
const PartnerInvitePage = lazy(loadPartnerInvitePage);
const VerifyEmailPage = lazy(loadVerifyEmailPage);
const ForgotPasswordPage = lazy(loadForgotPasswordPage);
const ResetPasswordPage = lazy(loadResetPasswordPage);
const NotFoundPage = lazy(loadNotFoundPage);
const ONBOARDING_ENTRY_PATH = "/onboarding/choice";

const RouteFallback = () => <Loader fullScreen={false} size={80} />;

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    error: authError,
    hasSessionHint,
    isAuthenticated,
    isInitialized,
    isLoading,
    user,
  } = useSelector(selectAuth);
  const profileOnboardingCompleted = useSelector((state: RootState) =>
    Boolean(state.profile.assistant.onboarding.completedAt)
  );
  const { setOnboardingUser } = useLanguage();
  const shouldShowOnboarding = isAuthenticated && !profileOnboardingCompleted;

  useEffect(() => {
    if (!isInitialized && !isLoading) {
      if (hasSessionHint) {
        dispatch(initializeAuth());
      } else {
        dispatch(clearSavedSessionHint());
      }
      return undefined;
    }

    if (
      hasSessionHint &&
      isInitialized &&
      !isLoading &&
      authError === "REMOTE_API_UNAVAILABLE"
    ) {
      const retryId = globalThis.setTimeout(() => {
        dispatch(initializeAuth());
      }, 5_000);

      return () => {
        globalThis.clearTimeout(retryId);
      };
    }

    return undefined;
  }, [authError, dispatch, hasSessionHint, isInitialized, isLoading]);

  useEffect(() => {
    setOnboardingUser(isAuthenticated ? (user?.id ?? null) : null);
  }, [isAuthenticated, setOnboardingUser, user?.id]);

  useEffect(() => {
    if (
      !isInitialized ||
      !isAuthenticated ||
      shouldShowOnboarding ||
      typeof window === "undefined"
    ) {
      return;
    }

    const routeLoaders = [
      loadDashboardPage,
      loadMealsPage,
      loadProgressPage,
      loadCoachPage,
      loadRecipesPage,
      loadCommunityPage,
      loadProfilePage,
      ...(canAccessAdminCenter(user?.role) ? [loadAdminPage] : []),
    ];
    const routeTimeoutIds: ReturnType<typeof globalThis.setTimeout>[] = [];
    const recoverFromRoutePreloadFailure = (error: unknown) => {
      if (
        !shouldAttemptStaleBuildRecovery(
          error,
          getSessionStorageItem(STALE_BUILD_RECOVERY_KEY)
        )
      ) {
        return;
      }

      setSessionStorageItem(STALE_BUILD_RECOVERY_KEY, String(Date.now()));
      recoverApplicationAfterStaleBuild(window.location.href);
    };
    const preloadRouteSafely = (loadRoute: () => Promise<unknown>) => {
      void loadRoute().catch(recoverFromRoutePreloadFailure);
    };

    const preloadRoutes = () => {
      routeLoaders.forEach((loadRoute, index) => {
        const timeoutId = globalThis.setTimeout(() => {
          preloadRouteSafely(loadRoute);
        }, index * 350);
        routeTimeoutIds.push(timeoutId);
      });
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
        routeTimeoutIds.forEach((timeoutId) => {
          globalThis.clearTimeout(timeoutId);
        });
      };
    }

    const timeoutId = globalThis.setTimeout(preloadRoutes, 2_400);
    return () => {
      globalThis.clearTimeout(timeoutId);
      routeTimeoutIds.forEach((routeTimeoutId) => {
        globalThis.clearTimeout(routeTimeoutId);
      });
    };
  }, [isAuthenticated, isInitialized, shouldShowOnboarding, user?.role]);

  return (
    <ErrorBoundary>
      <Helmet
        titleTemplate="%s | Smart Nutrition"
        defaultTitle="Smart Nutrition"
      >
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
                path="/language"
                element={
                  <PublicRoute>
                    <LanguageSetupPage />
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
                path="/partner-invite"
                element={<PartnerInvitePage />}
              />
              <Route
                path="/verify-email"
                element={
                  <PublicRoute>
                    <VerifyEmailPage />
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
                    {shouldShowOnboarding ? (
                      <Navigate to={ONBOARDING_ENTRY_PATH} replace />
                    ) : (
                      <DashboardPage />
                    )}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/food"
                element={
                  <ProtectedRoute>
                    {shouldShowOnboarding ? (
                      <Navigate to={ONBOARDING_ENTRY_PATH} replace />
                    ) : (
                      <Navigate to="/meals" replace />
                    )}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/meals"
                element={
                  <ProtectedRoute>
                    {shouldShowOnboarding ? (
                      <Navigate to={ONBOARDING_ENTRY_PATH} replace />
                    ) : (
                      <MealsPage />
                    )}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recipes"
                element={
                  <ProtectedRoute>
                    {shouldShowOnboarding ? (
                      <Navigate to={ONBOARDING_ENTRY_PATH} replace />
                    ) : (
                      <RecipesPage />
                    )}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community"
                element={
                  <ProtectedRoute>
                    {shouldShowOnboarding ? (
                      <Navigate to={ONBOARDING_ENTRY_PATH} replace />
                    ) : (
                      <CommunityPage />
                    )}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coach"
                element={
                  <ProtectedRoute>
                    {shouldShowOnboarding ? (
                      <Navigate to={ONBOARDING_ENTRY_PATH} replace />
                    ) : (
                      <CoachPage />
                    )}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/progress"
                element={
                  <ProtectedRoute>
                    {shouldShowOnboarding ? (
                      <Navigate to={ONBOARDING_ENTRY_PATH} replace />
                    ) : (
                      <ProgressPage />
                    )}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    {shouldShowOnboarding ? (
                      <Navigate to={ONBOARDING_ENTRY_PATH} replace />
                    ) : (
                      <ProfilePage />
                    )}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute
                    roles={adminRouteRoles}
                  >
                    {shouldShowOnboarding ? (
                      <Navigate to={ONBOARDING_ENTRY_PATH} replace />
                    ) : (
                      <AdminPage />
                    )}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/home"
                element={
                  <Navigate
                    to={shouldShowOnboarding ? ONBOARDING_ENTRY_PATH : "/dashboard"}
                    replace
                  />
                }
              />
              <Route
                path="/meal-builder"
                element={<Navigate to="/meals" replace />}
              />
              <Route
                path="/scanner"
                element={<Navigate to="/meals?mode=barcode" replace />}
              />
              <Route
                path="/photo-meal"
                element={<Navigate to="/meals?mode=photo" replace />}
              />
              <Route
                path="/water"
                element={<Navigate to="/progress" replace />}
              />
              <Route path="/ai" element={<Navigate to="/coach" replace />} />
              <Route
                path="/assistant"
                element={<Navigate to="/coach" replace />}
              />
              <Route
                path="*"
                element={
                  shouldShowOnboarding ? (
                    <Navigate to={ONBOARDING_ENTRY_PATH} replace />
                  ) : (
                    <NotFoundPage />
                  )
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
