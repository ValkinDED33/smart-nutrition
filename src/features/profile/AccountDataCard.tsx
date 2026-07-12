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
import {
  deleteAccount,
  createTelegramConnectLink,
  disconnectTelegram,
  exportRemoteAccountData,
  getAuthRuntimeInfo,
  getRemoteAccountBackup,
  getRemoteAccountBackups,
  getRemoteTelegramStatus,
  logoutEverywhere,
  type AccountBackupSummary,
  type TelegramConnectLink,
  type TelegramConnectionStatus,
} from "../../shared/api/auth";
import { clearSyncOutbox } from "../../shared/lib/syncOutbox";
import { useLanguage } from "../../shared/language";
import type { AppLanguage } from "../../shared/types/i18n";
import { accountCopy } from "./accountDataCardCopy";
import {
  TELEGRAM_CONNECT_STATUS_POLL_INTERVAL_MS,
  shouldPollTelegramConnectStatus,
} from "./telegramConnectStatusModel";

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
  const [backups, setBackups] = useState<AccountBackupSummary[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(true);
  const [downloadingBackupId, setDownloadingBackupId] = useState<string | null>(null);
  const [revokingSessions, setRevokingSessions] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [telegramStatus, setTelegramStatus] =
    useState<TelegramConnectionStatus | null>(null);
  const [telegramConnectLink, setTelegramConnectLink] =
    useState<TelegramConnectLink | null>(null);
  const [telegramLoading, setTelegramLoading] = useState(true);
  const [telegramBusy, setTelegramBusy] = useState(false);
  const [telegramConnectStartedAtMs, setTelegramConnectStartedAtMs] = useState<number | null>(
    null
  );
  const telegramConfigured = Boolean(telegramStatus?.configured);
  const telegramConnected = Boolean(telegramStatus?.connected);
  const telegramBotUsername = telegramStatus?.botUsername
    ? `@${telegramStatus.botUsername.replace(/^@+/, "")}`
    : null;

  useEffect(() => {
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
          setBackupsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [copy.backupError]);

  useEffect(() => {
    let cancelled = false;

    void getRemoteTelegramStatus()
      .then((status) => {
        if (!cancelled) {
          setTelegramStatus(status);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTelegramStatus(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setTelegramLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const hasConnectLink = Boolean(telegramConnectLink?.url);
    const shouldPoll = () =>
      shouldPollTelegramConnectStatus({
        connected: telegramConnected,
        hasConnectLink,
        startedAtMs: telegramConnectStartedAtMs,
        nowMs: Date.now(),
      });

    if (!shouldPoll()) {
      return undefined;
    }

    let cancelled = false;
    let intervalId: number | null = null;

    const refreshStatus = async () => {
      if (!shouldPoll()) {
        if (intervalId !== null) {
          window.clearInterval(intervalId);
        }
        setTelegramConnectStartedAtMs(null);
        return;
      }

      try {
        const status = await getRemoteTelegramStatus();

        if (cancelled) {
          return;
        }

        setTelegramStatus(status);

        if (status.connected) {
          setTelegramConnectLink(null);
          setTelegramConnectStartedAtMs(null);
          setNotice({ type: "success", message: copy.telegramConnected });

          if (intervalId !== null) {
            window.clearInterval(intervalId);
          }
        }
      } catch {
        // The profile card keeps the personal link visible; the next poll/focus can recover.
      }
    };

    const handleFocus = () => {
      void refreshStatus();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshStatus();
      }
    };

    intervalId = window.setInterval(() => {
      void refreshStatus();
    }, TELEGRAM_CONNECT_STATUS_POLL_INTERVAL_MS);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    void refreshStatus();

    return () => {
      cancelled = true;
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    copy.telegramConnected,
    telegramConnectLink?.url,
    telegramConnectStartedAtMs,
    telegramConnected,
  ]);

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

  const handleTelegramConnect = async () => {
    setTelegramBusy(true);
    setNotice(null);
    const pendingWindow = window.open("about:blank", "_blank");
    if (pendingWindow) {
      pendingWindow.opener = null;
    }

    try {
      const status = await createTelegramConnectLink();
      setTelegramStatus(status);
      setTelegramConnectLink(status);
      setTelegramConnectStartedAtMs(Date.now());

      if (pendingWindow) {
        pendingWindow.location.href = status.url;
      } else {
        window.location.assign(status.url);
      }

      setNotice({ type: "info", message: copy.telegramConnectPending });
    } catch {
      pendingWindow?.close();
      setNotice({ type: "error", message: copy.telegramConnectError });
    } finally {
      setTelegramBusy(false);
    }
  };

  const handleTelegramCopyLink = async () => {
    if (!telegramConnectLink?.url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(telegramConnectLink.url);
      setNotice({ type: "success", message: copy.telegramCopySuccess });
    } catch {
      setNotice({ type: "error", message: copy.telegramConnectError });
    }
  };

  const handleTelegramDisconnect = async () => {
    setTelegramBusy(true);
    setNotice(null);

    try {
      const status = await disconnectTelegram();
      setTelegramStatus(status);
      setTelegramConnectLink(null);
      setTelegramConnectStartedAtMs(null);
      setNotice({ type: "success", message: copy.telegramDisconnectSuccess });
    } catch {
      setNotice({ type: "error", message: copy.telegramDisconnectError });
    } finally {
      setTelegramBusy(false);
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

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip label={`${copy.provider}: ${runtimeLabels.provider}`} />
          <Chip label={`${copy.session}: ${runtimeLabels.session}`} />
          <Chip label={`${copy.sync}: ${copy.syncRemote}`} />
          <Chip label={`${copy.security}: ${runtimeLabels.security}`} />
        </Stack>

        <Alert severity="info" sx={{ borderRadius: 3 }}>
          {copy.remoteNotice}
        </Alert>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <Stack spacing={0.8}>
              <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                <Typography sx={{ fontWeight: 800 }}>{copy.telegramTitle}</Typography>
                <Chip
                  size="small"
                  color={telegramConnected ? "success" : "default"}
                  label={
                    telegramLoading
                      ? copy.telegramLoading
                      : telegramConnected
                        ? copy.telegramConnected
                        : copy.telegramDisconnected
                  }
                />
                {telegramBotUsername && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`${copy.telegramBot}: ${telegramBotUsername}`}
                  />
                )}
              </Stack>
              <Typography color="text.secondary">{copy.telegramSubtitle}</Typography>
              {!telegramLoading && !telegramConfigured && (
                <Typography variant="body2" color="warning.main">
                  {copy.telegramUnavailable}
                </Typography>
              )}
              {telegramConnected && telegramStatus?.connectedAt && (
                <Typography variant="body2" color="text.secondary">
                  {formatBackupTimestamp(telegramStatus.connectedAt, appLanguage)}
                </Typography>
              )}
              {!telegramConnected && telegramConnectLink?.url && (
                <Alert severity="info" sx={{ borderRadius: 3 }}>
                  <Stack spacing={1.2}>
                    <Typography variant="body2">
                      {copy.telegramConnectInstruction}
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap>
                      <Button
                        component="a"
                        href={telegramConnectLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="contained"
                        sx={{
                          borderRadius: 999,
                          textTransform: "none",
                          fontWeight: 800,
                        }}
                      >
                        {copy.telegramOpenPersonalLink}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          void handleTelegramCopyLink();
                        }}
                        sx={{
                          borderRadius: 999,
                          textTransform: "none",
                          fontWeight: 800,
                        }}
                      >
                        {copy.telegramCopyLink}
                      </Button>
                    </Stack>
                  </Stack>
                </Alert>
              )}
            </Stack>
            <Button
              variant={telegramConnected ? "outlined" : "contained"}
              disabled={telegramLoading || telegramBusy || !telegramConfigured}
              onClick={() => {
                void (telegramConnected
                  ? handleTelegramDisconnect()
                  : handleTelegramConnect());
              }}
              sx={{
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 800,
                whiteSpace: "nowrap",
                ...(telegramConnected
                  ? {}
                  : {
                      background:
                        "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
                    }),
              }}
            >
              {telegramBusy
                ? telegramConnected
                  ? copy.telegramDisconnecting
                  : copy.telegramConnecting
                : telegramConnected
                  ? copy.telegramDisconnect
                  : copy.telegramConnect}
            </Button>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
          <Stack spacing={1.2}>
            <Stack spacing={0.4}>
              <Typography sx={{ fontWeight: 800 }}>{copy.backupsTitle}</Typography>
              <Typography color="text.secondary">{copy.backupsSubtitle}</Typography>
            </Stack>
            {backupsLoading ? (
              <Typography color="text.secondary">{copy.backupsLoading}</Typography>
            ) : backups.length === 0 ? (
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
