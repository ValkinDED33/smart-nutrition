import crypto from "node:crypto";

const DEFAULT_TIMEZONE = "Europe/Warsaw";
const DEFAULT_SNOOZE_MINUTES = 10;
const MAX_REMINDERS_PER_USER = 30;
const MAX_EVENTS_PER_REMINDER = 120;
const REMINDER_TYPE_MEDICATION = "medication";
const REMINDER_TYPE_MEDICATION_COURSE = "medication_course";
const REMINDER_TYPE_PREGNANCY_SUPPLEMENT = "pregnancy_supplement";
const REMINDER_TYPE_TASK = "task";
const REMINDER_TYPE_WATER = "water";
const REMINDER_TYPE_HABIT = "habit";
const REMINDER_TRIGGER_AFTER_MEAL = "after_meal";
const MEAL_TRIGGER_TYPES = new Set(["breakfast", "lunch", "dinner", "snack"]);
const REMINDER_TYPES = new Set([
  REMINDER_TYPE_MEDICATION,
  REMINDER_TYPE_MEDICATION_COURSE,
  REMINDER_TYPE_PREGNANCY_SUPPLEMENT,
  REMINDER_TYPE_TASK,
  REMINDER_TYPE_WATER,
  REMINDER_TYPE_HABIT,
]);

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

const normalizeMealType = (value) => {
  const mealType = String(value ?? "").trim().toLowerCase();
  return MEAL_TRIGGER_TYPES.has(mealType) ? mealType : null;
};

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
  const standaloneHourTimes = [...text.matchAll(/(?:^|\s)(?:в|о|at)\s*([01]?\d|2[0-3])(?:\s|$|[,.!?])/giu)]
    .map((match) => normalizeTime(match[1], "00"));
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

  return dedupe([...explicitTimes, ...standaloneHourTimes, ...phraseTimes]).sort();
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

const hasDailyRepeatIntent = (text) =>
  /(?:^|\s)(?:каждый|кожен|щодня|ежедневно|daily|every day|день)(?:\s|$)/iu.test(
    String(text ?? "")
  );

const extractAfterMealTrigger = (text) => {
  const normalized = String(text ?? "").toLowerCase();
  const afterMealPattern =
    /(?:после|після|after|po)\s+(?:(?:того\s+)?(?:как|як)\s+)?(?:по)?(?:завтрака|сніданку|śniadaniu|breakfast|обеда|обіду|lunch|lunchu|ужина|вечері|dinner|kolacji|перекуса|перекусу|snack)/iu;

  if (!afterMealPattern.test(normalized)) {
    return null;
  }

  const mealType =
    /завтрак|снідан|breakfast|śniadan/iu.test(normalized)
      ? "breakfast"
      : /ужин|вечер|вечір|dinner|kolac/iu.test(normalized)
        ? "dinner"
        : /перекус|snack/iu.test(normalized)
          ? "snack"
          : "lunch";
  const offsetMatch = normalized.match(
    /(?:через|за|after|po)\s+(\d{1,3})\s*(?:мин|хв|min|minutes?|minut)/iu
  );
  const offsetMinutes = offsetMatch
    ? Math.min(Math.max(Number(offsetMatch[1]), 0), 180)
    : 0;
  const windows = {
    breakfast: ["06:00", "11:30"],
    lunch: ["12:00", "16:30"],
    dinner: ["17:00", "22:30"],
    snack: ["10:00", "22:00"],
  };
  const [windowStart, windowEnd] = windows[mealType];

  return {
    kind: REMINDER_TRIGGER_AFTER_MEAL,
    mealType,
    offsetMinutes,
    windowStart,
    windowEnd,
  };
};

const extractDose = (text) => {
  const match = text.match(
    /(?:^|\s)(\d+(?:[,.]\d+)?)\s*(мг|mg|мл|ml|таблет(?:ка|ки|ок|ку|ке)?|табл\.?|капсул(?:а|ы|у|е|ок)?|капс\.?)(?:\s|$|,|\.)/iu
  );

  return match ? `${match[1].replace(",", ".")} ${match[2]}` : "";
};

