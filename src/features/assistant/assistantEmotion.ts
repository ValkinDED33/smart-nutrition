import type { AssistantAvatarMood } from "@shared/components/AssistantAvatar";
import type { AssistantContext } from "./assistantContext";
import type {
  AssistantPresence,
  AssistantPresencePriority,
} from "./assistantPresence";

export type AssistantEmotion =
  | "calm"
  | "happy"
  | "coach"
  | "concerned"
  | "celebrate"
  | "focused";

export type AssistantMessageIntent =
  | "guide"
  | "encourage"
  | "warn"
  | "celebrate"
  | "explain"
  | "idle";

export interface AssistantEmotionSignals {
  hasNoMealsToday?: boolean;
  waterBehindTarget?: boolean;
  weightUpdatedToday?: boolean;
  onboardingCompleted?: boolean;
  recentError?: boolean;
  recentSuccess?: boolean;
  userInactive?: boolean;
}

export interface AssistantEmotionState {
  mood: AssistantAvatarMood;
  emotion: AssistantEmotion;
  messageIntent: AssistantMessageIntent;
  priority: AssistantPresencePriority;
}

const lowerPriorityForPresence = (
  priority: AssistantPresencePriority,
  presence: AssistantPresence
): AssistantPresencePriority => {
  if (presence.mode === "hidden") {
    return "low";
  }

  if (presence.mode === "compact" && priority === "high") {
    return "normal";
  }

  if (presence.mode === "compact") {
    return "low";
  }

  return priority;
};

const withPresencePriority = (
  state: AssistantEmotionState,
  presence: AssistantPresence
): AssistantEmotionState => ({
  ...state,
  priority: lowerPriorityForPresence(state.priority, presence),
});

const createEmotionState = (
  state: AssistantEmotionState,
  presence: AssistantPresence
) => withPresencePriority(state, presence);

export const resolveAssistantEmotion = (
  context: AssistantContext,
  presence: AssistantPresence,
  signals: AssistantEmotionSignals = {}
): AssistantEmotionState => {
  if (!presence.visible || presence.mode === "hidden") {
    return createEmotionState(
      {
        mood: "idle",
        emotion: "calm",
        messageIntent: "idle",
        priority: "low",
      },
      presence
    );
  }

  if (signals.recentSuccess) {
    return createEmotionState(
      {
        mood: "celebrate",
        emotion: "celebrate",
        messageIntent: "celebrate",
        priority: "high",
      },
      presence
    );
  }

  if (signals.recentError) {
    return createEmotionState(
      {
        mood: "concerned",
        emotion: "concerned",
        messageIntent: "warn",
        priority: "high",
      },
      presence
    );
  }

  if (context.area === "coach") {
    return createEmotionState(
      {
        mood: "coach",
        emotion: "focused",
        messageIntent: "explain",
        priority: "high",
      },
      presence
    );
  }

  if (
    signals.hasNoMealsToday &&
    (context.area === "meals" || context.area === "home")
  ) {
    return createEmotionState(
      {
        mood: "coach",
        emotion: "coach",
        messageIntent: "guide",
        priority: "high",
      },
      presence
    );
  }

  if (
    signals.waterBehindTarget &&
    (context.area === "water" || context.area === "home")
  ) {
    return createEmotionState(
      {
        mood: "happy",
        emotion: "happy",
        messageIntent: "encourage",
        priority: context.area === "water" ? "high" : "normal",
      },
      presence
    );
  }

  if (signals.weightUpdatedToday) {
    return createEmotionState(
      {
        mood: "happy",
        emotion: "happy",
        messageIntent: "celebrate",
        priority: "normal",
      },
      presence
    );
  }

  if (!signals.onboardingCompleted) {
    return createEmotionState(
      {
        mood: "happy",
        emotion: "calm",
        messageIntent: "guide",
        priority: "normal",
      },
      presence
    );
  }

  if (signals.userInactive) {
    return createEmotionState(
      {
        mood: "coach",
        emotion: "coach",
        messageIntent: "encourage",
        priority: "normal",
      },
      presence
    );
  }

  return createEmotionState(
    {
      mood: context.tone === "urgent" ? "concerned" : "happy",
      emotion: context.tone === "focused" ? "focused" : "calm",
      messageIntent: "idle",
      priority: presence.priority,
    },
    presence
  );
};
