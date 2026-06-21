import type { Gender } from "@domain/user/types";
import type { WomenHealthMode, WomenHealthState } from "./types";

const MAX_NOTE_LENGTH = 220;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const womenHealthModes: WomenHealthMode[] = [
  "none",
  "trying_to_conceive",
  "pregnant",
  "postpartum",
];

export const isWomenHealthMode = (value: unknown): value is WomenHealthMode =>
  womenHealthModes.includes(value as WomenHealthMode);

export const createDefaultWomenHealthState = (): WomenHealthState => ({
  mode: "none",
  pregnancyWeek: null,
  dueDate: null,
  lastPeriodStartDate: null,
  doctorConfirmed: false,
  notes: "",
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
    updatedAt: toIsoDateOrNull(record.updatedAt),
  };
};

export const getWomenHealthForGender = (
  gender: Gender | null | undefined,
  value: unknown
): WomenHealthState =>
  isWomenHealthVisibleForGender(gender)
    ? normalizeWomenHealthState(value)
    : createDefaultWomenHealthState();

export const getWomenHealthAssistantMode = (
  gender: Gender | null | undefined,
  state: WomenHealthState
) => {
  if (!isWomenHealthVisibleForGender(gender) || state.mode === "none") {
    return "not_applicable";
  }

  return state.mode;
};
