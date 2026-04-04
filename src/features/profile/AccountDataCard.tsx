import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { persistor, resetAppState, type AppDispatch, type RootState } from "../../app/store";
import { deleteAccount, getAuthRuntimeInfo, logoutEverywhere } from "../../shared/api/auth";
import { clearSyncOutbox } from "../../shared/lib/syncOutbox";
import { useLanguage } from "../../shared/language";

const accountCopy = {
  uk: {
    title: "Account & data",
    subtitle:
      "Export your data, review where it is stored, and remove the account completely when needed.",
    provider: "Storage mode",
    session: "Session",
    sync: "Sync",
    security: "Security",
    exportAction: "Export my data",
    exportBusy: "Preparing export...",
    exportSuccess: "Data export is ready.",
    exportError: "The export could not be created.",
    deleteAction: "Delete account",
    revokeAction: "Log out all sessions",
    revokeBusy: "Revoking sessions...",
    revokeSuccess: "All sessions were revoked.",
    revokeError: "Could not revoke all sessions.",
    deleteBusy: "Deleting...",
    deleteSuccess: "Account deleted.",
    deleteError: "The account could not be deleted.",
    localNotice:
      "This account currently works in browser-only mode. Your nutrition data stays on this device until you switch to backend sync.",
    remoteNotice:
      "Remote accounts now use access + refresh API sessions, background sync, conflict-aware cloud state, and backup snapshots on the server.",
    confirmTitle: "Delete this account?",
    confirmBody:
      "This removes the account, session, profile data, meal history, saved foods, templates, and barcode memory for this installation.",
    confirmCancel: "Cancel",
    confirmDelete: "Yes, delete everything",
    syncRemote: "Cloud sync active",
    syncLocal: "Browser only",
  },
  pl: {
    title: "Account & data",
    subtitle:
      "Eksportuj dane, sprawdz gdzie sa zapisane i usun konto calkowicie, kiedy tego potrzebujesz.",
    provider: "Storage mode",
    session: "Session",
    sync: "Sync",
    security: "Security",
    exportAction: "Export my data",
    exportBusy: "Preparing export...",
    exportSuccess: "Data export is ready.",
    exportError: "The export could not be created.",
    deleteAction: "Delete account",
    revokeAction: "Log out all sessions",
    revokeBusy: "Revoking sessions...",
    revokeSuccess: "All sessions were revoked.",
    revokeError: "Could not revoke all sessions.",
    deleteBusy: "Deleting...",
    deleteSuccess: "Account deleted.",
    deleteError: "The account could not be deleted.",
    localNotice:
      "To konto dziala obecnie tylko w przegladarce. Dane o odzywianiu zostaja na tym urzadzeniu, dopoki nie wlaczysz synchronizacji z backendem.",
    remoteNotice:
      "Konta zdalne korzystaja teraz z sesji access + refresh, synchronizacji w tle, wykrywania konfliktow i zapasowych snapshotow na serwerze.",
    confirmTitle: "Delete this account?",
    confirmBody:
      "To usunie konto, sesje, dane profilu, historie posilkow, zapisane produkty, szablony i pamiec kodow kreskowych dla tej instalacji.",
    confirmCancel: "Cancel",
    confirmDelete: "Yes, delete everything",
    syncRemote: "Cloud sync active",
    syncLocal: "Browser only",
  },
} as const;

export const AccountDataCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const syncMode = useSelector((state: RootState) => state.auth.syncMode);
  const profile = useSelector((state: RootState) => state.profile);
  const meal = useSelector((state: RootState) => state.meal);
  const { language } = useLanguage();
  const copy = accountCopy[language];
  void syncMode;
  const runtime = getAuthRuntimeInfo();
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [exporting, setExporting] = useState(false);
  const [revokingSessions, setRevokingSessions] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!user) return null;

  const handleExport = async () => {
    setExporting(true);
    setNotice(null);

    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        auth: runtime,
        user,
        profile,
        meal,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = `smart-nutrition-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);

      setNotice({ type: "success", message: copy.exportSuccess });
    } catch {
      setNotice({ type: "error", message: copy.exportError });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setNotice(null);

    try {
      await deleteAccount(user.email);
      clearSyncOutbox();
      dispatch(resetAppState());
      await persistor.purge();
      setNotice({ type: "success", message: copy.deleteSuccess });
      navigate("/");
    } catch {
      setNotice({ type: "error", message: copy.deleteError });
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const handleLogoutEverywhere = async () => {
    setRevokingSessions(true);
    setNotice(null);

    try {
      await logoutEverywhere();
      clearSyncOutbox();
      dispatch(resetAppState());
      await persistor.flush();
      setNotice({ type: "success", message: copy.revokeSuccess });
      navigate("/login");
    } catch {
      setNotice({ type: "error", message: copy.revokeError });
    } finally {
      setRevokingSessions(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 6,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.84)",
      }}
    >
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.8 }}>
            {copy.subtitle}
          </Typography>
        </Box>

        {notice && <Alert severity={notice.type}>{notice.message}</Alert>}

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip label={`${copy.provider}: ${runtime.providerLabel}`} />
          <Chip label={`${copy.session}: ${runtime.sessionLabel}`} />
          <Chip
            label={`${copy.sync}: ${
              runtime.supportsCloudSync ? copy.syncRemote : copy.syncLocal
            }`}
          />
          <Chip label={`${copy.security}: ${runtime.securityLabel}`} />
        </Stack>

        <Alert severity="info" sx={{ borderRadius: 3 }}>
          {runtime.supportsCloudSync
            ? copy.remoteNotice
            : copy.localNotice}
        </Alert>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <Button
            variant="contained"
            disabled={exporting}
            onClick={handleExport}
            sx={{
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 800,
              background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
            }}
          >
            {exporting ? copy.exportBusy : copy.exportAction}
          </Button>

          {runtime.supportsSessionRevocation && (
            <Button
              variant="outlined"
              onClick={handleLogoutEverywhere}
              disabled={revokingSessions || deleting}
              sx={{
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 800,
              }}
            >
              {revokingSessions ? copy.revokeBusy : copy.revokeAction}
            </Button>
          )}

          <Button
            variant="outlined"
            color="error"
            onClick={() => setConfirmOpen(true)}
            disabled={deleting || revokingSessions}
            sx={{
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 800,
            }}
          >
            {deleting ? copy.deleteBusy : copy.deleteAction}
          </Button>
        </Stack>
      </Stack>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{copy.confirmTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>{copy.confirmBody}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ textTransform: "none" }}>
            {copy.confirmCancel}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteAccount}
            disabled={deleting}
            sx={{ textTransform: "none", fontWeight: 800 }}
          >
            {deleting ? copy.deleteBusy : copy.confirmDelete}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
