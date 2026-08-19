import type {
  AssistantCommunicationStyle,
  AssistantMemory,
  AssistantPersonality,
} from "@domain/assistant/types";
import type {
  AssistantCustomization,
  AssistantDietFriction,
  AssistantMotivationStyle,
  AssistantOnboardingProfile,
  AssistantRole,
  AssistantTone,
} from "@domain/profile/types";
import type { Goal } from "@domain/user/types";
export const DEFAULT_ASSISTANT_NAME = "";
const DEFAULT_ASSISTANT_RUNTIME_LABEL = "Smart Nutrition assistant";

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

interface AssistantSpeechStyle {
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

const isAssistantDietFriction = (
  value: unknown
): value is AssistantDietFriction =>
  assistantDietFrictions.includes(value as AssistantDietFriction);

const isAssistantMotivationStyle = (
  value: unknown
): value is AssistantMotivationStyle =>
  assistantMotivationStyles.includes(value as AssistantMotivationStyle);

const normalizeOnboardingStringArray = (value: unknown, maxItems = 8) =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().replace(/\s+/g, " ").slice(0, 80))
        .filter(Boolean)
        .slice(0, maxItems)
    : [];

const normalizeFrictionSelection = (value: unknown) =>
  Array.isArray(value)
    ? value
        .filter(isAssistantDietFriction)
        .filter((item) => item !== "unknown")
        .filter((item, index, items) => items.indexOf(item) === index)
    : [];

const normalizeMotivationSelection = (value: unknown) =>
  Array.isArray(value)
    ? value
        .filter(isAssistantMotivationStyle)
        .filter((item, index, items) => items.indexOf(item) === index)
    : [];

export const createDefaultAssistantOnboardingProfile =
  (): AssistantOnboardingProfile => ({
    preferredName: "",
    primaryGoalNote: "",
    goalSelections: [],
    mainFriction: "unknown",
    mainFrictions: [],
    motivationStyle: "gentle",
    motivationStyles: ["gentle"],
    supportNote: "",
    completedAt: null,
  });

