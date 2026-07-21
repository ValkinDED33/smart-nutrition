import { useEffect, useState } from "react";
import { Alert, Button, Collapse } from "@mui/material";
import { useLanguage } from "@shared/language";
import type { AppLanguage } from "@shared/types/i18n";
import {
  PWA_UPDATE_READY_EVENT,
  type PwaUpdateReadyEventDetail,
} from "@shared/lib/registerServiceWorker";

const updateCopy = {
  uk: {
    message:
      "Доступна нова версія Smart Nutrition. Оновіть застосунок, щоб отримати останні виправлення та стабільну роботу.",
    action: "Оновити",
    applying: "Оновлюємо...",
  },
  pl: {
    message:
      "Dostępna jest nowa wersja Smart Nutrition. Zaktualizuj aplikację, aby korzystać z najnowszych poprawek i stabilnego działania.",
    action: "Zaktualizuj",
    applying: "Aktualizuję...",
  },
  en: {
    message:
      "A new Smart Nutrition version is available. Update the app for the latest fixes and a stable experience.",
    action: "Update",
    applying: "Updating...",
  },
} as const;

type UpdateCopy = (typeof updateCopy)[AppLanguage];

const getUpdateCopy = (language: AppLanguage): UpdateCopy => {
  switch (language) {
    case "pl":
      return updateCopy.pl;
    case "en":
      return updateCopy.en;
    case "uk":
    default:
      return updateCopy.uk;
  }
};

const PwaUpdateBanner = () => {
  const { appLanguage } = useLanguage();
  const copy = getUpdateCopy(appLanguage);
  const [applyUpdate, setApplyUpdate] = useState<(() => void) | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleUpdateReady = (event: Event) => {
      const detail = (event as CustomEvent<PwaUpdateReadyEventDetail>).detail;

      if (typeof detail?.applyUpdate === "function") {
        setApplyUpdate(() => detail.applyUpdate);
      }
    };

    window.addEventListener(PWA_UPDATE_READY_EVENT, handleUpdateReady);

    return () => {
      window.removeEventListener(PWA_UPDATE_READY_EVENT, handleUpdateReady);
    };
  }, []);

  const handleApplyUpdate = () => {
    if (!applyUpdate || applying) {
      return;
    }

    setApplying(true);
    applyUpdate();
  };

  return (
    <Collapse in={Boolean(applyUpdate)} unmountOnExit>
      <Alert
        severity="info"
        sx={{ borderRadius: 1, mb: 3, alignItems: "center" }}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={handleApplyUpdate}
            disabled={applying}
            sx={{ textTransform: "none", fontWeight: 800 }}
          >
            {applying ? copy.applying : copy.action}
          </Button>
        }
      >
        {copy.message}
      </Alert>
    </Collapse>
  );
};

export default PwaUpdateBanner;
