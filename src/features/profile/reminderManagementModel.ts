import type {
  ReminderAction,
  ReminderEvent,
  ReminderItem,
  ReminderTrigger,
  ReminderType,
} from "@shared/api/reminders";

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
const afterMealTriggerKind = "after_meal";
const positiveAdherenceActions = new Set(["taken", "done"]);
const trackedAdherenceActions = new Set(["taken", "done", "skipped", "snoozed"]);

export type ReminderAdherenceSummary = {
  total: number;
  completed: number;
  skipped: number;
  snoozed: number;
  completionRate: number | null;
  lastEvent: ReminderEvent | null;
};

export type ReminderAdherenceRangeSummary = ReminderAdherenceSummary & {
  reminderCount: number;
  activeReminderCount: number;
  since: string;
  riskLevel: "good" | "watch" | "missing";
};

const getEventTime = (event: ReminderEvent) => {
  const time = Date.parse(event.createdAt);

  return Number.isFinite(time) ? time : 0;
};

export const getReminderAdherenceSummary = (
  reminder: Pick<ReminderItem, "events">
): ReminderAdherenceSummary => {
  const events = Array.isArray(reminder.events)
    ? reminder.events
        .filter((event) => trackedAdherenceActions.has(event.action))
        .sort((first, second) => getEventTime(second) - getEventTime(first))
    : [];
  const completed = events.filter((event) => positiveAdherenceActions.has(event.action)).length;
  const skipped = events.filter((event) => event.action === "skipped").length;
  const snoozed = events.filter((event) => event.action === "snoozed").length;
  const decisiveTotal = completed + skipped;

  return {
    total: events.length,
    completed,
    skipped,
    snoozed,
    completionRate: decisiveTotal > 0 ? Math.round((completed / decisiveTotal) * 100) : null,
    lastEvent: events[0] ?? null,
  };
};

export const getReminderAdherenceRangeSummary = (
  reminders: Array<Pick<ReminderItem, "active" | "events">>,
  days: number,
  now = new Date()
): ReminderAdherenceRangeSummary => {
  const safeDays = Math.max(1, Math.round(days));
  const sinceTime = now.getTime() - safeDays * 24 * 60 * 60 * 1000;
  const events = reminders
    .flatMap((reminder) => (Array.isArray(reminder.events) ? reminder.events : []))
    .filter((event) => {
      if (!trackedAdherenceActions.has(event.action)) {
        return false;
      }

      const time = getEventTime(event);
      return time >= sinceTime && time <= now.getTime();
    })
    .sort((first, second) => getEventTime(second) - getEventTime(first));
  const completed = events.filter((event) => positiveAdherenceActions.has(event.action)).length;
  const skipped = events.filter((event) => event.action === "skipped").length;
  const snoozed = events.filter((event) => event.action === "snoozed").length;
  const decisiveTotal = completed + skipped;
  const completionRate =
    decisiveTotal > 0 ? Math.round((completed / decisiveTotal) * 100) : null;
  const riskLevel =
    completionRate === null ? "missing" : completionRate >= 80 ? "good" : "watch";

  return {
    total: events.length,
    completed,
    skipped,
    snoozed,
    completionRate,
    lastEvent: events[0] ?? null,
    reminderCount: reminders.length,
    activeReminderCount: reminders.filter((reminder) => reminder.active).length,
    since: new Date(sinceTime).toISOString(),
    riskLevel,
  };
};

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

export const isAfterMealReminderTrigger = (
  trigger: ReminderTrigger | null | undefined
): trigger is ReminderTrigger => trigger?.kind === afterMealTriggerKind;

export const formatReminderScheduleLabel = ({
  reminder,
  mealLabels,
  afterMealLabel,
  windowLabel,
  offsetLabel,
  noScheduleLabel,
}: {
  reminder: Pick<ReminderItem, "times" | "trigger">;
  mealLabels: Record<ReminderTrigger["mealType"], string>;
  afterMealLabel: (mealTypeLabel: string) => string;
  windowLabel: (from: string, to: string) => string;
  offsetLabel: (minutes: number) => string;
  noScheduleLabel: string;
}) => {
  if (isAfterMealReminderTrigger(reminder.trigger)) {
    const mealTypeLabel = mealLabels[reminder.trigger.mealType];
    const parts = [afterMealLabel(mealTypeLabel)];

    if (reminder.trigger.windowStart && reminder.trigger.windowEnd) {
      parts.push(windowLabel(reminder.trigger.windowStart, reminder.trigger.windowEnd));
    }

    if (reminder.trigger.offsetMinutes > 0) {
      parts.push(offsetLabel(reminder.trigger.offsetMinutes));
    }

    return parts.join(" · ");
  }

  return reminder.times.length > 0 ? reminder.times.join(", ") : noScheduleLabel;
};
