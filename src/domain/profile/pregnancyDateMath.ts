const DAY_MS = 24 * 60 * 60 * 1000;
const PREGNANCY_TOTAL_DAYS = 280;
const CONCEPTION_OFFSET_DAYS = 266;

export interface PregnancyAge {
  week: number;
  day: number;
  totalDays: number;
}

export interface PregnancyDateEstimate {
  age: PregnancyAge;
  dueDate: string;
  lastPeriodStartDate: string;
  conceptionDate: string;
}

const toUtcDate = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const addDays = (date: Date, days: number) =>
  new Date(toUtcDate(date).getTime() + days * DAY_MS);

const diffDays = (from: Date, to: Date) =>
  Math.round((toUtcDate(to).getTime() - toUtcDate(from).getTime()) / DAY_MS);

export const toDateInputValue = (date: Date) => toUtcDate(date).toISOString().slice(0, 10);

export const parseDateInputValue = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const date = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day))
  );

  return Number.isNaN(date.getTime()) ? null : date;
};

export const normalizePregnancyDay = (value: unknown) => {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return null;
  }

  const rounded = Math.round(numberValue);
  return rounded >= 0 && rounded <= 6 ? rounded : null;
};

export const createPregnancyAge = (
  week: number | null | undefined,
  day: number | null | undefined = 0
): PregnancyAge | null => {
  const weekValue = Number(week);
  const dayValue = Number(day ?? 0);

  if (!Number.isFinite(weekValue) || !Number.isFinite(dayValue)) {
    return null;
  }

  const safeWeek = Math.round(weekValue);
  const safeDay = Math.round(dayValue);

  if (safeWeek < 1 || safeWeek > 42 || safeDay < 0 || safeDay > 6) {
    return null;
  }

  return {
    week: safeWeek,
    day: safeDay,
    totalDays: safeWeek * 7 + safeDay,
  };
};

export const estimatePregnancyDatesFromAge = (
  week: number | null | undefined,
  day: number | null | undefined = 0,
  now: Date = new Date()
): PregnancyDateEstimate | null => {
  const age = createPregnancyAge(week, day);

  if (!age) {
    return null;
  }

  const dueDate = addDays(now, PREGNANCY_TOTAL_DAYS - age.totalDays);
  const lastPeriodStartDate = addDays(dueDate, -PREGNANCY_TOTAL_DAYS);
  const conceptionDate = addDays(dueDate, -CONCEPTION_OFFSET_DAYS);

  return {
    age,
    dueDate: toDateInputValue(dueDate),
    lastPeriodStartDate: toDateInputValue(lastPeriodStartDate),
    conceptionDate: toDateInputValue(conceptionDate),
  };
};

export const estimatePregnancyFromDueDate = (
  dueDateValue: string,
  now: Date = new Date()
): PregnancyDateEstimate | null => {
  const dueDate = parseDateInputValue(dueDateValue);

  if (!dueDate) {
    return null;
  }

  const daysUntilDue = diffDays(now, dueDate);
  const totalDays = PREGNANCY_TOTAL_DAYS - daysUntilDue;

  if (totalDays < 0 || totalDays > 42 * 7 + 6) {
    return null;
  }

  const age = {
    week: Math.floor(totalDays / 7),
    day: totalDays % 7,
    totalDays,
  };

  return {
    age,
    dueDate: toDateInputValue(dueDate),
    lastPeriodStartDate: toDateInputValue(addDays(dueDate, -PREGNANCY_TOTAL_DAYS)),
    conceptionDate: toDateInputValue(addDays(dueDate, -CONCEPTION_OFFSET_DAYS)),
  };
};

export const estimatePregnancyFromLastPeriod = (
  lastPeriodValue: string,
  now: Date = new Date()
): PregnancyDateEstimate | null => {
  const lastPeriodStartDate = parseDateInputValue(lastPeriodValue);

  if (!lastPeriodStartDate) {
    return null;
  }

  const totalDays = diffDays(lastPeriodStartDate, now);

  if (totalDays < 0 || totalDays > 42 * 7 + 6) {
    return null;
  }

  const dueDate = addDays(lastPeriodStartDate, PREGNANCY_TOTAL_DAYS);
  const age = {
    week: Math.floor(totalDays / 7),
    day: totalDays % 7,
    totalDays,
  };

  return {
    age,
    dueDate: toDateInputValue(dueDate),
    lastPeriodStartDate: toDateInputValue(lastPeriodStartDate),
    conceptionDate: toDateInputValue(addDays(dueDate, -CONCEPTION_OFFSET_DAYS)),
  };
};
