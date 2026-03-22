import type { ReactNode } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import type { RootState } from "../app/store";
import PacmanLoader from "../shared/components/Loader/PacmanLoader";

interface PublicRouteProps {
  children: ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, isLoading, isInitialized } = useSelector(
    (state: RootState) => state.auth
  );

  if (!isInitialized || isLoading) {
    return <PacmanLoader />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