const extractWaterAmountMl = (text) => {
  const normalized = String(text ?? "").toLowerCase();
  const litersMatch = normalized.match(/(\d+(?:[,.]\d+)?)\s*(?:л|l|литр|літр|liter|litre)\b/iu);

  if (litersMatch) {
    return Math.min(Math.max(Math.round(Number(litersMatch[1].replace(",", ".")) * 1000), 50), 3000);
  }

  const mlMatch = normalized.match(/(\d{2,4})\s*(?:мл|ml|милл|мілі)\b/iu);

  if (mlMatch) {
    return Math.min(Math.max(Math.round(Number(mlMatch[1])), 50), 3000);
  }

  return /(склянк|стакан|glass)/iu.test(normalized) ? 250 : 250;
};

const cleanTitle = (text) => {
  const firstChunk = text.split(/[,.]/)[0] ?? text;
  const withoutPrefix = firstChunk
    .replace(/^(?:и|та|а|ой|ой,|ну|ну,)\s+/iu, "")
    .replace(/^(?:(?:мне|мені|мени)\s+)?(?:надо|нужно|потрібно|треба)\s+/iu, "")
    .replace(/^(?:напоминай|напомни|нагадуй|нагадай|remind me to|remind me|пить|пити|принимать|приймати|выпить|випити)\s+/iu, "")
    .replace(/^(?:пить|пити|принимать|приймати|выпить|випити)\s+/iu, "")
    .replace(/\b\d{1,2}[:.]\d{2}\b/giu, "")
    .replace(/(?:^|\s)\d{1,2}\s*(?:раз(?:а)?|разів|times?)(?:\s|$)/giu, " ")
    .replace(/(?:^|\s)\d{1,3}\s*(?:дн(?:я|ей|ів|і)?|days?)(?:\s|$)/giu, " ")
    .replace(/(?:^|\s)\d+(?:[,.]\d+)?\s*(?:мг|mg|мл|ml|таблет(?:ка|ки|ок|ку|ке)?|табл\.?|капсул(?:а|ы|у|е|ок)?|капс\.?)(?:\s|$|,|\.)/giu, " ")
    .replace(/(?:^|\s)(?:после|після|after|po)\s+(?:(?:того\s+)?(?:как|як)\s+)?(?:по)?(?:завтрака|сніданку|śniadaniu|breakfast|обеда|обіду|lunch|lunchu|ужина|вечері|dinner|kolacji|перекуса|перекусу|snack)(?:\s|$)/giu, " ")
    .replace(/(?:^|\s)(?:каждый|кожен|щодня|ежедневно|daily|every day|день|утром|ранку|утра|вечером|вечір|вечора|вечера|morning|evening|night)(?:\s|$)/giu, " ")
    .replace(/(?:^|\s)(?:в|о|at|по)\s+\d{1,2}(?:\s|$)/giu, " ")
    .replace(/(?:^|\s)(?:пить|пити|принимать|приймати|выпить|випити)(?:\s|$)/giu, " ")
    .replace(/(?:^|\s)(?:по|by)(?:\s|$)/giu, " ")
    .replace(/(?:^|\s)(?:в|о|at|по|by|каждый|кожен|щодня|ежедневно|день)(?:\s|$)/giu, " ")
    .replace(/(?:^|\s)(?:и|та|і|and)(?:\s|$)/giu, " ")
    .trim();

  return normalizeText(withoutPrefix || firstChunk || text, 96);
};

