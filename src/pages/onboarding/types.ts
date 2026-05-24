import type { SxProps, Theme } from "@mui/material";
import type {
  AssistantDietFriction,
  AssistantMotivationStyle,
} from "../../shared/types/profile";
import type { Goal } from "../../shared/types/user";

export type PersonalityPreset = "supportive" | "strict" | "energetic";

export interface OnboardingState {
  assistantName: string;
  personality: PersonalityPreset;
  name: string;
  age: number;
  goal: Goal;
  primaryGoalNote: string;
  mainFriction: AssistantDietFriction;
  motivationStyle: AssistantMotivationStyle;
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
  goal: "/onboarding/goal",
  weight: "/onboarding/weight",
  finish: "/onboarding/finish",
} as const;

export const cardSx = {
  width: "100%",
  maxWidth: 560,
  p: { xs: 2.5, sm: 3.5 },
  borderRadius: 1,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  backgroundColor: "rgba(255,255,255,0.92)",
} satisfies SxProps<Theme>;

export const shellSx = {
  minHeight: { xs: "calc(100vh - 140px)", md: "calc(100vh - 180px)" },
  display: "grid",
  placeItems: "center",
} satisfies SxProps<Theme>;

export const goalOptions: Goal[] = ["cut", "maintain", "bulk"];

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
};

export const clampNumber = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
