import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Alert, Button, Collapse } from "@mui/material";
import type { RootState } from "../../app/store";
import { getRemoteBackendAvailability } from "../api/auth";
import { useLanguage } from "../language";

const bannerCopy = {
  uk: {
    offline: "You are offline. Changes stay on this device until the connection returns.",
    backendDown:
      "Cloud API is currently unavailable. Recent changes stay local and will sync again when the server is back.",
    retry: "Check again",
    checking: "Checking...",
  },
  pl: {
    offline:
      "Brak polaczenia z internetem. Zmiany zostaja na tym urzadzeniu, dopoki polaczenie nie wroci.",
    backendDown:
      "Cloud API jest teraz niedostepne. Ostatnie zmiany zostaja lokalnie i zsynchronizuja sie po powrocie serwera.",
    retry: "Sprawdz ponownie",
    checking: "Sprawdzam...",
  },
} as const;

const BackendOfflineBanner = () => {
  const { user, syncMode } = useSelector((state: RootState) => state.auth);
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
    if (!user || syncMode !== "remote-cloud") {
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
  }, [syncMode, user]);

  if (!user || syncMode !== "remote-cloud") {
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
