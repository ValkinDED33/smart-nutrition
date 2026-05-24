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
  exportRemoteAccountData,
  getAuthRuntimeInfo,
  getRemoteAccountBackup,
  getRemoteAccountBackups,
  logoutEverywhere,
  type AccountBackupSummary,
} from "../../shared/api/auth";
import { clearSyncOutbox } from "../../shared/lib/syncOutbox";
import { useLanguage } from "../../shared/language";

const accountCopy = {
  uk: {
    title: "Акаунт і дані",
    subtitle:
      "Експортуйте свої дані, перевіряйте, де вони зберігаються, і за потреби повністю видаляйте акаунт.",
    provider: "Режим зберігання",
    session: "Сесія",
    sync: "Синхронізація",
    security: "Безпека",
    providerRemote: "Віддалений API-акаунт",
    sessionRemote: "API-сесія access + refresh",
    securityRemote: "Сесії працюють через access + refresh токени з серверною перевіркою.",
    exportAction: "Експортувати мої дані",
    exportBusy: "Готуємо експорт...",
    exportSuccess: "Експорт даних готовий.",
    exportError: "Не вдалося створити експорт.",
    backupsTitle: "Резервні знімки",
    backupsSubtitle:
      "Останні хмарні точки відновлення, створені зі змін синхронізованого стану.",
    backupsEmpty: "Резервні знімки поки недоступні.",
    backupsLoading: "Завантажуємо резервні знімки...",
    backupDownload: "Завантажити резервну копію",
    backupBusy: "Завантаження...",
    backupError: "Не вдалося завантажити резервну копію.",
    deleteAction: "Видалити акаунт",
    revokeAction: "Вийти з усіх сесій",
    revokeBusy: "Скасовуємо сесії...",
    revokeSuccess: "Усі сесії було завершено.",
    revokeError: "Не вдалося завершити всі сесії.",
    deleteBusy: "Видалення...",
    deleteSuccess: "Акаунт видалено.",
    deleteError: "Не вдалося видалити акаунт.",
    remoteNotice:
      "Віддалені акаунти працюють через сесії access + refresh, фонову синхронізацію, хмарний стан із врахуванням конфліктів і резервні знімки на сервері.",
    confirmTitle: "Видалити цей акаунт?",
    confirmBody:
      "Це видалить акаунт, сесію, дані профілю, історію прийомів їжі, збережені продукти, шаблони й пам'ять штрихкодів для цієї інсталяції.",
    confirmCancel: "Скасувати",
    confirmDelete: "Так, видалити все",
    syncRemote: "Хмарна синхронізація активна",
  },
  pl: {
    title: "Konto i dane",
    subtitle:
      "Eksportuj swoje dane, sprawdzaj gdzie sa zapisane i w razie potrzeby usun konto calkowicie.",
    provider: "Tryb przechowywania",
    session: "Sesja",
    sync: "Synchronizacja",
    security: "Bezpieczenstwo",
    providerRemote: "Zdalne konto API",
    sessionRemote: "Sesja API access + refresh",
    securityRemote: "Sesje dzialaja przez tokeny access + refresh z weryfikacja po stronie serwera.",
    exportAction: "Eksportuj moje dane",
    exportBusy: "Przygotowujemy eksport...",
    exportSuccess: "Eksport danych jest gotowy.",
    exportError: "Nie udalo sie utworzyc eksportu.",
    backupsTitle: "Snapshoty kopii zapasowych",
    backupsSubtitle:
      "Ostatnie punkty przywracania z chmury utworzone ze zsynchronizowanych zmian stanu.",
    backupsEmpty: "Kopie zapasowe nie sa jeszcze dostepne.",
    backupsLoading: "Ladujemy kopie zapasowe...",
    backupDownload: "Pobierz kopie zapasowa",
    backupBusy: "Pobieranie...",
    backupError: "Nie udalo sie pobrac kopii zapasowej.",
    deleteAction: "Usun konto",
    revokeAction: "Wyloguj wszystkie sesje",
    revokeBusy: "Wycofywanie sesji...",
    revokeSuccess: "Wszystkie sesje zostaly zakonczone.",
    revokeError: "Nie udalo sie zakonczyc wszystkich sesji.",
    deleteBusy: "Usuwanie...",
    deleteSuccess: "Konto zostalo usuniete.",
    deleteError: "Nie udalo sie usunac konta.",
    remoteNotice:
      "Konta zdalne korzystaja z sesji access + refresh, synchronizacji w tle, wykrywania konfliktow i snapshotow zapasowych na serwerze.",
    confirmTitle: "Usunac to konto?",
    confirmBody:
      "To usunie konto, sesje, dane profilu, historie posilkow, zapisane produkty, szablony i pamiec kodow kreskowych dla tej instalacji.",
    confirmCancel: "Anuluj",
    confirmDelete: "Tak, usun wszystko",
    syncRemote: "Synchronizacja z chmura aktywna",
  },
} as const;

type AccountCopy = (typeof accountCopy)[keyof typeof accountCopy];

const formatBytes = (value: number) => {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const formatBackupTimestamp = (value: string, language: "uk" | "pl") =>
  new Date(value).toLocaleString(language === "uk" ? "uk-UA" : "pl-PL");

const getRuntimeLabels = (copy: AccountCopy) => ({
  provider: copy.providerRemote,
  session: copy.sessionRemote,
  security: copy.securityRemote,
});

export const AccountDataCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const { language } = useLanguage();
  const copy = accountCopy[language];
  const runtime = getAuthRuntimeInfo();
  const runtimeLabels = getRuntimeLabels(copy);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [exporting, setExporting] = useState(false);
  const [backups, setBackups] = useState<AccountBackupSummary[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(false);
  const [downloadingBackupId, setDownloadingBackupId] = useState<string | null>(null);
  const [revokingSessions, setRevokingSessions] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setBackupsLoading(true);

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
        borderRadius: 6,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.84)",
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

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
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
                      {formatBackupTimestamp(backup.updatedAt, language)} ·{" "}
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
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              borderColor: "error.light",
              backgroundColor: "rgba(254,242,242,0.72)",
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
