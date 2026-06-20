import crypto from "node:crypto";

const DEFAULT_TIMEZONE = "Europe/Warsaw";
const DEFAULT_SNOOZE_MINUTES = 10;
const MAX_REMINDERS_PER_USER = 30;
const MAX_EVENTS_PER_REMINDER = 120;

const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const normalizeText = (value, maxLength = 160) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);

const normalizeTime = (hour, minute = "00") => {
  const normalizedHour = Number(hour);
  const normalizedMinute = Number(minute);

  if (
    !Number.isInteger(normalizedHour) ||
    !Number.isInteger(normalizedMinute) ||
    normalizedHour < 0 ||
    normalizedHour > 23 ||
    normalizedMinute < 0 ||
    normalizedMinute > 59
  ) {
    return null;
  }

  return `${String(normalizedHour).padStart(2, "0")}:${String(normalizedMinute).padStart(2, "0")}`;
};

const dedupe = (values) => [...new Set(values.filter(Boolean))];

const getDatePartsInTimeZone = (date, timeZone = DEFAULT_TIMEZONE) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(byType.year),
    month: Number(byType.month),
    day: Number(byType.day),
    hour: Number(byType.hour),
    minute: Number(byType.minute),
    second: Number(byType.second),
  };
};

const getTimeZoneOffsetMs = (date, timeZone = DEFAULT_TIMEZONE) => {
  const parts = getDatePartsInTimeZone(date, timeZone);
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return localAsUtc - date.getTime();
};

const zonedTimeToUtc = ({
  year,
  month,
  day,
  hour,
  minute,
  timeZone = DEFAULT_TIMEZONE,
}) => {
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  const firstPass = new Date(localAsUtc - getTimeZoneOffsetMs(new Date(localAsUtc), timeZone));

  return new Date(localAsUtc - getTimeZoneOffsetMs(firstPass, timeZone));
};

const getLocalDayOffset = (date, offsetDays, timeZone = DEFAULT_TIMEZONE) => {
  const parts = getDatePartsInTimeZone(date, timeZone);
  const day = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + offsetDays));

  return {
    year: day.getUTCFullYear(),
    month: day.getUTCMonth() + 1,
    day: day.getUTCDate(),
  };
};

const extractTimes = (text) => {
  const explicitTimes = [...text.matchAll(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/g)]
    .map((match) => normalizeTime(match[1], match[2]));
  const phraseTimes = [];
  const normalized = text.toLowerCase();
  const morningHour = normalized.match(/(?:^|\s)(?:в|о|at)?\s*([01]?\d|2[0-3])\s*(?:утра|ранку|morning)(?:\s|$)/u);
  const eveningHour = normalized.match(/(?:^|\s)(?:в|о|at)?\s*([01]?\d|2[0-3])\s*(?:вечера|вечора|evening|night)(?:\s|$)/u);

  if (morningHour) {
    phraseTimes.push(normalizeTime(morningHour[1], "00"));
  } else if (/(^|\s)(утром|ранку|morning)(\s|$)/u.test(normalized)) {
    phraseTimes.push("09:00");
  }

  if (/(^|\s)(днем|днём|обед|обід|afternoon|lunch)(\s|$)/u.test(normalized)) {
    phraseTimes.push("13:00");
  }

  if (eveningHour) {
    phraseTimes.push(normalizeTime(eveningHour[1], "00"));
  } else if (/(^|\s)(вечером|вечір|вечора|evening|night)(\s|$)/u.test(normalized)) {
    phraseTimes.push("21:00");
  }

  return dedupe([...explicitTimes, ...phraseTimes]).sort();
};

const extractCountPerDay = (text) => {
  const match = text.match(/(?:^|\s)(\d{1,2})\s*(?:раз(?:а)?|разів|times?)(?:\s|$)/iu);
  const count = Number(match?.[1] ?? 0);

  return Number.isInteger(count) && count > 0 && count <= 8 ? count : null;
};

