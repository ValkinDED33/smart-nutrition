import type { ReminderAction, ReminderItem, ReminderType } from "@shared/api/reminders";

export const reminderTypeOptions: ReminderType[] = [
  "task",
  "medication",
  "medication_course",
  "pregnancy_supplement",
  "water",
  "habit",
];

const medicationLikeReminderTypes = new Set<ReminderType>([
  "medication",
  "medication_course",
  "pregnancy_supplement",
]);

export const toReminderType = (value: string): ReminderType =>
  reminderTypeOptions.includes(value as ReminderType) ? (value as ReminderType) : "task";

export const isMedicationLikeReminderType = (reminderType: ReminderType) =>
  medicationLikeReminderTypes.has(reminderType);

export const getReminderPrimaryAction = (reminderType: ReminderType): ReminderAction =>
  isMedicationLikeReminderType(reminderType) ? "taken" : "done";

export const getReminderPrimaryActionLabelKey = (
  reminderType: ReminderType
): "taken" | "waterLogged" | "done" => {
  if (isMedicationLikeReminderType(reminderType)) {
    return "taken";
  }

  if (reminderType === "water") {
    return "waterLogged";
  }

  return "done";
};

export const getReminderQuantityLabelKey = (
  reminderType: ReminderType
): "dose" | "portion" | null => {
  if (isMedicationLikeReminderType(reminderType)) {
    return "dose";
  }

  if (reminderType === "water") {
    return "portion";
  }

  return null;
};

export const sortReminders = (items: ReminderItem[]) =>
  [...items].sort((a, b) => {
    if (a.active !== b.active) {
      return a.active ? -1 : 1;
    }

    const aTime = a.nextRunAt ? new Date(a.nextRunAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.nextRunAt ? new Date(b.nextRunAt).getTime() : Number.MAX_SAFE_INTEGER;

    return aTime - bTime;
  });

export const upsertReminderItem = (items: ReminderItem[], item: ReminderItem) =>
  sortReminders([item, ...items.filter((entry) => entry.id !== item.id)]);

const fallbackReminderTimeZone = "Europe/Warsaw";

export const formatReminderDateTime = (
  reminder: Pick<ReminderItem, "nextRunAt" | "timezone">,
  locale: string
) => {
  if (!reminder.nextRunAt) {
    return "";
  }

  const date = new Date(reminder.nextRunAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timeZone = reminder.timezone.trim() || fallbackReminderTimeZone;
  const options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  };

  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    return new Intl.DateTimeFormat(locale, {
      ...options,
      timeZone: fallbackReminderTimeZone,
    }).format(date);
  }
};
