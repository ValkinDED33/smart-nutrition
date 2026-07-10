import type { AppLanguage } from "../types/i18n";

const syncMessageCopy = {
  uk: {
    queuedOne: "1 зміна очікує підтвердження з хмари.",
    queuedMany: (count: number) =>
      `${count} змін очікують підтвердження з хмари.`,
    conflict: "Хмарні дані змінилися на іншому пристрої. Спершу підтягніть актуальну версію з хмари.",
    saveFailed: "Не вдалося зберегти останні зміни у хмарі.",
    pullFailed: "Не вдалося підтягнути останній знімок із хмари.",
    inactive: "Для цього акаунта хмарна синхронізація зараз не активна.",
  },
  pl: {
    queuedOne: "1 zmiana czeka na potwierdzenie z chmury.",
    queuedMany: (count: number) =>
      `${count} zmian czeka na potwierdzenie z chmury.`,
    conflict:
      "Dane w chmurze zmienily sie na innym urzadzeniu. Najpierw pobierz najnowsza wersje z chmury.",
    saveFailed: "Nie udalo sie zapisac ostatnich zmian w chmurze.",
    pullFailed: "Nie udalo sie pobrac najnowszego snapshotu z chmury.",
    inactive: "Synchronizacja z chmura nie jest teraz aktywna dla tego konta.",
  },
  en: {
    queuedOne: "1 change is waiting for cloud confirmation.",
    queuedMany: (count: number) =>
      `${count} changes are waiting for cloud confirmation.`,
    conflict:
      "Cloud data changed on another device. Pull the latest cloud version first.",
    saveFailed: "Could not save the latest changes to the cloud.",
    pullFailed: "Could not pull the latest cloud snapshot.",
    inactive: "Cloud sync is not active for this account right now.",
  },
} as const;

type SyncMessageCopy = (typeof syncMessageCopy)[keyof typeof syncMessageCopy];

const getSyncMessageCopy = (language: AppLanguage): SyncMessageCopy => {
  switch (language) {
    case "pl":
      return syncMessageCopy.pl;
    case "en":
      return syncMessageCopy.en;
    case "uk":
    default:
      return syncMessageCopy.uk;
  }
};

export const formatQueuedSyncMessage = (pendingChanges: number, language: AppLanguage) =>
  pendingChanges <= 1
    ? getSyncMessageCopy(language).queuedOne
    : getSyncMessageCopy(language).queuedMany(pendingChanges);

export const translateSyncErrorMessage = (
  message: string | null | undefined,
  language: AppLanguage
) => {
  if (!message) {
    return null;
  }

  const queuedMatch = message.match(/^(\d+) (?:local|unsynced) changes? .*(?:queued|waiting).*cloud/i);

  if (queuedMatch) {
    return formatQueuedSyncMessage(Number(queuedMatch[1]), language);
  }

  const copy = getSyncMessageCopy(language);

  if (/another device/i.test(message)) {
    return copy.conflict;
  }

  if (/latest cloud snapshot/i.test(message)) {
    return copy.pullFailed;
  }

  if (/not enabled|not active/i.test(message)) {
    return copy.inactive;
  }

  if (/cloud sync could not save|latest profile and meal data|latest change/i.test(message)) {
    return copy.saveFailed;
  }

  return message;
};
