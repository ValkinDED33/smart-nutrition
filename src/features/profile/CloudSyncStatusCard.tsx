import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import { pullLatestCloudSnapshot, retryCloudSync } from "../auth/authSlice";
import {
  formatRemoteDeviceSuffix,
  getRemoteDeviceId,
  resolveRemoteWriterOwnership,
} from "../../shared/lib/remoteDevice";
import {
  formatQueuedSyncMessage,
  translateSyncErrorMessage,
} from "../../shared/lib/syncMessaging";
import { useLanguage } from "../../shared/language";
import type { AppLanguage } from "../../shared/types/i18n";

const syncStatusCopy = {
  uk: {
    title: "Статус хмарної синхронізації",
    subtitle:
      "Перевіряйте, де зберігаються дані про харчування, і одразу повторюйте синхронізацію, якщо сервер не підтвердив останню зміну.",
    remoteMode: "Хмарний API",
    remoteInfo:
      "Цей акаунт підключений до бекенда. Зміни профілю та прийомів їжі синхронізуються у фоні, а новіші хмарні знімки підтягуються автоматично.",
    statusLabel: "Статус",
    lastSyncLabel: "Остання підтверджена синхронізація",
    syncingStatus: "Синхронізація триває",
    syncedStatus: "Хмара в нормі",
    errorStatus: "Потрібен повтор",
    retryAction: "Повторити синхронізацію",
    syncingAction: "Синхронізуємо...",
    syncNowAction: "Синхронізувати зараз",
    pullLatestAction: "Використати версію з хмари",
    pullShadowAction: "Підтягнути останні хмарні дані",
    writerLabel: "Останній запис у хмару",
    writerCurrent: "Цей пристрій",
    writerOther: "Інший пристрій",
    writerUnknown: "Невідомо",
    pendingChangesLabel: "Зміни очікують підтвердження",
    queuedSinceLabel: "У черзі з",
    unknownTime: "Ще не синхронізовано",
  },
  pl: {
    title: "Status synchronizacji",
    subtitle:
      "Sprawdz, gdzie sa zapisane dane o jedzeniu i od razu ponow synchronizacje, jesli serwer nie potwierdzil ostatniej zmiany.",
    remoteMode: "Chmura API",
    remoteInfo:
      "To konto jest polaczone z backendem. Zmiany profilu i posilkow synchronizuja sie w tle, a nowsze snapshoty z chmury sa pobierane automatycznie.",
    statusLabel: "Status",
    lastSyncLabel: "Ostatnia potwierdzona synchronizacja",
    syncingStatus: "Trwa synchronizacja",
    syncedStatus: "Chmura OK",
    errorStatus: "Wymaga ponowienia",
    retryAction: "Powtorz synchronizacje",
    syncingAction: "Synchronizuje...",
    syncNowAction: "Synchronizuj teraz",
    pullLatestAction: "Uzyj wersji z chmury",
    pullShadowAction: "Pobierz najnowsze dane",
    writerLabel: "Ostatni zapis do chmury",
    writerCurrent: "To urzadzenie",
    writerOther: "Inne urzadzenie",
    writerUnknown: "Nieznane",
    pendingChangesLabel: "Zmiany oczekuja na potwierdzenie",
    queuedSinceLabel: "W kolejce od",
    unknownTime: "Jeszcze nie zsynchronizowano",
  },
  en: {
    title: "Cloud sync status",
    subtitle:
      "Check where your nutrition data is saved and retry sync right away if the server has not confirmed the latest change.",
    remoteMode: "Cloud API",
    remoteInfo:
      "This account is connected to the backend. Profile and meal changes sync in the background, and newer cloud snapshots are pulled automatically.",
    statusLabel: "Status",
    lastSyncLabel: "Last confirmed sync",
    syncingStatus: "Syncing",
    syncedStatus: "Cloud OK",
    errorStatus: "Retry needed",
    retryAction: "Retry sync",
    syncingAction: "Syncing...",
    syncNowAction: "Sync now",
    pullLatestAction: "Use cloud version",
    pullShadowAction: "Pull latest cloud data",
    writerLabel: "Last cloud write",
    writerCurrent: "This device",
    writerOther: "Other device",
    writerUnknown: "Unknown",
    pendingChangesLabel: "Changes waiting for confirmation",
    queuedSinceLabel: "Queued since",
    unknownTime: "Not synced yet",
  },
} as const;

