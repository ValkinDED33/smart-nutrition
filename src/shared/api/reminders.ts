import { requestRemote } from "./authRemote";

export type ReminderType =
  | "medication"
  | "medication_course"
  | "pregnancy_supplement"
  | "water"
  | "habit"
  | "task";
export type ReminderRepeat = "daily" | "once";
export type ReminderAction = "taken" | "done" | "snoozed" | "skipped";

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
  action: ReminderAction
) => {
  const { data } = await requestRemote<ReminderMutationResponse>(
    `/reminders/${encodeURIComponent(reminderId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ action }),
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
