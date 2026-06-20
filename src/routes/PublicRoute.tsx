import type { ReactNode } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import type { RootState } from "../app/store";
import PacmanLoader from "../shared/components/Loader/PacmanLoader";

interface PublicRouteProps {
  children: ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { error, hasSessionHint, isInitialized, isLoading, user } = useSelector(
    (state: RootState) => state.auth
  );

  if (
    hasSessionHint &&
    (!isInitialized || isLoading || error === "REMOTE_API_UNAVAILABLE")
  ) {
    return <PacmanLoader />;
  }

  if (isInitialized && user) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
