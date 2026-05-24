import type {
  AssistantCommunicationStyle,
  AssistantMemory,
  AssistantPersonality,
} from "../../shared/types/assistant";
import type {
  AssistantCustomization,
  AssistantDietFriction,
  AssistantMotivationStyle,
  AssistantOnboardingProfile,
  AssistantRole,
  AssistantTone,
} from "../../shared/types/profile";
import type { Goal } from "../../shared/types/user";

export const DEFAULT_ASSISTANT_NAME = "Diana";

export type AssistantCoreEmotion =
  | "calm"
  | "encouraging"
  | "focused"
  | "concerned"
  | "celebrating";

export type AssistantCoreState =
  | "needs_context"
  | "hydration_attention"
  | "protein_attention"
  | "over_target"
  | "weekly_check_in"
  | "steady_day";

export type AssistantRelationshipLevel =
  | "new_companion"
  | "warming_up"
  | "trusted_companion"
  | "deep_context";

export interface AssistantSpeechStyle {
  communicationStyle: AssistantCommunicationStyle;
  pace: "soft" | "balanced" | "direct";
  nudgeStyle: "gentle" | "practical" | "firm";
  phraseDensity: "short" | "normal";
}

export interface AssistantCoreSignals {
  mealEntriesToday: number;
  caloriesConsumed: number;
  dailyCalories: number;
  proteinConsumed: number;
  proteinTarget: number;
  waterConsumedMl: number;
  waterTargetMl: number;
  completedMotivationTasks: number;
  openMotivationTasks: number;
  weeklyCheckInDue: boolean;
}