const cleanTaskTitle = (text) => {
  const firstChunk = text.split(/[,.]/)[0] ?? text;
  const withoutPrefix = firstChunk
    .replace(/^(?:и|та|а|ой|ой,|ну|ну,)\s+/iu, "")
    .replace(/^(?:(?:мне|мені|мени)\s+)?(?:надо|нужно|потрібно|треба)\s+/iu, "")
    .replace(/^(?:напоминай|напомни|нагадуй|нагадай|remind me to|remind me|remind)\s+/iu, "")
    .replace(/\b\d{1,2}[:.]\d{2}\b/giu, "")
    .replace(/(?:^|\s)\d{1,3}\s*(?:дн(?:я|ей|ів|і)?|days?)(?:\s|$)/giu, " ")
    .replace(/(?:^|\s)(?:каждый|кожен|щодня|ежедневно|daily|every day|день|утром|ранку|утра|днем|днём|обед|обід|вечером|вечір|вечора|вечера|morning|afternoon|evening|night)(?:\s|$)/giu, " ")
    .replace(/(?:^|\s)(?:в|о|at|по)\s+\d{1,2}(?:\s|$)/giu, " ")
    .replace(/(?:^|\s)(?:в|о|at|по|by)(?:\s|$)/giu, " ")
    .replace(/(?:^|\s)(?:и|та|і|and)(?:\s|$)/giu, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalizeText(withoutPrefix || firstChunk || text, 96);
};

const calculateReminderEndsAt = (reminder) => {
  const explicitEndsAt = reminder?.endsAt ? new Date(reminder.endsAt).getTime() : NaN;

  if (Number.isFinite(explicitEndsAt)) {
    return explicitEndsAt;
  }

  const durationDays = Number(reminder?.durationDays ?? 0) || null;
  const createdAt = reminder?.createdAt ? new Date(reminder.createdAt).getTime() : NaN;

  if (!durationDays || !Number.isFinite(createdAt)) {
    return null;
  }

  return createdAt + durationDays * 24 * 60 * 60 * 1000;
};

export const calculateNextMedicationRunAt = (
  reminder,
  { from = new Date(), includeNow = false } = {}
) => {
  const times = Array.isArray(reminder?.times) ? reminder.times : [];
  const timeZone = reminder?.timezone || DEFAULT_TIMEZONE;
  const fromDate = from instanceof Date ? from : new Date(from);
  const endsAtMs = calculateReminderEndsAt(reminder);
  const searchDays = Math.max(Number(reminder?.durationDays ?? 0) || 370, 1);

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

      if (endsAtMs && candidate.getTime() > endsAtMs) {
        return null;
      }

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
  const trigger = extractAfterMealTrigger(rawText);
  const explicitTimes = extractTimes(rawText);
  const countPerDay = extractCountPerDay(rawText);
  const times = explicitTimes.length > 0
    ? explicitTimes
    : countPerDay
      ? defaultTimesForCount(countPerDay)
      : [];

  if (!rawText || (times.length === 0 && !trigger)) {
    return null;
  }

  const reminder = {
    id: `med-${crypto.randomUUID()}`,
    type: REMINDER_TYPE_MEDICATION,
    title: cleanTitle(rawText),
    dose: extractDose(rawText),
    sourceText: rawText,
    times,
    trigger,
    timezone,
    durationDays: extractDurationDays(rawText),
    active: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    endsAt: null,
    nextRunAt: null,
    events: [],
  };
  reminder.endsAt = reminder.durationDays
    ? new Date(now.getTime() + reminder.durationDays * 24 * 60 * 60 * 1000).toISOString()
    : null;
  reminder.nextRunAt = trigger ? null : calculateNextMedicationRunAt(reminder, { from: now });

  return reminder.nextRunAt || reminder.trigger ? reminder : null;
};

export const parseMedicationCourseReminderText = (
  text,
  options = {}
) => {
  const reminder = parseMedicationReminderText(text, options);

  return reminder
    ? {
        ...reminder,
        id: reminder.id.replace(/^med-/u, "med-course-"),
        type: REMINDER_TYPE_MEDICATION_COURSE,
      }
    : null;
};

export const parsePregnancySupplementReminderText = (
  text,
  options = {}
) => {
  const reminder = parseMedicationReminderText(text, options);

  return reminder
    ? {
        ...reminder,
        id: reminder.id.replace(/^med-/u, "preg-supplement-"),
        type: REMINDER_TYPE_PREGNANCY_SUPPLEMENT,
        safetyMode: "doctor_plan_only",
      }
    : null;
};

export const parseTaskReminderText = (
  text,
  { now = new Date(), timezone = DEFAULT_TIMEZONE } = {}
) => {
  const rawText = normalizeText(text, 500);
  const times = extractTimes(rawText);

  if (!rawText || times.length === 0) {
    return null;
  }

  const repeatsDaily = hasDailyRepeatIntent(rawText);
  const durationDays = extractDurationDays(rawText) ?? (repeatsDaily ? null : 1);
  const reminder = {
    id: `task-${crypto.randomUUID()}`,
    type: REMINDER_TYPE_TASK,
    title: cleanTaskTitle(rawText),
    dose: "",
    sourceText: rawText,
    times,
    timezone,
    durationDays,
    repeat: repeatsDaily ? "daily" : "once",
    active: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    endsAt: durationDays
      ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString()
      : null,
    nextRunAt: null,
    events: [],
  };
  reminder.nextRunAt = calculateNextMedicationRunAt(reminder, { from: now });

  return reminder.nextRunAt && reminder.title ? reminder : null;
};

export const parseWaterReminderText = (
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

  const amountMl = extractWaterAmountMl(rawText);
  const reminder = {
    id: `water-${crypto.randomUUID()}`,
    type: REMINDER_TYPE_WATER,
    title: "Пити воду",
    dose: `${amountMl} мл`,
    sourceText: rawText,
    times,
    timezone,
    durationDays: null,
    repeat: "daily",
    active: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    endsAt: null,
    nextRunAt: null,
    events: [],
  };
  reminder.nextRunAt = calculateNextMedicationRunAt(reminder, { from: now });

  return reminder.nextRunAt ? reminder : null;
};

export const parseHabitReminderText = (
  text,
  { now = new Date(), timezone = DEFAULT_TIMEZONE } = {}
) => {
  const taskReminder = parseTaskReminderText(text, { now, timezone });

  return taskReminder
    ? {
        ...taskReminder,
        id: taskReminder.id.replace(/^task-/u, "habit-"),
        type: REMINDER_TYPE_HABIT,
        repeat: "daily",
        durationDays: null,
        endsAt: null,
        nextRunAt: calculateNextMedicationRunAt(
          {
            ...taskReminder,
            repeat: "daily",
            durationDays: null,
            endsAt: null,
          },
          { from: now }
        ),
      }
    : null;
};

const normalizeReminderType = (value) => {
  const type = normalizeText(value, 40);

  return REMINDER_TYPES.has(type) ? type : REMINDER_TYPE_MEDICATION;
};

const normalizeMedicationReminder = (value) => {
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

  const trigger = isRecord(value.trigger)
    ? {
        kind:
          value.trigger.kind === REMINDER_TRIGGER_AFTER_MEAL
            ? REMINDER_TRIGGER_AFTER_MEAL
            : "",
        mealType: normalizeMealType(value.trigger.mealType),
        offsetMinutes: Math.min(
          Math.max(Math.round(Number(value.trigger.offsetMinutes) || 0), 0),
          180
        ),
        windowStart: normalizeText(value.trigger.windowStart, 5),
        windowEnd: normalizeText(value.trigger.windowEnd, 5),
      }
    : null;
  const normalizedTrigger =
    trigger?.kind === REMINDER_TRIGGER_AFTER_MEAL && trigger.mealType
      ? {
          kind: trigger.kind,
          mealType: trigger.mealType,
          offsetMinutes: trigger.offsetMinutes,
          windowStart: /^([01]\d|2[0-3]):([0-5]\d)$/.test(trigger.windowStart)
            ? trigger.windowStart
            : null,
          windowEnd: /^([01]\d|2[0-3]):([0-5]\d)$/.test(trigger.windowEnd)
            ? trigger.windowEnd
            : null,
        }
      : null;

  if (!value.id || !value.title || (times.length === 0 && !normalizedTrigger)) {
    return null;
  }

  return {
    id: normalizeText(value.id, 80),
    type: normalizeReminderType(value.type),
    title: normalizeText(value.title, 96),
    dose: normalizeText(value.dose, 80),
    sourceText: normalizeText(value.sourceText, 500),
    times,
    trigger: normalizedTrigger,
    timezone: normalizeText(value.timezone, 64) || DEFAULT_TIMEZONE,
    durationDays:
      Number.isInteger(Number(value.durationDays)) && Number(value.durationDays) > 0
        ? Math.min(Number(value.durationDays), 365)
        : null,
    active: value.active !== false,
    createdAt: normalizeText(value.createdAt, 40) || new Date().toISOString(),
    updatedAt: normalizeText(value.updatedAt, 40) || new Date().toISOString(),
    endsAt: normalizeText(value.endsAt, 40) || null,
    repeat: value.repeat === "once" ? "once" : "daily",
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

const normalizeMedicationReminders = (value) =>
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

const findLatestEditableReminder = (reminders) =>
  [...reminders]
    .filter((reminder) => reminder.active)
    .sort((a, b) => {
      const aTime = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      const bTime = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();

      return bTime - aTime;
    })[0] ?? null;

const getLocalDateKey = (date, timeZone = DEFAULT_TIMEZONE) => {
  const parts = getDatePartsInTimeZone(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
};

const getLocalMinuteOfDay = (date, timeZone = DEFAULT_TIMEZONE) => {
  const parts = getDatePartsInTimeZone(date, timeZone);
  return parts.hour * 60 + parts.minute;
};

const timeToMinuteOfDay = (value) => {
  const match = String(value ?? "").match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

const getReminderEventToken = ({ trigger, dayKey }) => `${trigger.kind}:${trigger.mealType}:${dayKey}`;

const hasReminderEvent = (reminder, action, scheduledFor) =>
  Array.isArray(reminder?.events) &&
  reminder.events.some(
    (event) => event?.action === action && event?.scheduledFor === scheduledFor
  );

const getAfterMealDueToken = (reminder, mealState, now = new Date()) => {
  const trigger = reminder?.trigger;

  if (trigger?.kind !== REMINDER_TRIGGER_AFTER_MEAL || !trigger.mealType) {
    return null;
  }

  const timeZone = reminder?.timezone || DEFAULT_TIMEZONE;
  const dayKey = getLocalDateKey(now, timeZone);
  const scheduledFor = getReminderEventToken({ trigger, dayKey });

  if (hasReminderEvent(reminder, "sent", scheduledFor)) {
    return null;
  }

  const windowStart = timeToMinuteOfDay(trigger.windowStart) ?? 0;
  const windowEnd = timeToMinuteOfDay(trigger.windowEnd) ?? 24 * 60 - 1;
  const nowMinute = getLocalMinuteOfDay(now, timeZone);
  const items = Array.isArray(mealState?.items) ? mealState.items : [];
  const matchingMeal = items
    .filter((item) => {
      if (item?.mealType !== trigger.mealType || !item?.eatenAt) {
        return false;
      }

      const eatenAt = new Date(item.eatenAt);

      if (Number.isNaN(eatenAt.getTime()) || getLocalDateKey(eatenAt, timeZone) !== dayKey) {
        return false;
      }

      const eatenMinute = getLocalMinuteOfDay(eatenAt, timeZone);
      return eatenMinute >= windowStart && eatenMinute <= windowEnd;
    })
    .sort((left, right) => new Date(left.eatenAt).getTime() - new Date(right.eatenAt).getTime())[0];

  if (!matchingMeal) {
    return null;
  }

  const eatenMinute = getLocalMinuteOfDay(new Date(matchingMeal.eatenAt), timeZone);
  const dueMinute = eatenMinute + (Number(trigger.offsetMinutes) || 0);

  return nowMinute >= dueMinute ? scheduledFor : null;
};

export const createMedicationReminderService = ({
  authRepository,
  logger = console,
  timezone = DEFAULT_TIMEZONE,
  snoozeMinutes = DEFAULT_SNOOZE_MINUTES,
} = {}) => {
  const getUserReminders = (user) => normalizeMedicationReminders(user?.medicationReminders);

  const persistReminders = async (user, reminders) => {
    const normalizedReminders = normalizeMedicationReminders(reminders);
    const persist =
      authRepository.updateUserReminders ?? authRepository.updateUserMedicationReminders;

    return persist?.(user.id, normalizedReminders);
  };

  const createReminderFromText = async (user, text, now = new Date()) => {
    const reminder = parseMedicationReminderText(text, { now, timezone });

    if (!reminder) {
      return { ok: false, code: "MEDICATION_REMINDER_PARSE_FAILED" };
    }

    const reminders = [reminder, ...getUserReminders(user)].slice(0, MAX_REMINDERS_PER_USER);
    const updatedUser = await persistReminders(user, reminders);

    return { ok: true, reminder, user: updatedUser ?? { ...user, medicationReminders: reminders } };
  };

  const createTaskReminderFromText = async (user, text, now = new Date()) => {
    const reminder = parseTaskReminderText(text, { now, timezone });

    if (!reminder) {
      return { ok: false, code: "TASK_REMINDER_PARSE_FAILED" };
    }

    const reminders = [reminder, ...getUserReminders(user)].slice(0, MAX_REMINDERS_PER_USER);
    const updatedUser = await persistReminders(user, reminders);

    return { ok: true, reminder, user: updatedUser ?? { ...user, medicationReminders: reminders } };
  };

  const createParsedReminderFromText = async (user, text, parser, failureCode, now = new Date()) => {
    const reminder = parser(text, { now, timezone });

    if (!reminder) {
      return { ok: false, code: failureCode };
    }

    const reminders = [reminder, ...getUserReminders(user)].slice(0, MAX_REMINDERS_PER_USER);
    const updatedUser = await persistReminders(user, reminders);

    return { ok: true, reminder, user: updatedUser ?? { ...user, medicationReminders: reminders } };
  };

  const createMedicationCourseReminderFromText = (user, text, now = new Date()) =>
    createParsedReminderFromText(
      user,
      text,
      parseMedicationCourseReminderText,
      "MEDICATION_COURSE_REMINDER_PARSE_FAILED",
      now
    );

  const createPregnancySupplementReminderFromText = (user, text, now = new Date()) =>
    createParsedReminderFromText(
      user,
      text,
      parsePregnancySupplementReminderText,
      "PREGNANCY_SUPPLEMENT_REMINDER_PARSE_FAILED",
      now
    );

  const createWaterReminderFromText = (user, text, now = new Date()) =>
    createParsedReminderFromText(
      user,
      text,
      parseWaterReminderText,
      "WATER_REMINDER_PARSE_FAILED",
      now
    );

  const createHabitReminderFromText = (user, text, now = new Date()) =>
    createParsedReminderFromText(
      user,
      text,
      parseHabitReminderText,
      "HABIT_REMINDER_PARSE_FAILED",
      now
    );

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

  const pauseReminder = async (user, reminderId, now = new Date()) => {
    const reminders = getUserReminders(user);
    const reminder = reminders.find((item) => item.id === reminderId);

    if (!reminder) {
      return { ok: false, code: "MEDICATION_REMINDER_NOT_FOUND" };
    }

    const updatedReminder = addReminderEvent(
      { ...reminder, active: false, nextRunAt: null },
      "paused",
      now,
      reminder.nextRunAt
    );
    const updatedReminders = upsertReminder(reminders, updatedReminder);
    const updatedUser = await persistReminders(user, updatedReminders);

    return {
      ok: true,
      reminder: updatedReminder,
      user: updatedUser ?? { ...user, medicationReminders: updatedReminders },
    };
  };

  const resumeReminder = async (user, reminderId, now = new Date()) => {
    const reminders = getUserReminders(user);
    const reminder = reminders.find((item) => item.id === reminderId);

    if (!reminder) {
      return { ok: false, code: "MEDICATION_REMINDER_NOT_FOUND" };
    }

    const resumedReminder = addReminderEvent(
      { ...reminder, active: true, nextRunAt: null },
      "resumed",
      now,
      reminder.nextRunAt
    );
    const updatedReminder = {
      ...resumedReminder,
      nextRunAt: resumedReminder.trigger
        ? null
        : calculateNextMedicationRunAt(resumedReminder, {
            from: now,
            includeNow: true,
          }),
    };

    if (!updatedReminder.nextRunAt && !updatedReminder.trigger) {
      return { ok: false, code: "REMINDER_SCHEDULE_PARSE_FAILED" };
    }

    const updatedReminders = upsertReminder(reminders, updatedReminder);
    const updatedUser = await persistReminders(user, updatedReminders);

    return {
      ok: true,
      reminder: updatedReminder,
      user: updatedUser ?? { ...user, medicationReminders: updatedReminders },
    };
  };

  const deleteReminder = async (user, reminderId) => {
    const reminders = getUserReminders(user);
    const reminder = reminders.find((item) => item.id === reminderId);

    if (!reminder) {
      return { ok: false, code: "MEDICATION_REMINDER_NOT_FOUND" };
    }

    const updatedReminders = reminders.filter((item) => item.id !== reminderId);
    const updatedUser = await persistReminders(user, updatedReminders);

    return {
      ok: true,
      reminder: { ...reminder, active: false, nextRunAt: null },
      user: updatedUser ?? { ...user, medicationReminders: updatedReminders },
    };
  };

  const snoozeReminder = async (user, reminderId, minutes = snoozeMinutes, now = new Date()) => {
    const safeMinutes = Number(minutes);

    if (!Number.isFinite(safeMinutes) || safeMinutes < 1 || safeMinutes > 24 * 60) {
      return { ok: false, code: "REMINDER_SNOOZE_INVALID" };
    }

    const reminders = getUserReminders(user);
    const reminder = reminders.find((item) => item.id === reminderId);

    if (!reminder) {
      return { ok: false, code: "MEDICATION_REMINDER_NOT_FOUND" };
    }

    const nextReminder = addReminderEvent(reminder, "snoozed", now, reminder.nextRunAt);
    const updatedReminder = {
      ...nextReminder,
      active: true,
      nextRunAt: new Date(now.getTime() + safeMinutes * 60_000).toISOString(),
    };
    const updatedReminders = upsertReminder(reminders, updatedReminder);
    const updatedUser = await persistReminders(user, updatedReminders);

    return {
      ok: true,
      reminder: updatedReminder,
      user: updatedUser ?? { ...user, medicationReminders: updatedReminders },
    };
  };

  const updateReminderSchedule = async (user, reminderId, textOrTimes, now = new Date()) => {
    const reminders = getUserReminders(user);
    const reminder = reminders.find((item) => item.id === reminderId);

    if (!reminder) {
      return { ok: false, code: "MEDICATION_REMINDER_NOT_FOUND" };
    }

    const trigger = Array.isArray(textOrTimes)
      ? null
      : extractAfterMealTrigger(String(textOrTimes ?? ""));
    const times = Array.isArray(textOrTimes)
      ? dedupe(textOrTimes.map((time) => {
          const match = String(time).match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
          return match ? normalizeTime(match[1], match[2]) : null;
        })).sort()
      : extractTimes(String(textOrTimes ?? ""));

    if (times.length === 0 && !trigger) {
      return { ok: false, code: "REMINDER_SCHEDULE_PARSE_FAILED" };
    }

    const updatedReminder = addReminderEvent(
      {
        ...reminder,
        times,
        trigger,
        updatedAt: now.toISOString(),
        nextRunAt: null,
      },
      "schedule_updated",
      now,
      reminder.nextRunAt
    );
    updatedReminder.nextRunAt = trigger
      ? null
      : calculateNextMedicationRunAt(updatedReminder, { from: now });

    if (!updatedReminder.nextRunAt && !updatedReminder.trigger) {
      return { ok: false, code: "REMINDER_SCHEDULE_PARSE_FAILED" };
    }

    const updatedReminders = upsertReminder(reminders, updatedReminder);
    const updatedUser = await persistReminders(user, updatedReminders);

    return { ok: true, reminder: updatedReminder, user: updatedUser };
  };

  const updateLatestReminderSchedule = async (user, textOrTimes, now = new Date()) => {
    const reminder = findLatestEditableReminder(getUserReminders(user));

    if (!reminder) {
      return { ok: false, code: "MEDICATION_REMINDER_NOT_FOUND" };
    }

    return updateReminderSchedule(user, reminder.id, textOrTimes, now);
  };

  const resolveCompletedReminderSchedule = (reminder, now = new Date()) => {
    if (reminder.repeat === "once") {
      return {
        active: false,
        nextRunAt: null,
      };
    }

    if (reminder.trigger?.kind === REMINDER_TRIGGER_AFTER_MEAL) {
      return {
        active: true,
        nextRunAt: null,
      };
    }

    const currentTime = now.getTime();
    const nextRunTime = reminder.nextRunAt ? new Date(reminder.nextRunAt).getTime() : NaN;
    const lastSentTime = reminder.lastSentAt ? new Date(reminder.lastSentAt).getTime() : NaN;
    const alreadyAdvancedBySend =
      Number.isFinite(lastSentTime) &&
      currentTime >= lastSentTime &&
      currentTime - lastSentTime <= 24 * 60 * 60 * 1000 &&
      Number.isFinite(nextRunTime) &&
      nextRunTime > currentTime;

    if (alreadyAdvancedBySend) {
      return {
        active: true,
        nextRunAt: reminder.nextRunAt,
      };
    }

    const baseTime =
      Number.isFinite(nextRunTime) && nextRunTime > currentTime ? nextRunTime : currentTime;
    const nextRunAt = calculateNextMedicationRunAt(reminder, {
      from: new Date(baseTime + 60_000),
    });

    return {
      active: Boolean(nextRunAt),
      nextRunAt,
    };
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
            active: true,
            nextRunAt: new Date(now.getTime() + snoozeMinutes * 60_000).toISOString(),
          }
        : {
            ...nextReminder,
            ...resolveCompletedReminderSchedule(nextReminder, now),
          };
    const updatedReminders = upsertReminder(reminders, updatedReminder);
    const updatedUser = await persistReminders(user, updatedReminders);

    return { ok: true, reminder: updatedReminder, user: updatedUser };
  };

  const markReminderSent = async (user, reminder, now = new Date(), scheduledFor = null) => {
    const reminders = getUserReminders(user);
    const sentReminder = addReminderEvent(
      {
        ...reminder,
        lastSentAt: now.toISOString(),
        nextRunAt:
          reminder.trigger?.kind === REMINDER_TRIGGER_AFTER_MEAL
            ? null
            : reminder.repeat === "once"
            ? null
            : calculateNextMedicationRunAt(reminder, {
                from: new Date(now.getTime() + 60_000),
              }),
      },
      "sent",
      now,
      scheduledFor ?? reminder.nextRunAt
    );
    const updatedReminder = sentReminder.nextRunAt
      ? sentReminder
      : reminder.trigger?.kind === REMINDER_TRIGGER_AFTER_MEAL
        ? { ...sentReminder, active: true }
      : { ...sentReminder, active: false };
    const updatedReminders = upsertReminder(reminders, updatedReminder);

    return persistReminders(user, updatedReminders);
  };

  const sendDueReminders = async ({ users, sendReminder, getMealState, now = new Date() }) => {
    const currentTime = now.getTime();

    for (const user of users) {
      const userReminders = getUserReminders(user).filter((reminder) => reminder.active);
      const mealState = userReminders.some(
        (reminder) => reminder.trigger?.kind === REMINDER_TRIGGER_AFTER_MEAL
      )
        ? await getMealState?.(user)
        : null;
      const reminders = userReminders
        .map((reminder) => ({
          reminder,
          scheduledFor:
            reminder.nextRunAt && new Date(reminder.nextRunAt).getTime() <= currentTime
              ? reminder.nextRunAt
              : getAfterMealDueToken(reminder, mealState, now),
        }))
        .filter((item) => item.scheduledFor);

      for (const { reminder, scheduledFor } of reminders) {
        try {
          await sendReminder(user, reminder);
          await markReminderSent(user, reminder, now, scheduledFor);
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
    createMedicationCourseReminderFromText,
    createPregnancySupplementReminderFromText,
    createWaterReminderFromText,
    createHabitReminderFromText,
    createTaskReminderFromText,
    deactivateReminder,
    pauseReminder,
    resumeReminder,
    deleteReminder,
    snoozeReminder,
    updateReminderSchedule,
    updateLatestReminderSchedule,
    recordDoseAction,
    recordReminderAction: recordDoseAction,
    markReminderSent,
    sendDueReminders,
  };
};
