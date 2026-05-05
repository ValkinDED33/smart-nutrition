import { useDispatch, useSelector } from "react-redux";
import { Alert } from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import { clearSyncToast } from "../../features/auth/authSlice";
import { useLanguage } from "../language";
import { useAutoDismiss } from "../hooks/useAutoDismiss";

const syncFeedbackCopy = {
  uk: {
    retrySuccess: "Хмарна синхронізація завершилася успішно.",
    outboxFlushed: "Зміни з локальної черги синхронізовано.",
  },
  pl: {
    retrySuccess: "Synchronizacja z chmura zakonczona pomyslnie.",
    outboxFlushed: "Zalegle lokalne zmiany zostaly zsynchronizowane.",
  },
} as const;

const SyncFeedbackAlert = () => {
  const dispatch = useDispatch<AppDispatch>();
  const syncToast = useSelector((state: RootState) => state.auth.syncToast);
  const { language } = useLanguage();
  const copy = syncFeedbackCopy[language];

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
      {syncToast.kind === "outbox-flushed" ? copy.outboxFlushed : copy.retrySuccess}
    </Alert>
  );
};

export default SyncFeedbackAlert;