export interface AssistantCoreSnapshot {
  identity: {
    name: string;
    role: AssistantRole;
    tone: AssistantTone;
  };
  personality: AssistantPersonality;
  speechStyle: AssistantSpeechStyle;
  memory: AssistantMemory;
  onboarding: AssistantOnboardingProfile;
  emotion: AssistantCoreEmotion;
  state: AssistantCoreState;
  relationshipLevel: AssistantRelationshipLevel;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const assistantDietFrictions = [
  "unknown",
  "emotional_eating",
  "chaotic_schedule",
  "evening_snacking",
  "low_energy",
  "social_pressure",
] as const satisfies readonly AssistantDietFriction[];

export const assistantMotivationStyles = [
  "gentle",
  "direct",
  "energetic",
] as const satisfies readonly AssistantMotivationStyle[];

export const isAssistantDietFriction = (
  value: unknown
): value is AssistantDietFriction =>
  assistantDietFrictions.includes(value as AssistantDietFriction);

export const isAssistantMotivationStyle = (
  value: unknown
): value is AssistantMotivationStyle =>
  assistantMotivationStyles.includes(value as AssistantMotivationStyle);

export const createDefaultAssistantOnboardingProfile =
  (): AssistantOnboardingProfile => ({
    preferredName: "",
    primaryGoalNote: "",
    mainFriction: "unknown",
    motivationStyle: "gentle",
    supportNote: "",
    completedAt: null,
  });

export const normalizeAssistantOnboardingProfile = (
  value: unknown
): AssistantOnboardingProfile => {
  const fallback = createDefaultAssistantOnboardingProfile();
  const record = isRecord(value) ? value : {};

  return {
    preferredName:
      typeof record.preferredName === "string"
        ? record.preferredName.trim().slice(0, 60)
        : fallback.preferredName,
    primaryGoalNote:
      typeof record.primaryGoalNote === "string"
        ? record.primaryGoalNote.trim().slice(0, 180)
        : fallback.primaryGoalNote,
    mainFriction: isAssistantDietFriction(record.mainFriction)
      ? record.mainFriction
      : fallback.mainFriction,
    motivationStyle: isAssistantMotivationStyle(record.motivationStyle)
      ? record.motivationStyle
      : fallback.motivationStyle,
    supportNote:
      typeof record.supportNote === "string"
        ? record.supportNote.trim().slice(0, 180)
        : fallback.supportNote,
    completedAt:
      typeof record.completedAt === "string" && record.completedAt.trim().length > 0
        ? record.completedAt
        : fallback.completedAt,
  };
};

export const assistantPersonalityByTone: Record<AssistantTone, AssistantPersonality> = {
  gentle: {
    warmth: 0.9,
    humor: 0.36,
    strictness: 0.18,
    motivation: 0.78,
  },
  playful: {
    warmth: 0.86,
    humor: 0.72,
    strictness: 0.22,
    motivation: 0.9,
  },
  focused: {
    warmth: 0.55,
    humor: 0.15,
    strictness: 0.75,
    motivation: 0.82,
  },
};

export const communicationStyleByTone: Record<
  AssistantTone,
  AssistantCommunicationStyle
> = {
  gentle: "supportive",
  playful: "energetic",
  focused: "strict",
};

const speechStyleByTone: Record<AssistantTone, Omit<AssistantSpeechStyle, "communicationStyle">> = {
  gentle: {
    pace: "soft",
    nudgeStyle: "gentle",
    phraseDensity: "normal",
  },
  playful: {
    pace: "balanced",
    nudgeStyle: "practical",
    phraseDensity: "normal",
  },
  focused: {
    pace: "direct",
    nudgeStyle: "firm",
    phraseDensity: "short",
  },
};

const goalMemoryLabels: Record<Goal, string> = {
  cut: "fat loss",
  maintain: "maintenance",
  bulk: "muscle gain",
};

const frictionMemoryLabels: Record<AssistantDietFriction, string> = {
  unknown: "needs discovery",
  emotional_eating: "emotional eating",
  chaotic_schedule: "chaotic schedule",
  evening_snacking: "evening snacking",
  low_energy: "low energy",
  social_pressure: "social pressure",
};

const motivationMemoryLabels: Record<AssistantMotivationStyle, string> = {
  gentle: "gentle support",
  direct: "direct accountability",
  energetic: "energetic momentum",
};

const getAssistantName = (assistant: AssistantCustomization) => {
  const trimmedName = assistant.name.trim();
  return trimmedName.length > 0 ? trimmedName : DEFAULT_ASSISTANT_NAME;
};

export const createAssistantPersonality = (
  assistant: AssistantCustomization
): AssistantPersonality => {
  const base = assistantPersonalityByTone[assistant.tone];

  return {
    ...base,
    humor: assistant.humorEnabled ? base.humor : 0,
  };
};

export const createAssistantSpeechStyle = (
  assistant: AssistantCustomization
): AssistantSpeechStyle => ({
  communicationStyle: communicationStyleByTone[assistant.tone],
  ...speechStyleByTone[assistant.tone],
});

export const deriveAssistantCoreState = ({
  mealEntriesToday,
  caloriesConsumed,
  dailyCalories,
  proteinConsumed,
  proteinTarget,
  waterConsumedMl,
  waterTargetMl,
  weeklyCheckInDue,
}: AssistantCoreSignals): AssistantCoreState => {
  if (weeklyCheckInDue) {
    return "weekly_check_in";
  }

  if (mealEntriesToday === 0) {
    return "needs_context";
  }

  if (dailyCalories > 0 && caloriesConsumed > dailyCalories * 1.08) {
    return "over_target";
  }

  if (waterTargetMl > 0 && waterConsumedMl < waterTargetMl * 0.45) {
    return "hydration_attention";
  }

  if (proteinTarget > 0 && proteinConsumed < proteinTarget * 0.55) {
    return "protein_attention";
  }

  return "steady_day";
};

export const deriveAssistantEmotion = (
  state: AssistantCoreState,
  { caloriesConsumed, dailyCalories, openMotivationTasks }: AssistantCoreSignals
): AssistantCoreEmotion => {
  if (state === "steady_day" && openMotivationTasks === 0) {
    return "celebrating";
  }

  if (state === "weekly_check_in" || state === "over_target") {
    return "concerned";
  }

  if (state === "hydration_attention" || state === "protein_attention") {
    return "focused";
  }

  if (dailyCalories > 0 && caloriesConsumed > dailyCalories * 0.35) {
    return "encouraging";
  }

  return "calm";
};

export const deriveAssistantRelationshipLevel = ({
  onboardingCompleted,
  completedMotivationTasks,
  mealEntriesToday,
}: {
  onboardingCompleted: boolean;
  completedMotivationTasks: number;
  mealEntriesToday: number;
}): AssistantRelationshipLevel => {
  const interactionScore =
    completedMotivationTasks + mealEntriesToday + (onboardingCompleted ? 2 : 0);

  if (interactionScore >= 28) {
    return "deep_context";
  }

  if (interactionScore >= 10) {
    return "trusted_companion";
  }

  if (interactionScore >= 3) {
    return "warming_up";
  }

  return "new_companion";
};

export const createAssistantMemoryProfile = ({
  userId,
  userName,
  goal,
  assistant,
  personality,
  speechStyle,
  emotion,
}: {
  userId?: string;
  userName: string;
  goal: Goal;
  assistant: AssistantCustomization;
  personality: AssistantPersonality;
  speechStyle: AssistantSpeechStyle;
  emotion: AssistantCoreEmotion;
}): AssistantMemory => {
  const onboarding = assistant.onboarding;
  const goals = [goalMemoryLabels[goal], onboarding.primaryGoalNote].filter(
    (item): item is string => item.trim().length > 0
  );
  const struggles = [
    frictionMemoryLabels[onboarding.mainFriction],
    onboarding.supportNote,
  ].filter((item): item is string => item.trim().length > 0);
  const habits = [userName ? `prefers being called ${userName}` : ""].filter(
    (item): item is string => item.length > 0
  );
  const motivationTriggers = [
    motivationMemoryLabels[onboarding.motivationStyle],
  ];

  return {
    userId,
    assistantName: getAssistantName(assistant),
    personality,
    communicationStyle: speechStyle.communicationStyle,
    goals,
    struggles,
    habits,
    motivationTriggers,
    lastMood: emotion,
    recentProblems: [],
  };
};

export const buildAssistantCoreSnapshot = ({
  userId,
  userName,
  goal,
  assistant,
  signals,
}: {
  userId?: string;
  userName: string;
  goal: Goal;
  assistant: AssistantCustomization;
  signals: AssistantCoreSignals;
}): AssistantCoreSnapshot => {
  const personality = createAssistantPersonality(assistant);
  const speechStyle = createAssistantSpeechStyle(assistant);
  const state = deriveAssistantCoreState(signals);
  const emotion = deriveAssistantEmotion(state, signals);
  const relationshipLevel = deriveAssistantRelationshipLevel({
    onboardingCompleted: Boolean(assistant.onboarding.completedAt),
    completedMotivationTasks: signals.completedMotivationTasks,
    mealEntriesToday: signals.mealEntriesToday,
  });

  return {
    identity: {
      name: getAssistantName(assistant),
      role: assistant.role,
      tone: assistant.tone,
    },
    personality,
    speechStyle,
    memory: createAssistantMemoryProfile({
      userId,
      userName,
      goal,
      assistant,
      personality,
      speechStyle,
      emotion,
    }),
    onboarding: assistant.onboarding,
    emotion,
    state,
    relationshipLevel,
  };
};
