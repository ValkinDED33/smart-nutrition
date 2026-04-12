import type { AppLanguage } from "../types/i18n";

const syncMessageCopy = {
  uk: {
    queuedOne: "1 локальна зміна очікує успішної синхронізації з хмарою.",
    queuedMany: (count: number) =>
      `${count} локальних змін очікують успішної синхронізації з хмарою.`,
    conflict: "Хмарні дані змінилися на іншому пристрої. Спершу підтягніть актуальну версію з хмари.",
    saveFailed: "Не вдалося зберегти останні зміни у хмарі.",
    pullFailed: "Не вдалося підтягнути останній знімок із хмари.",
    inactive: "Для цього акаунта хмарна синхронізація зараз не активна.",
  },
  pl: {
    queuedOne: "1 lokalna zmiana czeka na udana synchronizacje z chmura.",
    queuedMany: (count: number) =>
      `${count} lokalnych zmian czeka na udana synchronizacje z chmura.`,
    conflict:
      "Dane w chmurze zmienily sie na innym urzadzeniu. Najpierw pobierz najnowsza wersje z chmury.",
    saveFailed: "Nie udalo sie zapisac ostatnich zmian w chmurze.",
    pullFailed: "Nie udalo sie pobrac najnowszego snapshotu z chmury.",
    inactive: "Synchronizacja z chmura nie jest teraz aktywna dla tego konta.",
  },
} as const;

export const formatQueuedSyncMessage = (pendingChanges: number, language: AppLanguage) =>
  pendingChanges <= 1
    ? syncMessageCopy[language].queuedOne
    : syncMessageCopy[language].queuedMany(pendingChanges);

export const translateSyncErrorMessage = (
  message: string | null | undefined,
  language: AppLanguage
) => {
  if (!message) {
    return null;
  }

  const queuedMatch = message.match(/^(\d+) local changes? .*queued.*cloud sync\.?$/i);

  if (queuedMatch) {
    return formatQueuedSyncMessage(Number(queuedMatch[1]), language);
  }

  if (/another device/i.test(message)) {
    return syncMessageCopy[language].conflict;
  }

  if (/latest cloud snapshot/i.test(message)) {
    return syncMessageCopy[language].pullFailed;
  }

  if (/not enabled|not active/i.test(message)) {
    return syncMessageCopy[language].inactive;
  }

  if (/cloud sync could not save|latest profile and meal data|latest change/i.test(message)) {
    return syncMessageCopy[language].saveFailed;
  }

  return message;
};
