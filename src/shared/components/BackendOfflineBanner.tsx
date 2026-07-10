import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Alert, Button, Collapse } from "@mui/material";
import type { RootState } from "../../app/store";
import { getRemoteBackendAvailability } from "../api/auth";
import { useLanguage } from "../language";
import type { AppLanguage } from "../types/i18n";

const bannerCopy = {
  uk: {
    offline: "Немає з'єднання з інтернетом. Підключіться знову, щоб продовжити.",
    backendDown:
      "Хмарний API прокидається або тимчасово недоступний. Ми перевіримо ще раз автоматично.",
    retry: "Перевірити ще раз",
    checking: "Перевіряємо...",
  },
  pl: {
    offline:
      "Brak połączenia z internetem. Połącz się ponownie, aby kontynuować.",
    backendDown:
      "Cloud API wybudza się albo jest chwilowo niedostępne. Sprawdzimy ponownie automatycznie.",
    retry: "Sprawdź ponownie",
    checking: "Sprawdzam...",
  },
  en: {
    offline: "No internet connection. Reconnect to continue.",
    backendDown:
      "Cloud API is waking up or temporarily unavailable. We will retry automatically.",
    retry: "Check again",
    checking: "Checking...",
  },
} as const;

type BannerCopy = (typeof bannerCopy)[AppLanguage];

const getBannerCopy = (language: AppLanguage): BannerCopy => {
  switch (language) {
    case "pl":
      return bannerCopy.pl;
    case "en":
      return bannerCopy.en;
    case "uk":
    default:
      return bannerCopy.uk;
  }
};

const BackendOfflineBanner = () => {
  const { user, error } = useSelector((state: RootState) => state.auth);
  const { appLanguage } = useLanguage();
  const copy = getBannerCopy(appLanguage);
  const [browserOnline, setBrowserOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  const [backendReachable, setBackendReachable] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleOnline = () => setBrowserOnline(true);
    const handleOffline = () => setBrowserOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!user && error !== "REMOTE_API_UNAVAILABLE") {
      return;
    }

    let cancelled = false;

    const checkBackend = async () => {
      if (!navigator.onLine) {
        if (!cancelled) {
          setBrowserOnline(false);
          setBackendReachable(false);
        }
        return;
      }

      const available = await getRemoteBackendAvailability(true);

      if (!cancelled) {
        setBrowserOnline(true);
        setBackendReachable(available);
      }
    };

    void checkBackend();
    const intervalId = window.setInterval(() => {
      void checkBackend();
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [error, user]);

  if (!user && error !== "REMOTE_API_UNAVAILABLE") {
    return null;
  }

  const effectiveBackendReachable =
    !user && error !== "REMOTE_API_UNAVAILABLE" ? true : backendReachable;
  const shouldShow = !browserOnline || !effectiveBackendReachable;

  const handleRetry = async () => {
    setChecking(true);

    try {
      const available = await getRemoteBackendAvailability(true);
      setBrowserOnline(typeof navigator === "undefined" ? true : navigator.onLine);
      setBackendReachable(available);
    } finally {
      setChecking(false);
    }
  };

  return (
    <Collapse in={shouldShow} unmountOnExit>
      <Alert
        severity="warning"
        sx={{ borderRadius: 1, mb: 3, alignItems: "center" }}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={handleRetry}
            disabled={checking}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {checking ? copy.checking : copy.retry}
          </Button>
        }
      >
        {!browserOnline ? copy.offline : copy.backendDown}
      </Alert>
    </Collapse>
  );
};

export default BackendOfflineBanner;
