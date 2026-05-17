import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Alert, Button, Collapse } from "@mui/material";
import type { RootState } from "../../app/store";
import { getRemoteBackendAvailability } from "../api/auth";
import { useLanguage } from "../language";

const bannerCopy = {
  uk: {
    offline: "Немає з'єднання з інтернетом. Підключіться знову, щоб продовжити.",
    backendDown:
      "Хмарний API зараз недоступний. Підключіться знову, щоб продовжити.",
    retry: "Перевірити ще раз",
    checking: "Перевіряємо...",
  },
  pl: {
    offline:
      "Brak połączenia z internetem. Połącz się ponownie, aby kontynuować.",
    backendDown:
      "Cloud API jest teraz niedostępne. Połącz się ponownie, aby kontynuować.",
    retry: "Sprawdź ponownie",
    checking: "Sprawdzam...",
  },
} as const;

const BackendOfflineBanner = () => {
  const { user, error } = useSelector((state: RootState) => state.auth);
  const { language } = useLanguage();
  const copy = bannerCopy[language];
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
      setBackendReachable(true);
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
    }, 20000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [error, user]);

  if (!user && error !== "REMOTE_API_UNAVAILABLE") {
    return null;
  }

  const shouldShow = !browserOnline || !backendReachable;

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
        sx={{ borderRadius: 4, mb: 3, alignItems: "center" }}
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
