import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import type { ReactNode } from "react";
import PacmanLoader from "../shared/components/Loader/PacmanLoader";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Берем пользователя и статус загрузки из authSlice
  const { user, isLoading, isInitialized } = useSelector(
    (state: RootState) => state.auth
  );

  // Показываем лоадер пока идет инициализация или загрузка
  if (!isInitialized || isLoading) {
    return <PacmanLoader />;
  }

  // Если пользователя нет — редирект на /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Если пользователь есть — показываем children
  return <>{children}</>;
};

export default ProtectedRoute;
