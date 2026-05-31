import type { AppLanguage } from "../types/i18n";
import type { AssistantCompanionKind, AssistantTone } from "../types/profile";
import type { Gender, Goal } from "../types/user";
import {
  getClientStorageItem,
  removeClientStorageItem,
  setClientStorageItem,
} from "./clientPersistence";

const ONBOARDING_DRAFT_KEY = "smart-nutrition.pre-auth-onboarding";

export interface PreAuthOnboardingDraft {
  language: AppLanguage;
  assistantName: string;
  assistantAvatar: AssistantCompanionKind;
  assistantPersonality: AssistantTone;
  userName: string;
  age: number;
  gender: Gender;
  height: number;
  weight: number;
  goal: Goal;
  primaryGoalNote: string;
}

export const defaultPreAuthOnboardingDraft = (
  language: AppLanguage
): PreAuthOnboardingDraft => ({
  language,
  assistantName: language === "pl" || language === "en" ? "Alex" : "Алекс",
  assistantAvatar: "robot",
  assistantPersonality: "gentle",
  userName: "",
  age: 25,
  gender: "male",
  height: 175,
  weight: 70,
  goal: "maintain",
  primaryGoalNote: "",
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
  value === "human" ||
  value === "capybara" ||
  value === "dragon";

const isTone = (value: unknown): value is AssistantTone =>
  value === "gentle" ||
  value === "playful" ||
  value === "focused" ||
  value === "calm" ||
  value === "scientific";

const isGender = (value: unknown): value is Gender => value === "male" || value === "female";
const isGoal = (value: unknown): value is Goal =>
  value === "cut" || value === "maintain" || value === "bulk";

const toNumber = (value: unknown, fallback: number, min: number, max: number) => {
  const nextValue = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.max(min, Math.min(max, nextValue));
};

export const normalizePreAuthOnboardingDraft = (
  value: unknown,
  language: AppLanguage
): PreAuthOnboardingDraft => {
  const fallback = defaultPreAuthOnboardingDraft(language);
  const record = isRecord(value) ? value : {};

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
    height: toNumber(record.height, fallback.height, 120, 250),
    weight: toNumber(record.weight, fallback.weight, 30, 300),
    goal: isGoal(record.goal) ? record.goal : fallback.goal,
    primaryGoalNote:
      typeof record.primaryGoalNote === "string" ? record.primaryGoalNote.slice(0, 120) : "",
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

export const writePreAuthOnboardingDraft = (draft: PreAuthOnboardingDraft) => {
  setClientStorageItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
};

export const clearPreAuthOnboardingDraft = () => {
  removeClientStorageItem(ONBOARDING_DRAFT_KEY);
};
