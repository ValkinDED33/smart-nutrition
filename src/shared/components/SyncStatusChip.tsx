import { useEffect, useState } from "react";
import { Chip, Tooltip } from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import {
  formatQueuedSyncMessage,
  translateSyncErrorMessage,
} from "../lib/syncMessaging";
import { useLanguage } from "../language";

const syncCopy = {
  uk: {
    localOnlyLabel: "Локально",
    localOnlyHint: "Дані залишаються в цьому браузері на цьому пристрої.",
    syncingLabel: "Йде синхронізація",
    syncingHint: "Останні зміни зберігаються в хмару.",
    syncedLabel: "Хмара OK",
    syncedRelative: "{time} тому",
    syncedHint: "Останній запис у хмару: {time}",
    errorLabel: "Проблема синхронізації",
    errorHint: "Останні зміни очікують успішної синхронізації з хмарою.",
    queuedSuffix: "у черзі: {count}",
    unknownTime: "щойно",
    oneMinute: "1 хв",
    minutes: "{count} хв",
    oneHour: "1 год",
    hours: "{count} год",
  },
  pl: {
    localOnlyLabel: "Tylko lokalnie",
    localOnlyHint: "Dane zostaja tylko w tej przegladarce na tym urzadzeniu.",
    syncingLabel: "Trwa synchronizacja",
    syncingHint: "Zapisuje ostatnie zmiany do chmury.",
    syncedLabel: "Chmura OK",
    syncedRelative: "{time} temu",
    syncedHint: "Ostatni zapis do chmury: {time}",
    errorLabel: "Blad synchronizacji",
    errorHint: "Ostatnie zmiany czekaja na udana synchronizacje z chmura.",
    queuedSuffix: "w kolejce: {count}",
    unknownTime: "przed chwila",
    oneMinute: "1 min",
    minutes: "{count} min",
    oneHour: "1 h",
    hours: "{count} h",
  },
} as const;

const formatAbsoluteSyncTime = (value: string | null, language: "uk" | "pl") => {
  if (!value) {
    return syncCopy[language].unknownTime;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return syncCopy[language].unknownTime;
  }

  return new Intl.DateTimeFormat(language === "pl" ? "pl-PL" : "uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const formatRelativeSyncAge = (
  value: string | null,
  language: "uk" | "pl",
  now: number
) => {
  if (!value) {
    return syncCopy[language].unknownTime;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return syncCopy[language].unknownTime;
  }

  const diffMs = Math.max(now - parsed.getTime(), 0);
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes <= 0) {
    return syncCopy[language].unknownTime;
  }

  if (diffMinutes === 1) {
    return syncCopy[language].oneMinute;
  }

  if (diffMinutes < 60) {
    return syncCopy[language].minutes.replace("{count}", String(diffMinutes));
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours === 1) {
    return syncCopy[language].oneHour;
  }

  return syncCopy[language].hours.replace("{count}", String(diffHours));
};

const SyncStatusChip = () => {
  const {
    isAuthenticated,
    syncMode,
    syncStatus,
    lastSyncedAt,
    syncError,
    syncOutbox,
  } = useSelector((state: RootState) => state.auth);
  const { language } = useLanguage();
  const copy = syncCopy[language];
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  const formattedTime = formatAbsoluteSyncTime(lastSyncedAt, language);
  const relativeTime = formatRelativeSyncAge(lastSyncedAt, language, now);
  const isRemote = syncMode === "remote-cloud";
  const translatedSyncError = translateSyncErrorMessage(syncError, language);

  const label = !isRemote
    ? copy.localOnlyLabel
    : syncStatus === "syncing"
      ? copy.syncingLabel
      : syncStatus === "error"
        ? copy.errorLabel
        : `${copy.syncedLabel} ${copy.syncedRelative.replace("{time}", relativeTime)}`;

  const title = !isRemote
    ? copy.localOnlyHint
    : syncStatus === "syncing"
      ? copy.syncingHint
      : syncStatus === "error"
        ? syncOutbox.pendingChanges > 0
          ? `${translatedSyncError ?? formatQueuedSyncMessage(syncOutbox.pendingChanges, language) ?? copy.errorHint} (${copy.queuedSuffix.replace("{count}", String(syncOutbox.pendingChanges))})`
          : translatedSyncError ?? copy.errorHint
        : copy.syncedHint.replace("{time}", formattedTime);

  return (
    <Tooltip title={title} arrow>
      <Chip
        size="small"
        label={label}
        color={
          !isRemote ? "default" : syncStatus === "error" ? "warning" : "success"
        }
        variant={syncStatus === "syncing" ? "filled" : "outlined"}
        sx={{
          borderRadius: 999,
          fontWeight: 700,
          bgcolor:
            syncStatus === "syncing"
              ? "rgba(15, 118, 110, 0.14)"
              : syncStatus === "error"
                ? "rgba(245, 158, 11, 0.12)"
                : "rgba(255,255,255,0.9)",
          borderColor:
            syncStatus === "error"
              ? "rgba(245, 158, 11, 0.35)"
              : "rgba(15, 23, 42, 0.08)",
        }}
      />
    </Tooltip>
  );
};

export default SyncStatusChip;
