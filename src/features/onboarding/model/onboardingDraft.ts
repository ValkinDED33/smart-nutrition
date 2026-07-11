import type { AppLanguage } from "@shared/types/i18n";
import type {
  AssistantCompanionKind,
  AssistantDietFriction,
  AssistantMotivationStyle,
  AssistantTone,
  WomenHealthMode,
} from "@domain/profile/types";
import type { Gender, Goal } from "@domain/user/types";
import {
  getClientStorageItem,
  removeClientStorageItem,
  setClientStorageItem,
} from "@shared/lib/clientPersistence";

const ONBOARDING_DRAFT_KEY = "smart-nutrition.pre-auth-onboarding";

export interface PreAuthOnboardingDraft {
  language: AppLanguage;
  assistantName: string;
  assistantAvatar: AssistantCompanionKind;
  assistantPersonality: AssistantTone;
  userName: string;
  age: number;
  gender: Gender;
  womenHealthMode: WomenHealthMode;
  pregnancyWeek: number | null;
  dueDate: string;
  lastPeriodStartDate: string;
  doctorConfirmed: boolean;
  womenHealthNotes: string;
  height: number;
  weight: number;
  goal: Goal;
  selectedGoals: Array<Goal | "healthy">;
  primaryGoalNote: string;
  mainFriction: AssistantDietFriction;
  mainFrictions: Exclude<AssistantDietFriction, "unknown">[];
  motivationStyle: AssistantMotivationStyle;
  motivationStyles: AssistantMotivationStyle[];
  supportNote: string;
}

