import type { ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "../app/store";
import {
  clearSavedSessionHint,
  initializeAuth,
} from "../features/auth/authSlice";
import { SessionRestoreFallback } from "../shared/components/SessionRestoreFallback";
import { clearAuthSessionHint } from "../shared/lib/authSessionHint";

interface PublicRouteProps {
  children: ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const {
    error,
    hasSessionHint,
    isInitialized,
    isLoading,
    sessionRestoreStatus,
    user,
  } = useSelector((state: RootState) => state.auth);

  if (hasSessionHint && (!isInitialized || isLoading)) {
    return (
      <SessionRestoreFallback
        status={sessionRestoreStatus === "unavailable" ? "unavailable" : "checking"}
        onRetry={() => {
          void dispatch(initializeAuth());
        }}
        onForgetSession={() => {
          clearAuthSessionHint();
          dispatch(clearSavedSessionHint());
          navigate("/login", { replace: true });
        }}
      />
    );
  }

  if (hasSessionHint && error === "REMOTE_API_UNAVAILABLE") {
    return (
      <SessionRestoreFallback
        status="unavailable"
        onRetry={() => {
          void dispatch(initializeAuth());
        }}
        onForgetSession={() => {
          clearAuthSessionHint();
          dispatch(clearSavedSessionHint());
          navigate("/login", { replace: true });
        }}
      />
    );
  }

  if (isInitialized && user) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
