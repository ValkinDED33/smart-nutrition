import { useEffect, useState } from "react";
import { Alert, Button, Collapse } from "@mui/material";
import { useLanguage } from "@shared/language";
import {
  PWA_UPDATE_READY_EVENT,
  type PwaUpdateReadyEventDetail,
} from "@shared/lib/registerServiceWorker";

const updateCopy = {
  uk: {
    message:
      "Доступна нова версія Smart Nutrition. Оновіть застосунок, щоб уникнути старого кешу після деплою.",
    action: "Оновити",
    applying: "Оновлюємо...",
  },
  pl: {
    message:
      "Dostępna jest nowa wersja Smart Nutrition. Zaktualizuj aplikację, aby uniknąć starego cache po wdrożeniu.",
    action: "Zaktualizuj",
    applying: "Aktualizuję...",
  },
  en: {
    message:
      "A new Smart Nutrition version is available. Update the app to avoid stale cache after deployment.",
    action: "Update",
    applying: "Updating...",
  },
} as const;

const PwaUpdateBanner = () => {
  const { appLanguage } = useLanguage();
  const copy = updateCopy[appLanguage];
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