const defaultTimesForCount = (count) => {
  if (count === 1) return ["09:00"];
  if (count === 2) return ["09:00", "21:00"];
  if (count === 3) return ["08:00", "14:00", "20:00"];
  if (count === 4) return ["08:00", "12:00", "16:00", "20:00"];

  return Array.from({ length: count }, (_, index) =>
    normalizeTime(8 + Math.round((12 / Math.max(count - 1, 1)) * index), "00")
  );
};

const extractDurationDays = (text) => {
  const match = text.match(/(?:^|\s)(\d{1,3})\s*(?:дн(?:я|ей|ів|і)?|days?)(?:\s|$)/iu);
  const days = Number(match?.[1] ?? 0);

  return Number.isInteger(days) && days > 0 && days <= 365 ? days : null;
};

const extractDose = (text) => {
  const match = text.match(
    /(?:^|\s)(\d+(?:[,.]\d+)?)\s*(мг|mg|мл|ml|таблет(?:ка|ки|ок|ку|ке)?|табл\.?|капсул(?:а|ы|у|е|ок)?|капс\.?)(?:\s|$|,|\.)/iu
  );

  return match ? `${match[1].replace(",", ".")} ${match[2]}` : "";
};

const cleanTitle = (text) => {
  const firstChunk = text.split(/[,.]/)[0] ?? text;
  const withoutPrefix = firstChunk
    .replace(/^(?:напоминай|нагадуй|remind me to|remind me|пить|пити|принимать|приймати|выпить)\s+/iu, "")
    .replace(/^(?:пить|пити|принимать|приймати|выпить)\s+/iu, "")
    .replace(/\b\d{1,2}[:.]\d{2}\b/giu, "")
    .replace(/(?:^|\s)\d{1,2}\s*(?:раз(?:а)?|разів|times?)(?:\s|$)/giu, " ")
    .replace(/(?:^|\s)\d{1,3}\s*(?:дн(?:я|ей|ів|і)?|days?)(?:\s|$)/giu, " ")
    .replace(/(?:^|\s)\d+(?:[,.]\d+)?\s*(?:мг|mg|мл|ml|таблет(?:ка|ки|ок|ку|ке)?|табл\.?|капсул(?:а|ы|у|е|ок)?|капс\.?)(?:\s|$|,|\.)/giu, " ")
    .replace(/(?:^|\s)(?:каждый|кожен|щодня|ежедневно|daily|every day|день|утром|ранку|утра|вечером|вечір|вечора|вечера|morning|evening|night)(?:\s|$)/giu, " ")
    .replace(/(?:^|\s)(?:в|о|at|по)\s+\d{1,2}(?:\s|$)/giu, " ")
    .replace(/(?:^|\s)(?:по|by)(?:\s|$)/giu, " ")
    .replace(/(?:^|\s)(?:в|о|at|по|by|каждый|кожен|щодня|ежедневно|день)(?:\s|$)/giu, " ")
    .trim();

  return normalizeText(withoutPrefix || firstChunk || text, 96);
};

export const calculateNextMedicationRunAt = (
  reminder,
  { from = new Date(), includeNow = false } = {}
) => {
  const times = Array.isArray(reminder?.times) ? reminder.times : [];
  const timeZone = reminder?.timezone || DEFAULT_TIMEZONE;
  const fromDate = from instanceof Date ? from : new Date(from);
  const durationDays = Number(reminder?.durationDays ?? 0) || null;
  const searchDays = Math.max(durationDays ?? 370, 1);

  if (Number.isNaN(fromDate.getTime()) || times.length === 0) {
    return null;
  }

  for (let offset = 0; offset <= searchDays; offset += 1) {
    const day = getLocalDayOffset(fromDate, offset, timeZone);

    for (const time of times) {
      const [hour, minute] = String(time).split(":").map(Number);
      const candidate = zonedTimeToUtc({
        ...day,
        hour,
        minute,
        timeZone,
      });

      if (includeNow ? candidate.getTime() >= fromDate.getTime() : candidate > fromDate) {
        return candidate.toISOString();
      }
    }
  }

  return null;
};

