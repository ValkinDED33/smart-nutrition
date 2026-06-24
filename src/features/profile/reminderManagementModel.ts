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
    const aTime = a.nextRunAt ? new Date(a.nextRunAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.nextRunAt ? new Date(b.nextRunAt).getTime() : Number.MAX_SAFE_INTEGER;

    return aTime - bTime;
  });
