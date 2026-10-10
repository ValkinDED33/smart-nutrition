import type { ReactNode } from "react";
import { Button, Paper, Stack, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import type { AppDispatch, RootState } from "../app/store";
import {
  clearSavedSessionHint,
  initializeAuth,
} from "../features/auth/authSlice";
import PacmanLoader from "../shared/components/Loader/PacmanLoader";
import { SessionRestoreFallback } from "../shared/components/SessionRestoreFallback";
import { clearAuthSessionHint } from "../shared/lib/authSessionHint";
import { useLanguage } from "../shared/language";
import type { UserRole } from "@domain/user/types";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[];
}

const accessDeniedCopy = {
  uk: {
    title: "Немає доступу до цього розділу",
    body: "Цей екран доступний тільки ролям команди. Основний план, їжа, вода і прогрес залишаються у твоєму просторі.",
    action: "Повернутися на головну",
  },
  pl: {
    title: "Brak dostępu do tej sekcji",
    body: "Ten ekran jest dostępny tylko dla ról zespołowych. Plan, jedzenie, woda i postępy zostają w Twojej przestrzeni.",
    action: "Wróć do głównej",
  },
  en: {
    title: "No access to this section",
    body: "This screen is available only to team roles. Your plan, food, water, and progress remain in your main space.",
    action: "Back to home",
  },
} as const;

const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { appLanguage } = useLanguage();
  const deniedCopy =
    appLanguage === "pl"
      ? accessDeniedCopy.pl
      : appLanguage === "en"
        ? accessDeniedCopy.en
        : accessDeniedCopy.uk;
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
    return (
      <Paper
        className="sn-premium-panel"
        elevation={0}
        data-protected-route-access-denied="true"
        sx={{
          maxWidth: 680,
          mx: "auto",
          mt: { xs: 2, md: 6 },
          p: { xs: 2, md: 3 },
          borderRadius: 1,
          border: "1px solid var(--sn-border-soft)",
        }}
      >
        <Stack spacing={1.4} alignItems="flex-start">
          <ShieldAlert size={34} aria-hidden="true" />
          <Typography component="h1" variant="h5" sx={{ fontWeight: 950 }}>
            {deniedCopy.title}
          </Typography>
          <Typography color="text.secondary">{deniedCopy.body}</Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/dashboard", { replace: true })}
            sx={{ borderRadius: 1, textTransform: "none", fontWeight: 900 }}
          >
            {deniedCopy.action}
          </Button>
        </Stack>
      </Paper>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