export const parseMedicationReminderText = (
  text,
  { now = new Date(), timezone = DEFAULT_TIMEZONE } = {}
) => {
  const rawText = normalizeText(text, 500);
  const explicitTimes = extractTimes(rawText);
  const countPerDay = extractCountPerDay(rawText);
  const times = explicitTimes.length > 0
    ? explicitTimes
    : countPerDay
      ? defaultTimesForCount(countPerDay)
      : [];

  if (!rawText || times.length === 0) {
    return null;
  }

  const reminder = {
    id: `med-${crypto.randomUUID()}`,
    type: "medication",
    title: cleanTitle(rawText),
    dose: extractDose(rawText),
    sourceText: rawText,
    times,
    timezone,
    durationDays: extractDurationDays(rawText),
    active: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    nextRunAt: null,
    events: [],
  };
  reminder.nextRunAt = calculateNextMedicationRunAt(reminder, { from: now });

  return reminder.nextRunAt ? reminder : null;
};

export const normalizeMedicationReminder = (value) => {
  if (!isRecord(value)) {
    return null;
  }

  const times = dedupe(
    Array.isArray(value.times)
      ? value.times
          .map((time) => {
            const match = String(time).match(/^([01]\d|2[0-3]):([0-5]\d)$/);
            return match ? normalizeTime(match[1], match[2]) : null;
          })
      : []
  ).sort();

  if (!value.id || !value.title || times.length === 0) {
    return null;
  }

  return {
    id: normalizeText(value.id, 80),
    type: "medication",
    title: normalizeText(value.title, 96),
    dose: normalizeText(value.dose, 80),
    sourceText: normalizeText(value.sourceText, 500),
    times,
    timezone: normalizeText(value.timezone, 64) || DEFAULT_TIMEZONE,
    durationDays:
      Number.isInteger(Number(value.durationDays)) && Number(value.durationDays) > 0
        ? Math.min(Number(value.durationDays), 365)
        : null,
    active: value.active !== false,
    createdAt: normalizeText(value.createdAt, 40) || new Date().toISOString(),
    updatedAt: normalizeText(value.updatedAt, 40) || new Date().toISOString(),
    nextRunAt: normalizeText(value.nextRunAt, 40) || null,
    lastSentAt: normalizeText(value.lastSentAt, 40) || null,
    events: Array.isArray(value.events)
      ? value.events
          .filter(isRecord)
          .map((event) => ({
            id: normalizeText(event.id, 80) || `event-${crypto.randomUUID()}`,
            action: normalizeText(event.action, 24),
            scheduledFor: normalizeText(event.scheduledFor, 40) || null,
            createdAt: normalizeText(event.createdAt, 40) || new Date().toISOString(),
          }))
          .slice(-MAX_EVENTS_PER_REMINDER)
      : [],
  };
};

export const normalizeMedicationReminders = (value) =>
  Array.isArray(value)
    ? value.map(normalizeMedicationReminder).filter(Boolean).slice(0, MAX_REMINDERS_PER_USER)
    : [];

const addReminderEvent = (reminder, action, now = new Date(), scheduledFor = null) => ({
  ...reminder,
  updatedAt: now.toISOString(),
  events: [
    ...(Array.isArray(reminder.events) ? reminder.events : []),
    {
      id: `event-${crypto.randomUUID()}`,
      action,
      scheduledFor,
      createdAt: now.toISOString(),
    },
  ].slice(-MAX_EVENTS_PER_REMINDER),
});

const upsertReminder = (reminders, reminder) =>
  reminders.map((item) => (item.id === reminder.id ? reminder : item));

