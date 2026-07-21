import { useEffect, useState } from "react";
import { Chip, Tooltip } from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "@app/store";
import {
  formatQueuedSyncMessage,
  translateSyncErrorMessage,
} from "@shared/lib/syncMessaging";
import { useLanguage } from "@shared/language";
import type { AppLanguage } from "@shared/types/i18n";

const syncCopy = {
  uk: {
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
    syncingLabel: "Trwa synchronizacja",
    syncingHint: "Zapisuje ostatnie zmiany do chmury.",
    syncedLabel: "Chmura OK",
    syncedRelative: "{time} temu",
    syncedHint: "Ostatni zapis do chmury: {time}",
    errorLabel: "Błąd synchronizacji",
    errorHint: "Ostatnie zmiany czekają na udaną synchronizację z chmurą.",
    queuedSuffix: "w kolejce: {count}",
    unknownTime: "przed chwilą",
    oneMinute: "1 min",
    minutes: "{count} min",
    oneHour: "1 h",
    hours: "{count} h",
  },
  en: {
    syncingLabel: "Syncing",
    syncingHint: "Saving the latest changes to the cloud.",
    syncedLabel: "Cloud OK",
    syncedRelative: "{time} ago",
    syncedHint: "Last cloud save: {time}",
    errorLabel: "Sync issue",
    errorHint: "Latest changes are waiting for a successful cloud sync.",
    queuedSuffix: "queued: {count}",
    unknownTime: "just now",
    oneMinute: "1 min",
    minutes: "{count} min",
    oneHour: "1 h",
    hours: "{count} h",
  },
} as const;

const syncLocaleByLanguage: Record<AppLanguage, string> = {
  uk: "uk-UA",
  pl: "pl-PL",
  en: "en-US",
};

const getSyncCopy = (language: AppLanguage) => {
  switch (language) {
    case "uk":
      return syncCopy.uk;
    case "pl":
      return syncCopy.pl;
    case "en":
      return syncCopy.en;
  }
};

const getSyncLocale = (language: AppLanguage) => {
  switch (language) {
    case "uk":
      return syncLocaleByLanguage.uk;
    case "pl":
      return syncLocaleByLanguage.pl;
    case "en":
      return syncLocaleByLanguage.en;
  }
};

const formatAbsoluteSyncTime = (value: string | null, language: AppLanguage) => {
  const copy = getSyncCopy(language);

  if (!value) {
    return copy.unknownTime;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return copy.unknownTime;
  }

  return new Intl.DateTimeFormat(getSyncLocale(language), {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const formatRelativeSyncAge = (
  value: string | null,
  language: AppLanguage,
  now: number
) => {
  const copy = getSyncCopy(language);

  if (!value) {
    return copy.unknownTime;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return copy.unknownTime;
  }

  const diffMs = Math.max(now - parsed.getTime(), 0);
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes <= 0) {
    return copy.unknownTime;
  }

  if (diffMinutes === 1) {
    return copy.oneMinute;
  }

  if (diffMinutes < 60) {
    return copy.minutes.replace("{count}", String(diffMinutes));
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours === 1) {
    return copy.oneHour;
  }

  return copy.hours.replace("{count}", String(diffHours));
};

const SyncStatusChip = () => {
  const {
    isAuthenticated,
    syncStatus,
    lastSyncedAt,
    syncError,
    syncOutbox,
  } = useSelector((state: RootState) => state.auth);
  const { appLanguage } = useLanguage();
  const copy = getSyncCopy(appLanguage);
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

  const formattedTime = formatAbsoluteSyncTime(lastSyncedAt, appLanguage);
  const relativeTime = formatRelativeSyncAge(lastSyncedAt, appLanguage, now);
  const translatedSyncError = translateSyncErrorMessage(syncError, appLanguage);

  const label = syncStatus === "syncing"
      ? copy.syncingLabel
      : syncStatus === "error"
        ? copy.errorLabel
        : `${copy.syncedLabel} ${copy.syncedRelative.replace("{time}", relativeTime)}`;

  const title = syncStatus === "syncing"
      ? copy.syncingHint
      : syncStatus === "error"
        ? syncOutbox.pendingChanges > 0
          ? `${translatedSyncError ?? formatQueuedSyncMessage(syncOutbox.pendingChanges, appLanguage) ?? copy.errorHint} (${copy.queuedSuffix.replace("{count}", String(syncOutbox.pendingChanges))})`
          : translatedSyncError ?? copy.errorHint
        : copy.syncedHint.replace("{time}", formattedTime);

  return (
    <Tooltip title={title} arrow>
      <Chip
        size="small"
        label={label}
        color={
          syncStatus === "error" ? "warning" : "success"
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
                : "var(--sn-surface-glass)",
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
