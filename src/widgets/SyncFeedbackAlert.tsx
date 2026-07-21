import { useDispatch, useSelector } from "react-redux";
import { Alert } from "@mui/material";
import type { AppDispatch, RootState } from "@app/store";
import { clearSyncToast } from "@features/auth/authSlice";
import { useLanguage } from "@shared/language";
import { useAutoDismiss } from "@shared/hooks/useAutoDismiss";
import type { AppLanguage } from "@shared/types/i18n";

const syncFeedbackCopy = {
  uk: {
    retrySuccess: "Хмарна синхронізація завершилася успішно.",
  },
  pl: {
    retrySuccess: "Synchronizacja z chmurą zakończona pomyślnie.",
  },
  en: {
    retrySuccess: "Cloud sync completed successfully.",
  },
} as const;

const getSyncFeedbackCopy = (language: AppLanguage) => {
  switch (language) {
    case "uk":
      return syncFeedbackCopy.uk;
    case "pl":
      return syncFeedbackCopy.pl;
    case "en":
      return syncFeedbackCopy.en;
    default:
      return syncFeedbackCopy.en;
  }
};

const SyncFeedbackAlert = () => {
  const dispatch = useDispatch<AppDispatch>();
  const syncToast = useSelector((state: RootState) => state.auth.syncToast);
  const { appLanguage } = useLanguage();
  const copy = getSyncFeedbackCopy(appLanguage);

  useAutoDismiss(Boolean(syncToast), 3200, () => dispatch(clearSyncToast()));

  if (!syncToast) {
    return null;
  }

  return (
    <Alert
      key={syncToast.id}
      onClose={() => dispatch(clearSyncToast())}
      severity="success"
      variant="filled"
      sx={{ mb: 2 }}
    >
      {copy.retrySuccess}
    </Alert>
  );
};

export default SyncFeedbackAlert;
