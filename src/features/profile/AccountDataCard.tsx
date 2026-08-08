import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { resetAppState, type AppDispatch, type RootState } from "../../app/store";
import { canAccessAdminCenter } from "@domain/user/roles";
import {
  deleteAccount,
  exportRemoteAccountData,
  getAuthRuntimeInfo,
  getRemoteAccountBackup,
  getRemoteAccountBackups,
  logoutEverywhere,
  type AccountBackupSummary,
} from "../../shared/api/auth";
import { clearSyncOutbox } from "../../shared/lib/syncOutbox";
import { useLanguage } from "../../shared/language";
import type { AppLanguage } from "../../shared/types/i18n";
import { accountCopy } from "./accountDataCardCopy";

type AccountCopy = (typeof accountCopy)[keyof typeof accountCopy];

const formatBytes = (value: number) => {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const accountLocaleByLanguage: Record<AppLanguage, string> = {
  uk: "uk-UA",
  pl: "pl-PL",
  en: "en-US",
};

const getAccountCopy = (language: AppLanguage): AccountCopy => {
  switch (language) {
    case "pl":
      return accountCopy.pl;
    case "en":
      return accountCopy.en;
    case "uk":
    default:
      return accountCopy.uk;
  }
};

const getAccountLocale = (language: AppLanguage) => {
  switch (language) {
    case "pl":
      return accountLocaleByLanguage.pl;
    case "en":
      return accountLocaleByLanguage.en;
    case "uk":
    default:
      return accountLocaleByLanguage.uk;
  }
};

const formatBackupTimestamp = (value: string, language: AppLanguage) =>
  new Date(value).toLocaleString(getAccountLocale(language));

const getRuntimeLabels = (copy: AccountCopy) => ({
  provider: copy.providerRemote,
  session: copy.sessionRemote,
  security: copy.securityRemote,
});

export const AccountDataCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const { appLanguage } = useLanguage();
  const copy = getAccountCopy(appLanguage);
  const runtime = getAuthRuntimeInfo();
  const runtimeLabels = getRuntimeLabels(copy);
  const [notice, setNotice] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [backups, setBackups] = useState<AccountBackupSummary[] | null>(null);
  const [downloadingBackupId, setDownloadingBackupId] = useState<string | null>(null);
  const [revokingSessions, setRevokingSessions] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const canSeeOperationalDetails = canAccessAdminCenter(user?.role);
  const backupsLoading = canSeeOperationalDetails && backups === null;

  useEffect(() => {
    if (!canSeeOperationalDetails) {
      return undefined;
    }

    let cancelled = false;

    void getRemoteAccountBackups()
      .then((items) => {
        if (!cancelled) {
          setBackups(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNotice({ type: "error", message: copy.backupError });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBackups((currentBackups) => currentBackups ?? []);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canSeeOperationalDetails, copy.backupError]);

  if (!user) return null;

  const triggerJsonDownload = (payload: unknown, fileName: string) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
  };

  const handleExport = async () => {
    setExporting(true);
    setNotice(null);

    try {
      const payload = await exportRemoteAccountData();

      triggerJsonDownload(
        payload,
        `smart-nutrition-export-${new Date().toISOString().slice(0, 10)}.json`
      );

      setNotice({ type: "success", message: copy.exportSuccess });
    } catch {
      setNotice({ type: "error", message: copy.exportError });
    } finally {
      setExporting(false);
    }
  };

  const handleBackupDownload = async (backup: AccountBackupSummary) => {
    setDownloadingBackupId(backup.id);
    setNotice(null);

    try {
      const payload = await getRemoteAccountBackup(backup.id);
      triggerJsonDownload(payload, backup.name);
    } catch {
      setNotice({ type: "error", message: copy.backupError });
    } finally {
      setDownloadingBackupId(null);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setNotice(null);

    try {
      await deleteAccount(user.email);
      clearSyncOutbox();
      dispatch(resetAppState());
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
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        backgroundColor: "var(--sn-surface-glass)",
        boxShadow: "var(--sn-shadow-card)",
      }}
    >
      <Stack spacing={2.5}>
        <Box>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.8 }}>
            {copy.subtitle}
          </Typography>
        </Box>

        {notice && <Alert severity={notice.type}>{notice.message}</Alert>}

        {canSeeOperationalDetails && (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label={`${copy.provider}: ${runtimeLabels.provider}`} />
            <Chip label={`${copy.session}: ${runtimeLabels.session}`} />
            <Chip label={`${copy.sync}: ${copy.syncRemote}`} />
            <Chip label={`${copy.security}: ${runtimeLabels.security}`} />
          </Stack>
        )}

        <Alert severity="info" sx={{ borderRadius: 3 }}>
          {copy.remoteNotice}
        </Alert>

        {canSeeOperationalDetails && (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
            <Stack spacing={1.2}>
              <Stack spacing={0.4}>
                <Typography sx={{ fontWeight: 800 }}>{copy.backupsTitle}</Typography>
                <Typography color="text.secondary">{copy.backupsSubtitle}</Typography>
              </Stack>
              {backupsLoading ? (
                <Typography color="text.secondary">{copy.backupsLoading}</Typography>
              ) : !backups || backups.length === 0 ? (
                <Typography color="text.secondary">{copy.backupsEmpty}</Typography>
              ) : (
                backups.slice(0, 4).map((backup) => (
                  <Stack
                    key={backup.id}
                    direction={{ xs: "column", md: "row" }}
                    spacing={1}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", md: "center" }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>{backup.reason}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatBackupTimestamp(backup.updatedAt, appLanguage)} ·{" "}
                        {formatBytes(backup.sizeBytes)}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        void handleBackupDownload(backup);
                      }}
                      disabled={downloadingBackupId === backup.id}
                      sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                      {downloadingBackupId === backup.id
                        ? copy.backupBusy
                        : copy.backupDownload}
                    </Button>
                  </Stack>
                ))
              )}
            </Stack>
          </Paper>
        )}

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          {runtime.supportsDataExport && (
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
          )}

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

          {runtime.supportsAccountDeletion && (
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
          )}
        </Stack>

        {confirmOpen && (
          <Paper
            className="sn-premium-panel"
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              borderColor: "error.light",
            }}
          >
            <Stack spacing={1.5}>
              <Typography sx={{ fontWeight: 900 }}>{copy.confirmTitle}</Typography>
              <Typography color="text.secondary">{copy.confirmBody}</Typography>
              <Stack direction="row" spacing={1} justifyContent="flex-end" useFlexGap flexWrap="wrap">
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
              </Stack>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Paper>
  );
};
