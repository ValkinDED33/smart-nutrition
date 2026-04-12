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

const syncStatusCopy = {
  uk: {
    title: "Статус хмарної синхронізації",
    subtitle:
      "Перевіряйте, де зберігаються дані про харчування, і одразу повторюйте синхронізацію, якщо сервер не підтвердив останню зміну.",
    localMode: "Лише браузер",
    remoteMode: "Хмарний API",
    localInfo:
      "Цей акаунт зараз працює лише локально. Дані залишаються в цьому браузері на цьому пристрої.",
    remoteInfo:
      "Цей акаунт підключений до бекенда. Зміни профілю та прийомів їжі синхронізуються у фоні, а новіші хмарні знімки підтягуються автоматично.",
    statusLabel: "Статус",
    lastSyncLabel: "Остання підтверджена синхронізація",
    localStatus: "Локально",
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
    pendingChangesLabel: "Локальні зміни в черзі",
    queuedSinceLabel: "У черзі з",
    unknownTime: "Ще не синхронізовано",
  },
  pl: {
    title: "Status synchronizacji",
    subtitle:
      "Sprawdz, gdzie sa zapisane dane o jedzeniu i od razu ponow synchronizacje, jesli serwer nie potwierdzil ostatniej zmiany.",
    localMode: "Tylko przegladarka",
    remoteMode: "Chmura API",
    localInfo:
      "To konto dziala lokalnie. Dane zostaja tylko w tej przegladarce na tym urzadzeniu.",
    remoteInfo:
      "To konto jest polaczone z backendem. Zmiany profilu i posilkow synchronizuja sie w tle, a nowsze snapshoty z chmury sa pobierane automatycznie.",
    statusLabel: "Status",
    lastSyncLabel: "Ostatnia potwierdzona synchronizacja",
    localStatus: "Tylko lokalnie",
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
    pendingChangesLabel: "Oczekujace zmiany lokalne",
    queuedSinceLabel: "W kolejce od",
    unknownTime: "Jeszcze nie zsynchronizowano",
  },
} as const;

const formatSyncTime = (value: string | null, language: "uk" | "pl") => {
  if (!value) {
    return syncStatusCopy[language].unknownTime;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return syncStatusCopy[language].unknownTime;
  }

  return new Intl.DateTimeFormat(language === "pl" ? "pl-PL" : "uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(parsed);
};

export const CloudSyncStatusCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, syncMode, syncStatus, syncError, lastSyncedAt, syncOutbox, cloudMeta } =
    useSelector((state: RootState) => state.auth);
  const { language } = useLanguage();
  const copy = syncStatusCopy[language];

  if (!user) {
    return null;
  }

  const isRemote = syncMode === "remote-cloud";
  const isSyncing = syncStatus === "syncing";
  const hasConflict = Boolean(syncError?.includes("another device"));
  const translatedSyncError = translateSyncErrorMessage(syncError, language);
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
  const statusText = !isRemote
    ? copy.localStatus
    : syncStatus === "syncing"
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
        borderRadius: 6,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.8 }}>
            {copy.subtitle}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip label={isRemote ? copy.remoteMode : copy.localMode} />
          <Chip
            label={`${copy.statusLabel}: ${statusText}`}
            color={
              !isRemote ? "default" : syncStatus === "error" ? "warning" : "success"
            }
            variant={syncStatus === "syncing" ? "filled" : "outlined"}
          />
          {isRemote && (
            <Chip label={`${copy.lastSyncLabel}: ${formatSyncTime(lastSyncedAt, language)}`} />
          )}
          {isRemote && (
            <Chip label={`${copy.writerLabel}: ${writerText}`} variant="outlined" />
          )}
          {isRemote && syncOutbox.pendingChanges > 0 && (
            <Chip
              label={`${copy.pendingChangesLabel}: ${syncOutbox.pendingChanges}`}
              color="warning"
            />
          )}
        </Stack>

        <Alert
          severity={!isRemote ? "info" : syncStatus === "error" ? "warning" : "success"}
          sx={{ borderRadius: 3 }}
        >
          {isRemote
            ? syncOutbox.pendingChanges > 0
              ? `${translatedSyncError ?? formatQueuedSyncMessage(syncOutbox.pendingChanges, language) ?? copy.remoteInfo} ${copy.queuedSinceLabel}: ${formatSyncTime(
                  syncOutbox.firstQueuedAt,
                  language
                )}.`
              : translatedSyncError ?? copy.remoteInfo
            : copy.localInfo}
        </Alert>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          {isRemote && (
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
          )}

          {isRemote && (
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
          )}

        </Stack>
      </Stack>
    </Paper>
  );
};