export const createMedicationReminderService = ({
  authRepository,
  logger = console,
  timezone = DEFAULT_TIMEZONE,
  snoozeMinutes = DEFAULT_SNOOZE_MINUTES,
} = {}) => {
  const getUserReminders = (user) => normalizeMedicationReminders(user?.medicationReminders);

  const persistReminders = async (user, reminders) =>
    authRepository.updateUserMedicationReminders?.(user.id, normalizeMedicationReminders(reminders));

  const createReminderFromText = async (user, text, now = new Date()) => {
    const reminder = parseMedicationReminderText(text, { now, timezone });

    if (!reminder) {
      return { ok: false, code: "MEDICATION_REMINDER_PARSE_FAILED" };
    }

    const reminders = [reminder, ...getUserReminders(user)].slice(0, MAX_REMINDERS_PER_USER);
    const updatedUser = await persistReminders(user, reminders);

    return { ok: true, reminder, user: updatedUser ?? { ...user, medicationReminders: reminders } };
  };

  const deactivateReminder = async (user, reminderId, now = new Date()) => {
    const reminders = getUserReminders(user);
    const reminder = reminders.find((item) => item.id === reminderId);

    if (!reminder) {
      return { ok: false, code: "MEDICATION_REMINDER_NOT_FOUND" };
    }

    const updatedReminder = addReminderEvent(
      { ...reminder, active: false, nextRunAt: null },
      "deleted",
      now
    );
    const updatedReminders = upsertReminder(reminders, updatedReminder);
    const updatedUser = await persistReminders(user, updatedReminders);

    return { ok: true, reminder: updatedReminder, user: updatedUser };
  };

  const recordDoseAction = async (
    user,
    reminderId,
    action,
    now = new Date(),
    scheduledFor = null
  ) => {
    const reminders = getUserReminders(user);
    const reminder = reminders.find((item) => item.id === reminderId);

    if (!reminder) {
      return { ok: false, code: "MEDICATION_REMINDER_NOT_FOUND" };
    }

    const nextReminder = addReminderEvent(reminder, action, now, scheduledFor);
    const updatedReminder =
      action === "snoozed"
        ? {
            ...nextReminder,
            nextRunAt: new Date(now.getTime() + snoozeMinutes * 60_000).toISOString(),
          }
        : nextReminder;
    const updatedReminders = upsertReminder(reminders, updatedReminder);
    const updatedUser = await persistReminders(user, updatedReminders);

    return { ok: true, reminder: updatedReminder, user: updatedUser };
  };

  const markReminderSent = async (user, reminder, now = new Date()) => {
    const reminders = getUserReminders(user);
    const sentReminder = addReminderEvent(
      {
        ...reminder,
        lastSentAt: now.toISOString(),
        nextRunAt: calculateNextMedicationRunAt(reminder, {
          from: new Date(now.getTime() + 60_000),
        }),
      },
      "sent",
      now,
      reminder.nextRunAt
    );
    const updatedReminder = sentReminder.nextRunAt
      ? sentReminder
      : { ...sentReminder, active: false };
    const updatedReminders = upsertReminder(reminders, updatedReminder);

    return persistReminders(user, updatedReminders);
  };

  const sendDueReminders = async ({ users, sendReminder, now = new Date() }) => {
    const currentTime = now.getTime();

    for (const user of users) {
      const reminders = getUserReminders(user).filter(
        (reminder) =>
          reminder.active &&
          reminder.nextRunAt &&
          new Date(reminder.nextRunAt).getTime() <= currentTime
      );

      for (const reminder of reminders) {
        try {
          await sendReminder(user, reminder);
          await markReminderSent(user, reminder, now);
        } catch (error) {
          logger.warn?.("[medication-reminders] send failed", {
            userId: user.id,
            reminderId: reminder.id,
            message: String(error?.message ?? error).slice(0, 160),
          });
        }
      }
    }
  };

  return {
    getUserReminders,
    createReminderFromText,
    deactivateReminder,
    recordDoseAction,
    markReminderSent,
    sendDueReminders,
  };
};
