import { useEffect, useState, type SyntheticEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Snackbar } from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import { clearSyncToast } from "../../features/auth/authSlice";
import { useLanguage } from "../language";

const snackbarCopy = {
  uk: {
    retrySuccess: "Хмарна синхронізація завершилася успішно.",
    outboxFlushed: "Зміни з локальної черги синхронізовано.",
  },
  pl: {
    retrySuccess: "Synchronizacja z chmura zakonczona pomyslnie.",
    outboxFlushed: "Zalegle lokalne zmiany zostaly zsynchronizowane.",
  },
} as const;

const SyncFeedbackSnackbar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const syncToast = useSelector((state: RootState) => state.auth.syncToast);
  const { language } = useLanguage();
  const copy = snackbarCopy[language];
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(Boolean(syncToast));
  }, [syncToast]);

  const handleClose = (
    _event?: Event | SyntheticEvent,
    reason?: "timeout" | "clickaway" | "escapeKeyDown"
  ) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
    dispatch(clearSyncToast());
  };

  if (!syncToast) {
    return null;
  }

  return (
    <Snackbar
      key={syncToast.id}
      open={open}
      autoHideDuration={3200}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert onClose={handleClose} severity="success" variant="filled" sx={{ width: "100%" }}>
        {syncToast.kind === "outbox-flushed" ? copy.outboxFlushed : copy.retrySuccess}
      </Alert>
    </Snackbar>
  );
};

export default SyncFeedbackSnackbar;
