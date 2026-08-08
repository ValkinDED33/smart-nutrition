import type { AppLanguage } from "@shared/types/i18n";
import type {
  AssistantCompanionKind,
  AssistantDietFriction,
  AssistantMotivationStyle,
  AssistantTone,
  ChineseZodiacSign,
  EyeColor,
  WomenHealthMode,
  ZodiacSign,
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
  pregnancyDay: number | null;
  dueDate: string;
  lastPeriodStartDate: string;
  doctorConfirmed: boolean;
  womenHealthNotes: string;
  motherEyeColor: EyeColor;
  partnerEyeColor: EyeColor;
  motherZodiac: ZodiacSign;
  fatherZodiac: ZodiacSign;
  motherChineseZodiac: ChineseZodiacSign;
  fatherChineseZodiac: ChineseZodiacSign;
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
  personalizationCompleted: boolean;
}

const defaultPreAuthOnboardingDraft = (
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
  pregnancyDay: null,
  dueDate: "",
  lastPeriodStartDate: "",
  doctorConfirmed: false,
  womenHealthNotes: "",
  motherEyeColor: "unknown",
  partnerEyeColor: "unknown",
  motherZodiac: "unknown",
  fatherZodiac: "unknown",
  motherChineseZodiac: "unknown",
  fatherChineseZodiac: "unknown",
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
  personalizationCompleted: false,
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
  value === "dragon" ||
  value === "raccoon" ||
  value === "corgi" ||
  value === "wolf" ||
  value === "tiger" ||
  value === "bear" ||
  value === "rabbit" ||
  value === "chameleon" ||
  value === "lion" ||
  value === "otter" ||
  value === "hedgehog" ||
  value === "koala" ||
  value === "deer" ||
  value === "turtle" ||
  value === "axolotl" ||
  value === "phoenix" ||
  value === "forest_spirit" ||
  value === "cosmic_beast";

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
const isEyeColor = (value: unknown): value is EyeColor =>
  value === "unknown" ||
  value === "brown" ||
  value === "blue" ||
  value === "green" ||
  value === "gray" ||
  value === "hazel" ||
  value === "amber" ||
  value === "other";
const isZodiacSign = (value: unknown): value is ZodiacSign =>
  value === "unknown" ||
  value === "aries" ||
  value === "taurus" ||
  value === "gemini" ||
  value === "cancer" ||
  value === "leo" ||
  value === "virgo" ||
  value === "libra" ||
  value === "scorpio" ||
  value === "sagittarius" ||
  value === "capricorn" ||
  value === "aquarius" ||
  value === "pisces";
const isChineseZodiacSign = (value: unknown): value is ChineseZodiacSign =>
  value === "unknown" ||
  value === "rat" ||
  value === "ox" ||
  value === "tiger" ||
  value === "rabbit" ||
  value === "dragon" ||
  value === "snake" ||
  value === "horse" ||
  value === "goat" ||
  value === "monkey" ||
  value === "rooster" ||
  value === "dog" ||
  value === "pig";
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

const normalizePreAuthOnboardingDraft = (
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
    pregnancyDay:
      isGender(record.gender) &&
      record.gender === "female" &&
      record.womenHealthMode === "pregnant" &&
      toNullableNumber(record.pregnancyWeek, 1, 42) !== null
        ? toNullableNumber(record.pregnancyDay, 0, 6) ?? 0
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
    motherEyeColor:
      isGender(record.gender) && record.gender === "female" && isEyeColor(record.motherEyeColor)
        ? record.motherEyeColor
        : fallback.motherEyeColor,
    partnerEyeColor:
      isGender(record.gender) && record.gender === "female" && isEyeColor(record.partnerEyeColor)
        ? record.partnerEyeColor
        : fallback.partnerEyeColor,
    motherZodiac:
      isGender(record.gender) && record.gender === "female" && isZodiacSign(record.motherZodiac)
        ? record.motherZodiac
        : fallback.motherZodiac,
    fatherZodiac:
      isGender(record.gender) && record.gender === "female" && isZodiacSign(record.fatherZodiac)
        ? record.fatherZodiac
        : fallback.fatherZodiac,
    motherChineseZodiac:
      isGender(record.gender) &&
      record.gender === "female" &&
      isChineseZodiacSign(record.motherChineseZodiac)
        ? record.motherChineseZodiac
        : fallback.motherChineseZodiac,
    fatherChineseZodiac:
      isGender(record.gender) &&
      record.gender === "female" &&
      isChineseZodiacSign(record.fatherChineseZodiac)
        ? record.fatherChineseZodiac
        : fallback.fatherChineseZodiac,
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
    personalizationCompleted: Boolean(record.personalizationCompleted),
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
