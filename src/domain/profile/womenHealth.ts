import type { Gender } from "@domain/user/types";
import type {
  ChineseZodiacSign,
  EyeColor,
  WomenHealthMode,
  WomenHealthState,
  ZodiacSign,
} from "./types";

const MAX_NOTE_LENGTH = 220;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const womenHealthModes: WomenHealthMode[] = [
  "none",
  "trying_to_conceive",
  "pregnant",
  "postpartum",
];

const isWomenHealthMode = (value: unknown): value is WomenHealthMode =>
  womenHealthModes.includes(value as WomenHealthMode);

export const zodiacSigns: ZodiacSign[] = [
  "unknown",
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
];

export const chineseZodiacSigns: ChineseZodiacSign[] = [
  "unknown",
  "rat",
  "ox",
  "tiger",
  "rabbit",
  "dragon",
  "snake",
  "horse",
  "goat",
  "monkey",
  "rooster",
  "dog",
  "pig",
];

export const eyeColors: EyeColor[] = [
  "unknown",
  "brown",
  "blue",
  "green",
  "gray",
  "hazel",
  "amber",
  "other",
];

const isEyeColor = (value: unknown): value is EyeColor =>
  eyeColors.includes(value as EyeColor);
const isZodiacSign = (value: unknown): value is ZodiacSign =>
  zodiacSigns.includes(value as ZodiacSign);
const isChineseZodiacSign = (value: unknown): value is ChineseZodiacSign =>
  chineseZodiacSigns.includes(value as ChineseZodiacSign);

export const createDefaultWomenHealthState = (): WomenHealthState => ({
  mode: "none",
  pregnancyWeek: null,
  dueDate: null,
  lastPeriodStartDate: null,
  doctorConfirmed: false,
  notes: "",
  partnerEyeColor: "unknown",
  motherZodiac: "unknown",
  fatherZodiac: "unknown",
  motherChineseZodiac: "unknown",
  fatherChineseZodiac: "unknown",
  updatedAt: null,
});

export const isWomenHealthVisibleForGender = (gender: Gender | null | undefined) =>
  gender === "female";

const toIsoDateOrNull = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
};

const normalizePregnancyWeek = (value: unknown) => {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return null;
  }

  const rounded = Math.round(numberValue);
  return rounded >= 1 && rounded <= 42 ? rounded : null;
};

const PREGNANCY_DAYS = 280;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

const readDateTime = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
};

const clampPregnancyWeek = (week: number) =>
  Math.max(1, Math.min(42, Math.round(week)));

export const getEffectivePregnancyWeek = (
  state: Pick<WomenHealthState, "pregnancyWeek" | "dueDate" | "lastPeriodStartDate">,
  now: Date = new Date()
) => {
  if (state.pregnancyWeek) {
    return clampPregnancyWeek(state.pregnancyWeek);
  }

  const nowTime = now.getTime();
  const dueTime = readDateTime(state.dueDate);

  if (dueTime !== null) {
    const elapsedWeeks = (PREGNANCY_DAYS - (dueTime - nowTime) / DAY_MS) / 7;

    if (Number.isFinite(elapsedWeeks) && elapsedWeeks >= 1 && elapsedWeeks <= 42) {
      return clampPregnancyWeek(elapsedWeeks);
    }
  }

  const lastPeriodTime = readDateTime(state.lastPeriodStartDate);

  if (lastPeriodTime !== null) {
    const elapsedWeeks = (nowTime - lastPeriodTime) / WEEK_MS;

    if (Number.isFinite(elapsedWeeks) && elapsedWeeks >= 1 && elapsedWeeks <= 42) {
      return clampPregnancyWeek(elapsedWeeks);
    }
  }

  return null;
};

export const normalizeWomenHealthState = (value: unknown): WomenHealthState => {
  const fallback = createDefaultWomenHealthState();
  const record = isRecord(value) ? value : {};
  const mode = isWomenHealthMode(record.mode) ? record.mode : fallback.mode;
  const pregnancyWeek =
    mode === "pregnant" ? normalizePregnancyWeek(record.pregnancyWeek) : null;
  const notes =
    typeof record.notes === "string"
      ? record.notes.trim().replace(/\s+/g, " ").slice(0, MAX_NOTE_LENGTH)
      : "";

  return {
    mode,
    pregnancyWeek,
    dueDate: mode === "pregnant" ? toIsoDateOrNull(record.dueDate) : null,
    lastPeriodStartDate:
      mode === "pregnant" || mode === "trying_to_conceive"
        ? toIsoDateOrNull(record.lastPeriodStartDate)
        : null,
    doctorConfirmed:
      mode === "pregnant" || mode === "trying_to_conceive"
        ? Boolean(record.doctorConfirmed)
        : false,
    notes,
    partnerEyeColor: isEyeColor(record.partnerEyeColor)
      ? record.partnerEyeColor
      : fallback.partnerEyeColor,
    motherZodiac: isZodiacSign(record.motherZodiac)
      ? record.motherZodiac
      : fallback.motherZodiac,
    fatherZodiac: isZodiacSign(record.fatherZodiac)
      ? record.fatherZodiac
      : fallback.fatherZodiac,
    motherChineseZodiac: isChineseZodiacSign(record.motherChineseZodiac)
      ? record.motherChineseZodiac
      : fallback.motherChineseZodiac,
    fatherChineseZodiac: isChineseZodiacSign(record.fatherChineseZodiac)
      ? record.fatherChineseZodiac
      : fallback.fatherChineseZodiac,
    updatedAt: toIsoDateOrNull(record.updatedAt),
  };
};
