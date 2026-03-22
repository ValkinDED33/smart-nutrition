import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import type { ReactNode } from "react";
import PacmanLoader from "../shared/components/Loader/PacmanLoader";

interface PublicRouteProps {
  children: ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  // Берем пользователя и статус загрузки из authSlice
  const { user, isLoading, isInitialized } = useSelector(
    (state: RootState) => state.auth
  );

  // Показываем лоадер пока идет инициализация или загрузка
  if (!isInitialized || isLoading) {
    return <PacmanLoader />;
  }

  // Если пользователь авторизован — редирект на /dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Если пользователь не авторизован — показываем children (login, register)
  return <>{children}</>;
};

export default PublicRoute;