export const defaultPreAuthOnboardingDraft = (
  language: AppLanguage
): PreAuthOnboardingDraft => ({
  language,
  assistantName: "",
  assistantAvatar: "robot",
  assistantPersonality: "gentle",
  userName: "",
  age: 25,
  gender: "male",
  womenHealthMode: "none",
  pregnancyWeek: null,
  dueDate: "",
  lastPeriodStartDate: "",
  doctorConfirmed: false,
  womenHealthNotes: "",
  height: 175,
  weight: 70,
  goal: "maintain",
  selectedGoals: ["maintain"],
  primaryGoalNote: "",
  mainFriction: "unknown",
  mainFrictions: [],
  motivationStyle: "gentle",
  motivationStyles: ["gentle"],
  supportNote: "",
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isLanguage = (value: unknown): value is AppLanguage =>
  value === "uk" || value === "pl" || value === "en";

const isAvatar = (value: unknown): value is AssistantCompanionKind =>
  value === "robot" ||
  value === "cat" ||
  value === "dog" ||
  value === "fox" ||
  value === "panda" ||
  value === "owl" ||
  value === "human" ||
  value === "capybara" ||
  value === "dragon";

const isTone = (value: unknown): value is AssistantTone =>
  value === "gentle" ||
  value === "playful" ||
  value === "focused" ||
  value === "calm" ||
  value === "scientific";

const isFriction = (value: unknown): value is AssistantDietFriction =>
  value === "unknown" ||
  value === "emotional_eating" ||
  value === "chaotic_schedule" ||
  value === "evening_snacking" ||
  value === "low_energy" ||
  value === "social_pressure";

const isMotivationStyle = (value: unknown): value is AssistantMotivationStyle =>
  value === "gentle" || value === "direct" || value === "energetic";

const isGender = (value: unknown): value is Gender => value === "male" || value === "female";
const isWomenHealthMode = (value: unknown): value is WomenHealthMode =>
  value === "none" ||
  value === "trying_to_conceive" ||
  value === "pregnant" ||
  value === "postpartum";
const isGoal = (value: unknown): value is Goal =>
  value === "cut" || value === "maintain" || value === "bulk";
const isGoalChoice = (value: unknown): value is Goal | "healthy" =>
  isGoal(value) || value === "healthy";

const toNumber = (value: unknown, fallback: number, min: number, max: number) => {
  const nextValue = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.max(min, Math.min(max, nextValue));
};

const toNullableNumber = (value: unknown, min: number, max: number) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const nextValue = typeof value === "number" && Number.isFinite(value) ? value : Number(value);
  return Number.isFinite(nextValue) ? Math.max(min, Math.min(max, Math.round(nextValue))) : null;
};

const toDateString = (value: unknown) =>
  typeof value === "string" && !Number.isNaN(Date.parse(value))
    ? value.slice(0, 10)
    : "";

const normalizeGoalChoices = (value: unknown, fallback: Array<Goal | "healthy">) => {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const selected = value
    .filter(isGoalChoice)
    .filter((item, index, items) => items.indexOf(item) === index);

  return selected.length > 0 ? selected : fallback;
};

const normalizeFrictionChoices = (value: unknown, fallback: AssistantDietFriction) => {
  if (!Array.isArray(value)) {
    return fallback === "unknown" ? [] : [fallback];
  }

  return value
    .filter((item): item is Exclude<AssistantDietFriction, "unknown"> =>
      isFriction(item) && item !== "unknown"
    )
    .filter((item, index, items) => items.indexOf(item) === index);
};

const normalizeMotivationStyles = (
  value: unknown,
  fallback: AssistantMotivationStyle
) => {
  if (!Array.isArray(value)) {
    return [fallback];
  }

  const selected = value
    .filter(isMotivationStyle)
    .filter((item, index, items) => items.indexOf(item) === index);

  return selected.length > 0 ? selected : [fallback];
};

export const normalizePreAuthOnboardingDraft = (
  value: unknown,
  language: AppLanguage
): PreAuthOnboardingDraft => {
  const fallback = defaultPreAuthOnboardingDraft(language);
  const record = isRecord(value) ? value : {};
  const goal = isGoal(record.goal) ? record.goal : fallback.goal;
  const mainFriction = isFriction(record.mainFriction)
    ? record.mainFriction
    : fallback.mainFriction;
  const motivationStyle = isMotivationStyle(record.motivationStyle)
    ? record.motivationStyle
    : fallback.motivationStyle;

  return {
    language: isLanguage(record.language) ? record.language : fallback.language,
    assistantName:
      typeof record.assistantName === "string" && record.assistantName.trim().length > 0
        ? record.assistantName.trim().slice(0, 32)
        : fallback.assistantName,
    assistantAvatar: isAvatar(record.assistantAvatar)
      ? record.assistantAvatar
      : fallback.assistantAvatar,
    assistantPersonality: isTone(record.assistantPersonality)
      ? record.assistantPersonality
      : fallback.assistantPersonality,
    userName:
      typeof record.userName === "string" ? record.userName.trim().slice(0, 60) : "",
    age: toNumber(record.age, fallback.age, 10, 120),
    gender: isGender(record.gender) ? record.gender : fallback.gender,
    womenHealthMode:
      isGender(record.gender) && record.gender === "female" && isWomenHealthMode(record.womenHealthMode)
        ? record.womenHealthMode
        : "none",
    pregnancyWeek:
      isGender(record.gender) &&
      record.gender === "female" &&
      record.womenHealthMode === "pregnant"
        ? toNullableNumber(record.pregnancyWeek, 1, 42)
        : null,
    dueDate:
      isGender(record.gender) &&
      record.gender === "female" &&
      record.womenHealthMode === "pregnant"
        ? toDateString(record.dueDate)
        : "",
    lastPeriodStartDate:
      isGender(record.gender) &&
      record.gender === "female" &&
      (record.womenHealthMode === "pregnant" ||
        record.womenHealthMode === "trying_to_conceive")
        ? toDateString(record.lastPeriodStartDate)
        : "",
    doctorConfirmed:
      isGender(record.gender) &&
      record.gender === "female" &&
      (record.womenHealthMode === "pregnant" ||
        record.womenHealthMode === "trying_to_conceive")
        ? Boolean(record.doctorConfirmed)
        : false,
    womenHealthNotes:
      isGender(record.gender) && record.gender === "female" && typeof record.womenHealthNotes === "string"
        ? record.womenHealthNotes.trim().replace(/\s+/g, " ").slice(0, 220)
        : "",
    height: toNumber(record.height, fallback.height, 120, 250),
    weight: toNumber(record.weight, fallback.weight, 30, 300),
    goal,
    selectedGoals: normalizeGoalChoices(record.selectedGoals, [
      record.primaryGoalNote === "healthy" ? "healthy" : goal,
    ]),
    primaryGoalNote:
      typeof record.primaryGoalNote === "string" ? record.primaryGoalNote.slice(0, 120) : "",
    mainFriction,
    mainFrictions: normalizeFrictionChoices(record.mainFrictions, mainFriction),
    motivationStyle,
    motivationStyles: normalizeMotivationStyles(record.motivationStyles, motivationStyle),
    supportNote:
      typeof record.supportNote === "string" ? record.supportNote.slice(0, 220) : "",
  };
};

export const readPreAuthOnboardingDraft = (language: AppLanguage) => {
  const rawDraft = getClientStorageItem(ONBOARDING_DRAFT_KEY);

  if (!rawDraft) {
    return defaultPreAuthOnboardingDraft(language);
  }

  try {
    return normalizePreAuthOnboardingDraft(JSON.parse(rawDraft), language);
  } catch {
    return defaultPreAuthOnboardingDraft(language);
  }
};

export const hasPreAuthOnboardingDraft = () =>
  Boolean(getClientStorageItem(ONBOARDING_DRAFT_KEY));

export const writePreAuthOnboardingDraft = (draft: PreAuthOnboardingDraft) => {
  setClientStorageItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
};

export const clearPreAuthOnboardingDraft = () => {
  removeClientStorageItem(ONBOARDING_DRAFT_KEY);
};
