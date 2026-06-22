import {
  calculateNextMedicationRunAt,
  createMedicationReminderService,
  parseHabitReminderText,
  parseMedicationReminderText,
  parseMedicationCourseReminderText,
  parsePregnancySupplementReminderText,
  parseTaskReminderText,
  parseWaterReminderText,
} from "./medicationReminderService.mjs";

const SUPPORTED_REMINDER_TYPES = [
  "medication",
  "medication_course",
  "pregnancy_supplement",
  "water",
  "habit",
  "task",
];
const BACKWARD_COMPATIBLE_STORAGE_KEY = "medicationReminders";
const REMINDER_ACTIONS = new Set(["taken", "done", "snoozed", "skipped"]);
const SUPPORTED_REMINDER_TYPE_SET = new Set(SUPPORTED_REMINDER_TYPES);

const normalizeReminderType = (value) =>
  SUPPORTED_REMINDER_TYPE_SET.has(String(value ?? "").trim())
    ? String(value ?? "").trim()
    : null;

const normalizeReminderAction = (value) => {
  const action = String(value ?? "").trim();

  return REMINDER_ACTIONS.has(action) ? action : null;
};

export const createReminderService = (options = {}) => {
  const legacyReminderService = createMedicationReminderService(options);

  const listReminders = (user, { activeOnly = false } = {}) => {
    const reminders = legacyReminderService.getUserReminders(user);

    return activeOnly ? reminders.filter((reminder) => reminder.active) : reminders;
  };

  const createReminderFromUserText = async (user, { type, text }, now = new Date()) => {
    const reminderType = normalizeReminderType(type);

    if (!reminderType) {
      return { ok: false, code: "REMINDER_TYPE_INVALID" };
    }

    const createByType = {
      medication: legacyReminderService.createReminderFromText,
      medication_course: legacyReminderService.createMedicationCourseReminderFromText,
      pregnancy_supplement: legacyReminderService.createPregnancySupplementReminderFromText,
      water: legacyReminderService.createWaterReminderFromText,
      habit: legacyReminderService.createHabitReminderFromText,
      task: legacyReminderService.createTaskReminderFromText,
    };
    const createReminder = createByType[reminderType];

    return createReminder(user, text, now);
  };

  const recordReminderAction = async (user, reminderId, action, now = new Date()) => {
    const reminderAction = normalizeReminderAction(action);

    if (!reminderAction) {
      return { ok: false, code: "REMINDER_ACTION_INVALID" };
    }

    return legacyReminderService.recordReminderAction(user, reminderId, reminderAction, now);
  };

  return {
    ...legacyReminderService,
    listReminders,
    createReminderFromUserText,
    createMedicationReminderFromText: legacyReminderService.createReminderFromText,
    createMedicationCourseReminderFromText:
      legacyReminderService.createMedicationCourseReminderFromText,
    createPregnancySupplementReminderFromText:
      legacyReminderService.createPregnancySupplementReminderFromText,
    createWaterReminderFromText: legacyReminderService.createWaterReminderFromText,
    createHabitReminderFromText: legacyReminderService.createHabitReminderFromText,
    recordMedicationAction: legacyReminderService.recordDoseAction,
    recordReminderAction,
    getStatus: () => ({
      enabled: Boolean(options.authRepository?.updateUserMedicationReminders),
      storageKey: BACKWARD_COMPATIBLE_STORAGE_KEY,
      backwardCompatibleStorage: true,
      supportedTypes: SUPPORTED_REMINDER_TYPES,
    }),
  };
};

export {
  calculateNextMedicationRunAt,
  parseHabitReminderText,
  parseMedicationReminderText,
  parseMedicationCourseReminderText,
  parsePregnancySupplementReminderText,
  parseTaskReminderText,
  parseWaterReminderText,
};