export const normalizeAssistantOnboardingProfile = (
  value: unknown
): AssistantOnboardingProfile => {
  const fallback = createDefaultAssistantOnboardingProfile();
  const record = isRecord(value) ? value : {};
  const mainFriction = isAssistantDietFriction(record.mainFriction)
    ? record.mainFriction
    : fallback.mainFriction;
  const motivationStyle = isAssistantMotivationStyle(record.motivationStyle)
    ? record.motivationStyle
    : fallback.motivationStyle;
  const mainFrictions = normalizeFrictionSelection(record.mainFrictions);
  const motivationStyles = normalizeMotivationSelection(record.motivationStyles);
  const primaryGoalNote =
    typeof record.primaryGoalNote === "string"
      ? record.primaryGoalNote.trim().slice(0, 180)
      : fallback.primaryGoalNote;

  return {
    preferredName:
      typeof record.preferredName === "string"
        ? record.preferredName.trim().slice(0, 60)
        : fallback.preferredName,
    primaryGoalNote,
    goalSelections: normalizeOnboardingStringArray(record.goalSelections),
    mainFriction,
    mainFrictions:
      mainFrictions.length > 0
        ? mainFrictions
        : mainFriction === "unknown"
          ? fallback.mainFrictions
          : [mainFriction],
    motivationStyle,
    motivationStyles:
      motivationStyles.length > 0 ? motivationStyles : [motivationStyle],
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

const assistantPersonalityByTone: Record<AssistantTone, AssistantPersonality> = {
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
  calm: {
    warmth: 0.86,
    humor: 0.18,
    strictness: 0.16,
    motivation: 0.62,
  },
  scientific: {
    warmth: 0.58,
    humor: 0.08,
    strictness: 0.62,
    motivation: 0.72,
  },
};

const communicationStyleByTone: Record<
  AssistantTone,
  AssistantCommunicationStyle
> = {
  gentle: "supportive",
  playful: "energetic",
  focused: "strict",
  calm: "calm",
  scientific: "scientific",
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
  calm: {
    pace: "soft",
    nudgeStyle: "gentle",
    phraseDensity: "short",
  },
  scientific: {
    pace: "direct",
    nudgeStyle: "practical",
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

const getAssistantPersonalityByTone = (
  tone: AssistantTone
): AssistantPersonality => {
  switch (tone) {
    case "playful":
      return assistantPersonalityByTone.playful;
    case "focused":
      return assistantPersonalityByTone.focused;
    case "calm":
      return assistantPersonalityByTone.calm;
    case "scientific":
      return assistantPersonalityByTone.scientific;
    case "gentle":
    default:
      return assistantPersonalityByTone.gentle;
  }
};

const getCommunicationStyleByTone = (
  tone: AssistantTone
): AssistantCommunicationStyle => {
  switch (tone) {
    case "playful":
      return communicationStyleByTone.playful;
    case "focused":
      return communicationStyleByTone.focused;
    case "calm":
      return communicationStyleByTone.calm;
    case "scientific":
      return communicationStyleByTone.scientific;
    case "gentle":
    default:
      return communicationStyleByTone.gentle;
  }
};

const getSpeechStyleByTone = (
  tone: AssistantTone
): Omit<AssistantSpeechStyle, "communicationStyle"> => {
  switch (tone) {
    case "playful":
      return speechStyleByTone.playful;
    case "focused":
      return speechStyleByTone.focused;
    case "calm":
      return speechStyleByTone.calm;
    case "scientific":
      return speechStyleByTone.scientific;
    case "gentle":
    default:
      return speechStyleByTone.gentle;
  }
};

const getGoalMemoryLabel = (goal: Goal): string => {
  switch (goal) {
    case "maintain":
      return goalMemoryLabels.maintain;
    case "bulk":
      return goalMemoryLabels.bulk;
    case "cut":
    default:
      return goalMemoryLabels.cut;
  }
};

const getFrictionMemoryLabel = (friction: AssistantDietFriction): string => {
  switch (friction) {
    case "emotional_eating":
      return frictionMemoryLabels.emotional_eating;
    case "chaotic_schedule":
      return frictionMemoryLabels.chaotic_schedule;
    case "evening_snacking":
      return frictionMemoryLabels.evening_snacking;
    case "low_energy":
      return frictionMemoryLabels.low_energy;
    case "social_pressure":
      return frictionMemoryLabels.social_pressure;
    case "unknown":
    default:
      return frictionMemoryLabels.unknown;
  }
};

const getMotivationMemoryLabel = (
  style: AssistantMotivationStyle
): string => {
  switch (style) {
    case "direct":
      return motivationMemoryLabels.direct;
    case "energetic":
      return motivationMemoryLabels.energetic;
    case "gentle":
    default:
      return motivationMemoryLabels.gentle;
  }
};

const getAssistantName = (assistant: AssistantCustomization) => {
  const trimmedName = assistant.name.trim();
  return trimmedName.length > 0 ? trimmedName : DEFAULT_ASSISTANT_RUNTIME_LABEL;
};

const createAssistantPersonality = (
  assistant: AssistantCustomization
): AssistantPersonality => {
  const base = getAssistantPersonalityByTone(assistant.tone);

  return {
    ...base,
    humor: assistant.humorEnabled ? base.humor : 0,
  };
};

const createAssistantSpeechStyle = (
  assistant: AssistantCustomization
): AssistantSpeechStyle => ({
  communicationStyle: getCommunicationStyleByTone(assistant.tone),
  ...getSpeechStyleByTone(assistant.tone),
});

const deriveAssistantCoreState = ({
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

const deriveAssistantEmotion = (
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

const deriveAssistantRelationshipLevel = ({
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

const createAssistantMemoryProfile = ({
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
  const goals = [
    getGoalMemoryLabel(goal),
    onboarding.primaryGoalNote,
    ...onboarding.goalSelections,
  ].filter(
    (item): item is string => item.trim().length > 0
  );
  const struggles = [
    ...(onboarding.mainFrictions.length > 0
      ? onboarding.mainFrictions.map(getFrictionMemoryLabel)
      : [getFrictionMemoryLabel(onboarding.mainFriction)]),
    onboarding.supportNote,
  ].filter((item): item is string => item.trim().length > 0);
  const habits = [
    userName ? `prefers being called ${userName}` : "",
    ...assistant.assistantMemory.preferences,
  ].filter(
    (item): item is string => item.length > 0
  );
  const motivationTriggers =
    onboarding.motivationStyles.length > 0
      ? onboarding.motivationStyles.map(getMotivationMemoryLabel)
      : [getMotivationMemoryLabel(onboarding.motivationStyle)];

  return {
    userId,
    assistantName: getAssistantName(assistant),
    personality,
    communicationStyle: speechStyle.communicationStyle,
    goals: [...new Set([...goals, ...assistant.assistantMemory.goals])],
    struggles,
    habits,
    motivationTriggers,
    lastMood: emotion,
    recentProblems: assistant.assistantMemory.conversationHighlights,
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