const syncStatusLocaleByLanguage: Record<AppLanguage, string> = {
  uk: "uk-UA",
  pl: "pl-PL",
  en: "en-US",
};

const formatSyncTime = (value: string | null, language: AppLanguage) => {
  if (!value) {
    return syncStatusCopy[language].unknownTime;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return syncStatusCopy[language].unknownTime;
  }

  return new Intl.DateTimeFormat(syncStatusLocaleByLanguage[language], {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(parsed);
};

export const CloudSyncStatusCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, syncStatus, syncError, lastSyncedAt, syncOutbox, cloudMeta } =
    useSelector((state: RootState) => state.auth);
  const { appLanguage } = useLanguage();
  const copy = syncStatusCopy[appLanguage];

  if (!user) {
    return null;
  }

  const isSyncing = syncStatus === "syncing";
  const hasConflict = Boolean(syncError?.includes("another device"));
  const translatedSyncError = translateSyncErrorMessage(syncError, appLanguage);
  const currentDeviceId = getRemoteDeviceId();
  const writerOwnership = resolveRemoteWriterOwnership(
    currentDeviceId,
    cloudMeta?.lastWriterDeviceId
  );
  const writerText =
    writerOwnership === "current-device"
      ? copy.writerCurrent
      : writerOwnership === "other-device"
        ? `${copy.writerOther}${
            formatRemoteDeviceSuffix(cloudMeta?.lastWriterDeviceId)
              ? ` #${formatRemoteDeviceSuffix(cloudMeta?.lastWriterDeviceId)}`
              : ""
          }`
        : copy.writerUnknown;
  const statusText = syncStatus === "syncing"
      ? copy.syncingStatus
      : syncStatus === "error"
        ? copy.errorStatus
        : copy.syncedStatus;

  const handleRetry = () => {
    void dispatch(retryCloudSync());
  };

  const handlePullLatest = () => {
    void dispatch(
      pullLatestCloudSnapshot({
        discardQueuedChanges: hasConflict,
      })
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        backgroundColor: "var(--sn-surface-glass)",
      }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.8 }}>
            {copy.subtitle}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip label={copy.remoteMode} />
          <Chip
            label={`${copy.statusLabel}: ${statusText}`}
            color={syncStatus === "error" ? "warning" : "success"}
            variant={syncStatus === "syncing" ? "filled" : "outlined"}
          />
          <Chip label={`${copy.lastSyncLabel}: ${formatSyncTime(lastSyncedAt, appLanguage)}`} />
          <Chip label={`${copy.writerLabel}: ${writerText}`} variant="outlined" />
          {syncOutbox.pendingChanges > 0 && (
            <Chip
              label={`${copy.pendingChangesLabel}: ${syncOutbox.pendingChanges}`}
              color="warning"
            />
          )}
        </Stack>

        <Alert
          severity={syncStatus === "error" ? "warning" : "success"}
          sx={{ borderRadius: 3 }}
        >
          {syncOutbox.pendingChanges > 0
            ? `${translatedSyncError ?? formatQueuedSyncMessage(syncOutbox.pendingChanges, appLanguage) ?? copy.remoteInfo} ${copy.queuedSinceLabel}: ${formatSyncTime(
                syncOutbox.firstQueuedAt,
                appLanguage
              )}.`
            : translatedSyncError ?? copy.remoteInfo}
        </Alert>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            variant="contained"
            onClick={handleRetry}
            disabled={isSyncing}
            sx={{
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 800,
              background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
            }}
          >
            {isSyncing
              ? copy.syncingAction
              : syncStatus === "error"
                ? copy.retryAction
                : copy.syncNowAction}
          </Button>

          <Button
            variant={hasConflict ? "outlined" : "text"}
            onClick={handlePullLatest}
            disabled={isSyncing}
            color={hasConflict ? "warning" : "inherit"}
            sx={{
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 800,
            }}
          >
            {hasConflict ? copy.pullLatestAction : copy.pullShadowAction}
          </Button>

        </Stack>
      </Stack>
    </Paper>
  );
};
