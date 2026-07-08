import type { ReminderItem } from "@shared/api/reminders";

export const REMINDER_UPSERTED_EVENT = "smart-nutrition:reminder-upserted";

export interface ReminderUpsertedEventDetail {
  item: ReminderItem;
}

const isReminderItem = (value: unknown): value is ReminderItem =>
  Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as ReminderItem).id === "string" &&
      typeof (value as ReminderItem).title === "string" &&
      Array.isArray((value as ReminderItem).times)
  );

export const dispatchReminderUpserted = (item: ReminderItem) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<ReminderUpsertedEventDetail>(REMINDER_UPSERTED_EVENT, {
      detail: { item },
    })
  );
};

export const subscribeToReminderUpserts = (onReminder: (item: ReminderItem) => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleReminderUpsert = (event: Event) => {
    const detail = (event as CustomEvent<Partial<ReminderUpsertedEventDetail>>).detail;

    if (isReminderItem(detail?.item)) {
      onReminder(detail.item);
    }
  };

  window.addEventListener(REMINDER_UPSERTED_EVENT, handleReminderUpsert);

  return () => {
    window.removeEventListener(REMINDER_UPSERTED_EVENT, handleReminderUpsert);
  };
};
