import type { AppLanguage } from "./i18n";
import type {
  AssistantRole,
  AssistantTone,
  DietStyle,
  MotivationState,
} from "./profile";
import type {
  NutritionCoachAnalysis,
  NutritionCoachInsightCode,
} from "../lib/nutritionCoach";
import type { Goal } from "./user";

export type AssistantRuntimeMode = "local-preview" | "remote-cloud";

export type AssistantQuickQuestionId =
  | "day_status"
  | "protein_help"
  | "coach_focus"
  | "motivation_focus";

export interface AssistantRuntimeContext {
  language: AppLanguage;
  userName: string;
  goal: Goal;
  dietStyle: DietStyle;
  dailyCalories: number;
  caloriesConsumed: number;
  caloriesRemaining: number;
  proteinConsumed: number;
  proteinTarget: number;
  fatConsumed: number;
  carbsConsumed: number;
  mealEntriesToday: number;
  assistantName: string;
  assistantRole: AssistantRole;
  assistantTone: AssistantTone;
  humorEnabled: boolean;
  motivation: MotivationState;
  coach: NutritionCoachAnalysis;
  coachPrimaryInsight: NutritionCoachInsightCode;
}

export interface AssistantQuestionInput {
  question: string;
  context: AssistantRuntimeContext;
  quickQuestionId?: AssistantQuickQuestionId | null;
}

export interface AssistantRuntimeResponse {
  text: string;
  mode: AssistantRuntimeMode;
  followUpQuestionIds: AssistantQuickQuestionId[];
}

export interface AssistantConversationMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
  mode?: AssistantRuntimeMode;
  followUpQuestionIds?: AssistantQuickQuestionId[];
  createdAt?: string;
}

export interface AssistantRuntimeStatusProvider {
  id: string;
  label: string;
  model: string | null;
  baseUrl: string | null;
  priority: number;
  primary: boolean;
  coolingDown: boolean;
  coolingDownUntil: string | null;
  lastAttemptedAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  consecutiveFailures: number;
  lastError: string | null;
  lastErrorCode: string | null;
  lastErrorStatus: number | null;
}

export interface AssistantRuntimeStatus {
  configured: boolean;
  providerCount: number;
  fallbackEnabled: boolean;
  model: string | null;
  baseUrl: string | null;
  primaryProviderId: string | null;
  primaryProviderLabel: string | null;
  memoryMessageLimit: number;
  retryCooldownMs: number;
  providers: AssistantRuntimeStatusProvider[];
}

export const assistantQuickQuestionIds: AssistantQuickQuestionId[] = [
  "day_status",
  "protein_help",
  "coach_focus",
  "motivation_focus",
];

export const isAssistantQuickQuestionId = (
  value: unknown
): value is AssistantQuickQuestionId =>
  assistantQuickQuestionIds.includes(value as AssistantQuickQuestionId);
