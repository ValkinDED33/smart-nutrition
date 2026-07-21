import { requestRemote } from "./authRemote";

export type ReminderType =
  | "medication"
  | "medication_course"
  | "pregnancy_supplement"
  | "water"
  | "habit"
  | "task";
type ReminderRepeat = "daily" | "once";
export type ReminderTrigger = {
  kind: "after_meal";
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  offsetMinutes: number;
  windowStart: string | null;
  windowEnd: string | null;
};
export type ReminderAction =
  | "taken"
  | "done"
  | "snoozed"
  | "skipped"
  | "pause"
  | "resume";

export type ReminderEvent = {
  id: string;
  action: string;
  scheduledFor: string | null;
  createdAt: string;
};

export type ReminderItem = {
  id: string;
  type: ReminderType;
  title: string;
  dose: string;
  times: string[];
  timezone: string;
  durationDays: number | null;
  repeat: ReminderRepeat;
  trigger: ReminderTrigger | null;
  active: boolean;
  nextRunAt: string | null;
  lastSentAt: string | null;
  createdAt: string;
  updatedAt: string;
  events: ReminderEvent[];
};

type ReminderListResponse = {
  items?: ReminderItem[];
};

type ReminderMutationResponse = {
  item?: ReminderItem;
};

const readReminderItem = (value: unknown): ReminderItem | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Partial<ReminderItem>;

  if (typeof record.id !== "string" || typeof record.title !== "string") {
    return null;
  }

  const trigger =
    record.trigger?.kind === "after_meal" &&
    (record.trigger.mealType === "breakfast" ||
      record.trigger.mealType === "lunch" ||
      record.trigger.mealType === "dinner" ||
      record.trigger.mealType === "snack")
      ? {
          kind: "after_meal" as const,
          mealType: record.trigger.mealType,
          offsetMinutes:
            typeof record.trigger.offsetMinutes === "number" &&
            Number.isFinite(record.trigger.offsetMinutes)
              ? Math.max(0, Math.min(Math.round(record.trigger.offsetMinutes), 180))
              : 0,
          windowStart:
            typeof record.trigger.windowStart === "string"
              ? record.trigger.windowStart
              : null,
          windowEnd:
            typeof record.trigger.windowEnd === "string"
              ? record.trigger.windowEnd
              : null,
        }
      : null;

  return {
    id: record.id,
    type:
      record.type === "task" ||
      record.type === "water" ||
      record.type === "habit" ||
      record.type === "medication_course" ||
      record.type === "pregnancy_supplement"
        ? record.type
        : "medication",
    title: record.title,
    dose: typeof record.dose === "string" ? record.dose : "",
    times: Array.isArray(record.times)
      ? record.times.filter((time): time is string => typeof time === "string")
      : [],
    timezone: typeof record.timezone === "string" ? record.timezone : "Europe/Warsaw",
    durationDays:
      typeof record.durationDays === "number" && Number.isFinite(record.durationDays)
        ? record.durationDays
        : null,
    repeat: record.repeat === "once" ? "once" : "daily",
    trigger,
    active: record.active !== false,
    nextRunAt: typeof record.nextRunAt === "string" ? record.nextRunAt : null,
    lastSentAt: typeof record.lastSentAt === "string" ? record.lastSentAt : null,
    createdAt: typeof record.createdAt === "string" ? record.createdAt : "",
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
    events: Array.isArray(record.events)
      ? record.events.filter((event): event is ReminderEvent =>
          Boolean(
            event &&
              typeof event === "object" &&
              typeof (event as ReminderEvent).id === "string" &&
              typeof (event as ReminderEvent).action === "string" &&
              typeof (event as ReminderEvent).createdAt === "string"
          )
        )
      : [],
  };
};

const requireReminderItem = (value: unknown) => {
  const item = readReminderItem(value);

  if (!item) {
    throw new Error("Invalid reminder response.");
  }

  return item;
};

export const listRemoteReminders = async ({ activeOnly = true } = {}) => {
  const { data } = await requestRemote<ReminderListResponse>(
    `/reminders${activeOnly ? "?active=true" : ""}`,
    { method: "GET" },
    { requireAuth: true }
  );

  return Array.isArray(data.items)
    ? data.items.map(readReminderItem).filter((item): item is ReminderItem => item !== null)
    : [];
};

export const createRemoteReminder = async ({
  type,
  text,
}: {
  type: ReminderType;
  text: string;
}) => {
  const { data } = await requestRemote<ReminderMutationResponse>(
    "/reminders",
    {
      method: "POST",
      body: JSON.stringify({ type, text }),
    },
    { requireAuth: true }
  );

  return requireReminderItem(data.item);
};

export const updateRemoteReminderAction = async (
  reminderId: string,
  action: ReminderAction,
  options: { minutes?: number } = {}
) => {
  const { data } = await requestRemote<ReminderMutationResponse>(
    `/reminders/${encodeURIComponent(reminderId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ action, ...options }),
    },
    { requireAuth: true }
  );

  return requireReminderItem(data.item);
};

export const updateRemoteReminderSchedule = async (
  reminderId: string,
  text: string
) => {
  const { data } = await requestRemote<ReminderMutationResponse>(
    `/reminders/${encodeURIComponent(reminderId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ action: "schedule", text }),
    },
    { requireAuth: true }
  );

  return requireReminderItem(data.item);
};

export const deleteRemoteReminder = async (reminderId: string) => {
  await requestRemote<void>(
    `/reminders/${encodeURIComponent(reminderId)}`,
    { method: "DELETE" },
    { requireAuth: true }
  );
};
