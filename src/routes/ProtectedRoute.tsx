import type { ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "../app/store";
import {
  clearSavedSessionHint,
  initializeAuth,
} from "../features/auth/authSlice";
import PacmanLoader from "../shared/components/Loader/PacmanLoader";
import { SessionRestoreFallback } from "../shared/components/SessionRestoreFallback";
import { clearAuthSessionHint } from "../shared/lib/authSessionHint";
import type { UserRole } from "@domain/user/types";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[];
}

const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const {
    error,
    hasSessionHint,
    isLoading,
    isInitialized,
    sessionRestoreStatus,
    user,
  } = useSelector((state: RootState) => state.auth);

  if (!isInitialized || isLoading) {
    if (hasSessionHint) {
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

    return <PacmanLoader />;
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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
