import type { Language } from "../language";

const localeByLanguage: Record<Language, string> = {
  uk: "uk-UA",
  pl: "pl-PL",
};

const pad = (value: number) => String(value).padStart(2, "0");

export const getLocalDateKey = (value: Date | string | number) => {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const parseLocalDateKey = (dateKey: string) => {
  const [yearPart, monthPart, dayPart] = dateKey.split("-");
  const year = Number(yearPart ?? 1970);
  const month = Number(monthPart ?? 1);
  const day = Number(dayPart ?? 1);

  return new Date(year, month - 1, day);
};

export const formatLocalDateKey = (
  dateKey: string,
  language: Language,
  options: Intl.DateTimeFormatOptions
) => parseLocalDateKey(dateKey).toLocaleDateString(localeByLanguage[language], options);

export const addDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};
