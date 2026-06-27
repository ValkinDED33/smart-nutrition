import type { SxProps, Theme } from "@mui/material";
import type {
  AssistantCompanionKind,
  AssistantDietFriction,
  AssistantMotivationStyle,
  WomenHealthMode,
} from "@domain/profile/types";
import type { Gender, Goal } from "@domain/user/types";
import { selectInputValue } from "@shared/lib/inputSelection";

export type PersonalityPreset =
  | "supportive"
  | "strict"
  | "energetic"
  | "calm"
  | "scientific";

export type OnboardingGoalChoice = Goal | "healthy";
export type OnboardingFrictionChoice = Exclude<AssistantDietFriction, "unknown">;

export interface OnboardingState {
  assistantName: string;
  assistantAvatar: AssistantCompanionKind;
  personality: PersonalityPreset;
  name: string;
  age: number;
  gender: Gender;
  womenHealthMode: WomenHealthMode;
  pregnancyWeek: number | null;
  dueDate: string;
  lastPeriodStartDate: string;
  doctorConfirmed: boolean;
  womenHealthNotes: string;
  height: number;
  goal: Goal;
  selectedGoals: OnboardingGoalChoice[];
  primaryGoalNote: string;
  mainFriction: AssistantDietFriction;
  mainFrictions: OnboardingFrictionChoice[];
  motivationStyle: AssistantMotivationStyle;
  motivationStyles: AssistantMotivationStyle[];
  supportNote: string;
  weight: number;
}

export interface OnboardingStepProps {
  state: OnboardingState;
  updateState: (patch: Partial<OnboardingState>) => void;
}

export const stepPaths = {
  welcome: "/onboarding",
  assistant: "/onboarding/assistant",
  name: "/onboarding/name",
  age: "/onboarding/age",
  gender: "/onboarding/gender",
  womenHealth: "/onboarding/women-health",
  height: "/onboarding/height",
  goal: "/onboarding/goal",
  friction: "/onboarding/friction",
  motivation: "/onboarding/motivation",
  weight: "/onboarding/weight",
  finish: "/onboarding/finish",
} as const;

export const cardSx = {
  width: "100%",
  maxWidth: 560,
  p: { xs: 2.5, sm: 3.5 },
  borderRadius: 1,
  border: "1px solid var(--sn-border-soft)",
  backgroundColor: "var(--sn-surface-glass)",
  boxShadow: "var(--sn-shadow-card)",
} satisfies SxProps<Theme>;

export const shellSx = {
  minHeight: { xs: "calc(100vh - 140px)", md: "calc(100vh - 180px)" },
  display: "grid",
  placeItems: "center",
} satisfies SxProps<Theme>;

export const goalOptions: OnboardingGoalChoice[] = ["cut", "bulk", "maintain", "healthy"];

export const personalityValues: Record<
  PersonalityPreset,
  {
    warmth: number;
    humor: number;
    strictness: number;
    motivation: number;
  }
> = {
  supportive: { warmth: 0.9, humor: 0.4, strictness: 0.2, motivation: 0.8 },
  strict: { warmth: 0.45, humor: 0.1, strictness: 0.85, motivation: 0.7 },
  energetic: { warmth: 0.75, humor: 0.55, strictness: 0.35, motivation: 0.95 },
  calm: { warmth: 0.86, humor: 0.18, strictness: 0.16, motivation: 0.62 },
  scientific: { warmth: 0.58, humor: 0.08, strictness: 0.62, motivation: 0.72 },
};

export const assistantAvatarOptions: AssistantCompanionKind[] = [
  "cat",
  "dog",
  "fox",
  "panda",
  "owl",
  "dragon",
];

export const clampNumber = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const sanitizeOnboardingIntegerInput = (value: string, maxLength = 3) =>
  value.replace(/[^\d]/g, "").slice(0, maxLength);

export const sanitizeOnboardingDecimalInput = (value: string, maxLength = 5) =>
  value
    .replace(/[^\d,.]/g, "")
    .replace(".", ",")
    .replace(/(,.*),/g, "$1")
    .slice(0, maxLength);

export const toggleArrayValue = <T extends string>(items: T[], item: T) =>
  items.includes(item)
    ? items.filter((current) => current !== item)
    : [...items, item];

export const normalizeSelectedGoals = (
  selectedGoals: readonly string[]
): OnboardingGoalChoice[] =>
  goalOptions.filter((goal) => selectedGoals.includes(goal));

export const derivePrimaryGoal = (selectedGoals: OnboardingGoalChoice[]) => {
  const primaryGoal = selectedGoals.find((goal): goal is Goal => goal !== "healthy");

  return {
    goal: primaryGoal ?? "maintain",
    primaryGoalNote:
      selectedGoals.includes("healthy") && selectedGoals.length === 1 ? "healthy" : "",
  };
};

export const parseOnboardingNumber = (value: string) => {
  const normalized = value.trim().replace(",", ".");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const selectOnboardingInputValue = selectInputValue;
