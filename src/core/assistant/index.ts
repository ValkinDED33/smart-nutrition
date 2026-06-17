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
import type { AppLanguage } from "@shared/types/i18n";

export const DEFAULT_ASSISTANT_NAME = "Алекс";

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

export interface AssistantPersonalizationPlan {
  frictionLabel: string;
  motivationLabel: string;
  homeLine: string;
  actionHint: string;
  notificationBody: string;
  recommendationHint: string;
  reportHint: string;
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

export const communicationStyleByTone: Record<
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

const personalizationCopy = {
  uk: {
    friction: {
      unknown: "потрібно краще зрозуміти складні моменти",
      emotional_eating: "емоційне переїдання",
      chaotic_schedule: "хаотичний графік",
      evening_snacking: "вечірні перекуси",
      low_energy: "низька енергія",
      social_pressure: "соціальний тиск",
    },
    motivation: {
      gentle: "м'яка підтримка",
      direct: "пряма відповідальність",
      energetic: "енергійний темп",
    },
    home: {
      unknown: "Я використовую ваші відповіді з онбордингу і буду уточнювати патерни по ходу дня.",
      emotional_eating: "Сьогодні я буду знімати напругу до того, як вона перетвориться на імпульсивний перекус.",
      chaotic_schedule: "Сьогодні фокус на простих діях у правильний момент, бо графік легко розсипається.",
      evening_snacking: "Сьогодні я заздалегідь бережу вечір: білок, вода і спокійний план після вечері.",
      low_energy: "Сьогодні я підказуватиму м'які кроки без перевантаження, щоб енергія не просідала.",
      social_pressure: "Сьогодні я допоможу тримати план гнучким, навіть якщо поруч чужі вибори й темп.",
    },
    action: {
      gentle: "Почнемо без тиску: один маленький крок уже корисний.",
      direct: "Обираємо дію і закриваємо її зараз.",
      energetic: "Беремо швидкий імпульс і рухаємо день вперед.",
    },
    notification: {
      gentle: "Один точний запис, одна порція води і трохи доброти до себе вже роблять день керованим.",
      direct: "Один точний запис, одна порція води і один білковий прийом. Закрийте базу без відкладання.",
      energetic: "Один запис, одна вода, один білковий рух — і день знову у ваших руках.",
    },
    recommendation: {
      unknown: "Порада враховує ваші відповіді з онбордингу і стане точнішою з новими логами.",
      emotional_eating: "Тому рекомендація зменшує ризик імпульсивного вибору: ситість, простота і без різких заборон.",
      chaotic_schedule: "Тому рекомендація коротка і швидка: її легко виконати навіть у нерівному графіку.",
      evening_snacking: "Тому рекомендація захищає вечірній слот і зменшує шанс пізнього перекусу.",
      low_energy: "Тому рекомендація не вимагає складної готовки і підтримує рівну енергію.",
      social_pressure: "Тому рекомендація лишає гнучкість для соціальних ситуацій без втрати плана.",
    },
    report: {
      unknown: "У звітах я буду показувати, які патерни повторюються і що варто уточнити.",
      emotional_eating: "У звітах я буду окремо відмічати вечори, паузи між прийомами і тригери переїдання.",
      chaotic_schedule: "У звітах я буду виділяти пропущені слоти і час, коли логування найчастіше зривається.",
      evening_snacking: "У звітах я буду стежити за вечірнім білком, калоріями після вечері і ритмом сну.",
      low_energy: "У звітах я буду дивитись, чи вистачає калорій, води і регулярності для енергії.",
      social_pressure: "У звітах я буду підсвічувати дні з відхиленнями, щоб план лишався соціально реалістичним.",
    },
  },
  pl: {
    friction: {
      unknown: "trzeba lepiej poznać trudne momenty",
      emotional_eating: "jedzenie emocjonalne",
      chaotic_schedule: "chaotyczny grafik",
      evening_snacking: "wieczorne podjadanie",
      low_energy: "niska energia",
      social_pressure: "presja społeczna",
    },
    motivation: {
      gentle: "łagodne wsparcie",
      direct: "bezpośrednia odpowiedzialność",
      energetic: "energiczne tempo",
    },
    home: {
      unknown: "Korzystam z odpowiedzi z onboardingu i będę doprecyzowywać wzorce w trakcie dnia.",
      emotional_eating: "Dziś zdejmuję napięcie zanim zamieni się w impulsywną przekąskę.",
      chaotic_schedule: "Dziś liczą się proste ruchy we właściwym momencie, bo grafik łatwo się rozsypuje.",
      evening_snacking: "Dziś zawczasu chronię wieczór: białko, woda i spokojny plan po kolacji.",
      low_energy: "Dziś podpowiadam łagodne kroki bez przeciążenia, żeby energia nie spadała.",
      social_pressure: "Dziś pomagam trzymać plan elastycznie, nawet gdy obok są cudze wybory i tempo.",
    },
    action: {
      gentle: "Zaczynamy bez presji: jeden mały krok już pomaga.",
      direct: "Wybieramy działanie i domykamy je teraz.",
      energetic: "Bierzemy szybki impuls i pchamy dzień do przodu.",
    },
    notification: {
      gentle: "Jeden dokładny wpis, jedna porcja wody i trochę życzliwości do siebie już porządkują dzień.",
      direct: "Jeden dokładny wpis, jedna porcja wody i jeden białkowy posiłek. Domknij bazę bez odkładania.",
      energetic: "Jeden wpis, jedna woda, jeden białkowy ruch — i dzień wraca w Twoje ręce.",
    },
    recommendation: {
      unknown: "Podpowiedź korzysta z odpowiedzi z onboardingu i będzie ostrzejsza z kolejnymi logami.",
      emotional_eating: "Dlatego rekomendacja zmniejsza ryzyko impulsu: sytość, prostota i bez ostrych zakazów.",
      chaotic_schedule: "Dlatego rekomendacja jest krótka i szybka: da się ją wykonać nawet w nierównym grafiku.",
      evening_snacking: "Dlatego rekomendacja chroni wieczorny slot i zmniejsza szansę późnego podjadania.",
      low_energy: "Dlatego rekomendacja nie wymaga złożonego gotowania i wspiera równą energię.",
      social_pressure: "Dlatego rekomendacja zostawia elastyczność na sytuacje społeczne bez gubienia planu.",
    },
    report: {
      unknown: "W raportach pokażę, które wzorce się powtarzają i co warto doprecyzować.",
      emotional_eating: "W raportach osobno oznaczę wieczory, przerwy między posiłkami i wyzwalacze objadania.",
      chaotic_schedule: "W raportach wyróżnię pominięte sloty i pory, w których logowanie najczęściej wypada.",
      evening_snacking: "W raportach sprawdzę wieczorne białko, kalorie po kolacji i rytm końca dnia.",
      low_energy: "W raportach sprawdzę, czy kalorie, woda i regularność wspierają energię.",
      social_pressure: "W raportach podświetlę dni z odchyleniami, żeby plan pozostał społecznie realny.",
    },
  },
  en: {
    friction: {
      unknown: "needs more discovery around hard moments",
      emotional_eating: "emotional eating",
      chaotic_schedule: "chaotic schedule",
      evening_snacking: "evening snacking",
      low_energy: "low energy",
      social_pressure: "social pressure",
    },
    motivation: {
      gentle: "gentle support",
      direct: "direct accountability",
      energetic: "energetic momentum",
    },
    home: {
      unknown: "I use your onboarding answers and will sharpen the pattern as the day unfolds.",
      emotional_eating: "Today I will lower tension before it turns into an impulsive snack.",
      chaotic_schedule: "Today is about simple moves at the right moment, because your schedule can scatter.",
      evening_snacking: "Today I am protecting the evening early: protein, water, and a calm plan after dinner.",
      low_energy: "Today I will suggest gentle steps without overload so your energy does not dip.",
      social_pressure: "Today I will keep the plan flexible around other people's choices and pace.",
    },
    action: {
      gentle: "Start without pressure: one small step already helps.",
      direct: "Pick the action and close it now.",
      energetic: "Take the quick spark and move the day forward.",
    },
    notification: {
      gentle: "One accurate log, one water serving, and a little self-kindness already make the day manageable.",
      direct: "One accurate log, one water serving, and one protein meal. Close the basics without delay.",
      energetic: "One log, one water, one protein move, and the day is back in your hands.",
    },
    recommendation: {
      unknown: "This tip uses your onboarding answers and will get sharper with more logs.",
      emotional_eating: "So this recommendation lowers impulse risk: satiety, simplicity, and no harsh bans.",
      chaotic_schedule: "So this recommendation stays short and fast enough for an uneven schedule.",
      evening_snacking: "So this recommendation protects the evening slot and lowers late-snack risk.",
      low_energy: "So this recommendation avoids complex prep and supports steadier energy.",
      social_pressure: "So this recommendation leaves room for social situations without losing the plan.",
    },
    report: {
      unknown: "In reports, I will show repeating patterns and what we should clarify next.",
      emotional_eating: "In reports, I will flag evenings, long meal gaps, and overeating triggers separately.",
      chaotic_schedule: "In reports, I will highlight missed slots and the times logging most often breaks.",
      evening_snacking: "In reports, I will watch evening protein, calories after dinner, and end-of-day rhythm.",
      low_energy: "In reports, I will check whether calories, water, and regularity support your energy.",
      social_pressure: "In reports, I will surface drift days so the plan stays socially realistic.",
    },
  },
} as const;

const getAssistantName = (assistant: AssistantCustomization) => {
  const trimmedName = assistant.name.trim();
  return trimmedName.length > 0 ? trimmedName : DEFAULT_ASSISTANT_NAME;
};

export const buildAssistantPersonalizationPlan = (
  onboarding: AssistantOnboardingProfile,
  language: AppLanguage
): AssistantPersonalizationPlan => {
  const copy = personalizationCopy[language];
  const frictionLabel =
    onboarding.mainFrictions.length > 0
      ? onboarding.mainFrictions.map((friction) => copy.friction[friction]).join(", ")
      : copy.friction[onboarding.mainFriction];
  const motivationLabel =
    onboarding.motivationStyles.length > 0
      ? onboarding.motivationStyles.map((style) => copy.motivation[style]).join(", ")
      : copy.motivation[onboarding.motivationStyle];

  return {
    frictionLabel,
    motivationLabel,
    homeLine: copy.home[onboarding.mainFriction],
    actionHint: copy.action[onboarding.motivationStyle],
    notificationBody: copy.notification[onboarding.motivationStyle],
    recommendationHint: copy.recommendation[onboarding.mainFriction],
    reportHint: copy.report[onboarding.mainFriction],
  };
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
  const goals = [
    goalMemoryLabels[goal],
    onboarding.primaryGoalNote,
    ...onboarding.goalSelections,
  ].filter(
    (item): item is string => item.trim().length > 0
  );
  const struggles = [
    ...(onboarding.mainFrictions.length > 0
      ? onboarding.mainFrictions.map((friction) => frictionMemoryLabels[friction])
      : [frictionMemoryLabels[onboarding.mainFriction]]),
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
      ? onboarding.motivationStyles.map((style) => motivationMemoryLabels[style])
      : [motivationMemoryLabels[onboarding.motivationStyle]];

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
