import { AssistantApiError, createId } from "../../lib/domain.mjs";
import { callAiProvider } from "./providers/index.mjs";
import { normalizeText } from "./ai.shared.mjs";

const assistantFollowUps = {
  day_status: ["protein_help", "water_help"],
  protein_help: ["next_meal", "day_status"],
  water_help: ["day_status", "weight_help"],
  weight_help: ["coach_focus", "water_help"],
  next_meal: ["protein_help", "day_status"],
  coach_focus: ["protein_help", "weight_help"],
  motivation_focus: ["coach_focus", "day_status"],
};

const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toFiniteNumber = (value, fallback = 0) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
};

const AI_USAGE_ROUTE = "ai.ask";

const emptyUsageSummary = {
  requestCount: 0,
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  estimatedCostUsd: 0,
};

const toNonNegativeInteger = (value, fallback = 0) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? Math.max(Math.round(nextValue), 0) : fallback;
};

const toPositiveInteger = (value, fallback) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) && nextValue > 0 ? Math.round(nextValue) : fallback;
};

const toNonNegativeNumber = (value, fallback = 0) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) && nextValue >= 0 ? nextValue : fallback;
};

const normalizeUsageSummary = (value) => ({
  requestCount: toNonNegativeInteger(value?.requestCount),
  promptTokens: toNonNegativeInteger(value?.promptTokens),
  completionTokens: toNonNegativeInteger(value?.completionTokens),
  totalTokens: toNonNegativeInteger(value?.totalTokens),
  estimatedCostUsd: toNonNegativeNumber(value?.estimatedCostUsd),
});

const getAiGuardConfig = (config) => ({
  dailyRequestLimit: toPositiveInteger(config.aiDailyRequestLimit, 40),
  monthlyRequestLimit: toPositiveInteger(config.aiMonthlyRequestLimit, 600),
  dailyTokenLimit: toPositiveInteger(config.aiDailyTokenLimit, 60_000),
  monthlyTokenLimit: toPositiveInteger(config.aiMonthlyTokenLimit, 800_000),
  requestCooldownMs: toNonNegativeInteger(config.aiRequestCooldownMs, 6_000),
  estimatedUsdPer1kTokens: toNonNegativeNumber(config.aiEstimatedUsdPer1kTokens, 0.002),
});

const getUtcWindowStartIso = (windowName) => {
  const value = new Date();

  value.setUTCHours(0, 0, 0, 0);

  if (windowName === "month") {
    value.setUTCDate(1);
  }

  return value.toISOString();
};

const assistantAbusePatterns = [
  {
    reason: "prompt_injection",
    pattern: /\b(ignore|disregard|forget|override)\b[\s\S]{0,120}\b(previous|system|developer|instructions?)\b/i,
  },
  {
    reason: "secret_exfiltration",
    pattern: /\b(system prompt|developer message|api key|jwt secret|environment variables?|credentials?|secrets?)\b/i,
  },
  {
    reason: "jailbreak",
    pattern: /\b(jailbreak|dan mode|bypass (?:the )?(?:safety|policy|guardrails?))\b/i,
  },
];

const detectAssistantAbuse = (question) => {
  const normalizedQuestion = String(question ?? "");
  return assistantAbusePatterns.find((item) => item.pattern.test(normalizedQuestion)) ?? null;
};

const estimateTokens = (value) => {
  const text = String(value ?? "").trim();
  return text ? Math.max(Math.ceil(text.length / 4), 1) : 0;
};

const estimatePromptTokens = ({ question, quickQuestionId, context, history }) =>
  estimateTokens(
    JSON.stringify({
      question,
      quickQuestionId,
      context,
      history: Array.isArray(history)
        ? history.map((message) => ({
            role: message?.role,
            text: message?.text,
          }))
        : [],
    })
  );

const normalizeQuickQuestionId = (value) =>
  value === "day_status" ||
  value === "protein_help" ||
  value === "water_help" ||
  value === "weight_help" ||
  value === "next_meal" ||
  value === "coach_focus" ||
  value === "motivation_focus"
    ? value
    : null;

const normalizeInteractionChannel = (value) => {
  const normalized = normalizeText(value, { maxLength: 40 }).toLowerCase();

  if (normalized === "telegram") {
    return "telegram";
  }

  if (normalized === "mobile" || normalized === "capacitor" || normalized === "native") {
    return "mobile";
  }

  return "web";
};

const normalizePersonalDetails = (value) => {
  const record = isRecord(value) ? value : {};
  const readOption = (nextValue, allowedValues, fallback) =>
    allowedValues.includes(nextValue) ? nextValue : fallback;

  return {
    bloodGroup: readOption(
      record.bloodGroup,
      [
        "unknown",
        "o_positive",
        "o_negative",
        "a_positive",
        "a_negative",
        "b_positive",
        "b_negative",
        "ab_positive",
        "ab_negative",
      ],
      "unknown"
    ),
    eyeColor: readOption(
      record.eyeColor,
      ["unknown", "brown", "blue", "green", "gray", "hazel", "amber", "other"],
      "unknown"
    ),
    relationshipStatus: readOption(
      record.relationshipStatus,
      ["single", "dating", "married", "complicated", "prefer_not"],
      "prefer_not"
    ),
    supportSystem: readOption(
      record.supportSystem,
      [
        "self",
        "partner_supports",
        "partner_neutral",
        "family_friends",
        "low_support",
        "prefer_not",
      ],
      "self"
    ),
    petCompanion: readOption(
      record.petCompanion,
      ["none", "cat", "dog", "cat_and_dog", "other"],
      "none"
    ),
  };
};

const normalizeGender = (value, fallback = null) => {
  if (value === "male" || value === "female") {
    return value;
  }

  return fallback === "male" || fallback === "female" ? fallback : null;
};

const normalizeIsoDateOrNull = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
};

const normalizePregnancyWeek = (value) => {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return null;
  }

  const rounded = Math.round(numberValue);

  return rounded >= 1 && rounded <= 42 ? rounded : null;
};

const normalizeWomenHealth = (value, gender) => {
  const record = isRecord(value) ? value : {};
  const allowedModes = ["none", "trying_to_conceive", "pregnant", "postpartum"];
  const mode =
    gender === "female" && allowedModes.includes(record.mode) ? record.mode : "none";
  const symptomHistory = Array.isArray(record.symptomHistory)
    ? record.symptomHistory
        .filter(isRecord)
        .map((entry) => ({
          recordedAt: normalizeIsoDateOrNull(entry.recordedAt),
          label: normalizeText(entry.label, { maxLength: 80, fallback: "" }),
          severity: Math.max(1, Math.min(Math.round(toFiniteNumber(entry.severity) || 1), 10)),
          note: normalizeText(entry.note, { maxLength: 180, fallback: "" }),
          source: entry.source === "assistant" ? "assistant" : "manual",
        }))
        .filter((entry) => entry.recordedAt && entry.label)
        .slice(-10)
    : [];

  return {
    mode,
    pregnancyWeek: mode === "pregnant" ? normalizePregnancyWeek(record.pregnancyWeek) : null,
    dueDate: mode === "pregnant" ? normalizeIsoDateOrNull(record.dueDate) : null,
    lastPeriodStartDate:
      mode === "pregnant" || mode === "trying_to_conceive"
        ? normalizeIsoDateOrNull(record.lastPeriodStartDate)
        : null,
    doctorConfirmed:
      mode === "pregnant" || mode === "trying_to_conceive"
        ? Boolean(record.doctorConfirmed)
        : false,
    notes: normalizeText(record.notes, { maxLength: 220, fallback: "" }),
    symptomHistory,
  };
};

const normalizeDailyContextDay = (value) => {
  const record = isRecord(value) ? value : {};

  return {
    dateKey: normalizeText(record.dateKey, { maxLength: 16 }),
    entries: Math.max(Math.round(toFiniteNumber(record.entries)), 0),
    mealTypes: Array.isArray(record.mealTypes)
      ? record.mealTypes.map((item) => normalizeText(item, { maxLength: 24 })).filter(Boolean)
      : [],
    calories: toFiniteNumber(record.calories),
    protein: toFiniteNumber(record.protein),
    fat: toFiniteNumber(record.fat),
    carbs: toFiniteNumber(record.carbs),
    fiber: toFiniteNumber(record.fiber),
  };
};

const normalizeDailyContext = (value) => {
  const record = isRecord(value) ? value : {};
  const gaps = isRecord(record.gaps) ? record.gaps : {};
  const week = isRecord(record.week) ? record.week : {};

  return {
    today: normalizeDailyContextDay(record.today),
    yesterday: normalizeDailyContextDay(record.yesterday),
    week: {
      daysLogged: Math.max(Math.round(toFiniteNumber(week.daysLogged)), 0),
      averageCalories: toFiniteNumber(week.averageCalories),
      averageProtein: toFiniteNumber(week.averageProtein),
      averageFiber: toFiniteNumber(week.averageFiber),
      averageEntries: toFiniteNumber(week.averageEntries),
    },
    gaps: {
      calories: toFiniteNumber(gaps.calories),
      protein: toFiniteNumber(gaps.protein),
      fiber: toFiniteNumber(gaps.fiber),
      waterMl: toFiniteNumber(gaps.waterMl),
    },
    primaryFocus: normalizeText(record.primaryFocus, {
      maxLength: 32,
      fallback: "steady",
    }),
    suggestedMealType: normalizeText(record.suggestedMealType, {
      maxLength: 24,
      fallback: "snack",
    }),
    patterns: Array.isArray(record.patterns)
      ? record.patterns.map((item) => normalizeText(item, { maxLength: 40 })).filter(Boolean)
      : [],
    nudgeTone: normalizeText(record.nudgeTone, { maxLength: 24, fallback: "gentle" }),
  };
};

const countOpenTasks = (motivation) =>
  Array.isArray(motivation?.activeTasks)
    ? motivation.activeTasks.filter(
        (task) => !task?.completedAt && !task?.skippedWithDayOffAt
      ).length
    : 0;

const normalizeLanguage = (value) => {
  if (value === "en") {
    return "en";
  }

  return value === "pl" ? "pl" : "uk";
};

const normalizeScreenId = (value) => {
  const normalized = normalizeText(value, {
    maxLength: 32,
    fallback: "unknown",
  });

  return [
    "dashboard",
    "food",
    "recipes",
    "community",
    "progress",
    "profile",
    "coach",
    "admin",
    "water",
    "unknown",
  ].includes(normalized)
    ? normalized
    : "unknown";
};

const toScore = (value, fallback) => {
  const nextValue = Number(value);

  if (!Number.isFinite(nextValue)) {
    return fallback;
  }

  return Math.min(Math.max(Number(nextValue.toFixed(2)), 0), 1);
};

const inferAssistantPersonality = (tone) => {
  if (tone === "focused") {
    return {
      warmth: 0.55,
      humor: 0.15,
      strictness: 0.75,
      motivation: 0.82,
    };
  }

  if (tone === "playful") {
    return {
      warmth: 0.86,
      humor: 0.72,
      strictness: 0.22,
      motivation: 0.9,
    };
  }

  if (tone === "calm") {
    return {
      warmth: 0.86,
      humor: 0.18,
      strictness: 0.16,
      motivation: 0.62,
    };
  }

  if (tone === "scientific") {
    return {
      warmth: 0.58,
      humor: 0.08,
      strictness: 0.62,
      motivation: 0.72,
    };
  }

  return {
    warmth: 0.9,
    humor: 0.36,
    strictness: 0.18,
    motivation: 0.78,
  };
};

const normalizeAssistantPersonality = (value, fallback) => {
  const record = isRecord(value) ? value : {};

  return {
    warmth: toScore(record.warmth, fallback.warmth),
    humor: toScore(record.humor, fallback.humor),
    strictness: toScore(record.strictness, fallback.strictness),
    motivation: toScore(record.motivation, fallback.motivation),
  };
};

const inferCommunicationStyle = (tone) => {
  if (tone === "focused") {
    return "strict";
  }

  if (tone === "playful") {
    return "energetic";
  }

  if (tone === "calm") {
    return "calm";
  }

  if (tone === "scientific") {
    return "scientific";
  }

  return "supportive";
};

const toUniqueList = (...sources) =>
  [
    ...new Set(
      sources
        .flatMap((source) => (Array.isArray(source) ? source : source ? [source] : []))
        .map((item) => normalizeText(item, { maxLength: 80 }))
        .filter(Boolean)
    ),
  ].slice(0, 8);

const normalizeIncomingAssistantMemory = (
  value,
  fallbackPersonality = inferAssistantPersonality("gentle")
) => {
  const record = isRecord(value) ? value : {};

  return {
    personality: normalizeAssistantPersonality(record.personality, fallbackPersonality),
    goals: toUniqueList(record.goals),
    struggles: toUniqueList(record.struggles),
    habits: toUniqueList(record.habits),
    motivationTriggers: toUniqueList(record.motivationTriggers),
    lastMood: normalizeText(record.lastMood, { maxLength: 40, fallback: "" }) || null,
    recentProblems: toUniqueList(record.recentProblems),
  };
};

const normalizePromptContext = (value, fallbackPath = "/") => {
  const record = isRecord(value) ? value : {};
  const defaultAction = isRecord(record.defaultAction)
    ? {
        label: normalizeText(record.defaultAction.label, {
          maxLength: 80,
          fallback: "",
        }),
        route: normalizeText(record.defaultAction.route, {
          maxLength: 120,
          fallback: "",
        }),
      }
    : null;
  const capabilities = Array.isArray(record.capabilities)
    ? record.capabilities
        .filter(isRecord)
        .slice(0, 8)
        .map((capability) => ({
          id: normalizeText(capability.id, { maxLength: 80, fallback: "unknown" }),
          area: normalizeText(capability.area, { maxLength: 40, fallback: "unknown" }),
          duties: toUniqueList(capability.duties).slice(0, 8),
          description: normalizeText(capability.description, {
            maxLength: 220,
            fallback: "",
          }),
          entryRoute: normalizeText(capability.entryRoute, {
            maxLength: 120,
            fallback: "",
          }) || null,
        }))
    : [];

  return {
    area: normalizeText(record.area, { maxLength: 40, fallback: "unknown" }),
    screenName: normalizeText(record.screenName, {
      maxLength: 80,
      fallback: "Unknown",
    }),
    duties: toUniqueList(record.duties).slice(0, 12),
    tone: normalizeText(record.tone, { maxLength: 40, fallback: "supportive" }),
    capabilities,
    defaultAction:
      defaultAction?.label && defaultAction.route ? defaultAction : null,
    currentRoute: normalizeText(record.currentRoute, {
      maxLength: 120,
      fallback: fallbackPath,
    }),
    summary: normalizeText(record.summary, {
      maxLength: 400,
      fallback: "",
    }),
  };
};

const createContextualAssistantMemory = ({ currentUser, context, storedMemory }) => {
  const incomingMemory = normalizeIncomingAssistantMemory(
    context.memory,
    context.assistantPersonality
  );
  const proteinGap =
    context.proteinTarget > 0 && context.proteinConsumed < context.proteinTarget * 0.75;
  const waterGap =
    context.waterTargetMl > 0 && context.waterConsumedMl < context.waterTargetMl * 0.55;
  const calorieOvershoot = context.dailyCalories > 0 && context.caloriesRemaining < -150;
  const recentProblems = [
    proteinGap ? "protein_gap" : null,
    waterGap ? "water_gap" : null,
    calorieOvershoot ? "calorie_overshoot" : null,
  ].filter(Boolean);

  return {
    userId: currentUser.id,
    assistantName: context.assistantName,
    personality: normalizeAssistantPersonality(
      storedMemory?.personality ?? incomingMemory.personality,
      context.assistantPersonality
    ),
    communicationStyle:
      normalizeText(storedMemory?.communicationStyle, {
        maxLength: 40,
        fallback: context.communicationStyle,
      }) || context.communicationStyle,
    goals: toUniqueList(storedMemory?.goals, incomingMemory.goals, context.goal),
    struggles: toUniqueList(storedMemory?.struggles, incomingMemory.struggles),
    habits: toUniqueList(
      storedMemory?.habits,
      incomingMemory.habits,
      context.mealEntriesToday > 0 ? "logs_meals" : null,
      context.waterConsumedMl > 0 ? "tracks_water" : null
    ),
    motivationTriggers: toUniqueList(
      storedMemory?.motivationTriggers,
      incomingMemory.motivationTriggers,
      context.motivation.level > 1 ? "progress_points" : null
    ),
    lastMood:
      normalizeText(incomingMemory.lastMood ?? storedMemory?.lastMood, {
        maxLength: 40,
        fallback: "",
      }) || null,
    recentProblems: toUniqueList(
      storedMemory?.recentProblems,
      incomingMemory.recentProblems,
      recentProblems
    ),
  };
};

const normalizeContext = (payload, currentUser) => {
  const record = isRecord(payload) ? payload : {};
  const coach = isRecord(record.coach) ? record.coach : {};
  const motivation = isRecord(record.motivation) ? record.motivation : {};
  const gender = normalizeGender(record.gender, currentUser.gender);
  const assistantTone = normalizeText(record.assistantTone, {
    maxLength: 24,
    fallback: "gentle",
  });
  const assistantPersonality = normalizeAssistantPersonality(
    record.assistantPersonality,
    inferAssistantPersonality(assistantTone)
  );
  const communicationStyle = normalizeText(record.communicationStyle, {
    maxLength: 40,
    fallback: inferCommunicationStyle(assistantTone),
  });
  const currentPath = normalizeText(record.currentPath, {
    maxLength: 120,
    fallback: "/",
  });

  return {
    language: normalizeLanguage(record.language),
    screen: normalizeScreenId(record.screen),
    currentPath,
    interactionChannel: normalizeInteractionChannel(
      record.interactionChannel ?? record.channel ?? record.uiMode
    ),
    gender,
    userName: normalizeText(record.userName, {
      maxLength: 60,
      fallback: currentUser.name ?? "User",
    }),
    goal: normalizeText(record.goal, {
      maxLength: 24,
      fallback: currentUser.goal ?? "maintain",
    }),
    dailyCalories: toFiniteNumber(record.dailyCalories),
    caloriesConsumed: toFiniteNumber(record.caloriesConsumed),
    caloriesRemaining: toFiniteNumber(record.caloriesRemaining),
    proteinConsumed: toFiniteNumber(record.proteinConsumed),
    proteinTarget: toFiniteNumber(record.proteinTarget),
    fatConsumed: toFiniteNumber(record.fatConsumed),
    carbsConsumed: toFiniteNumber(record.carbsConsumed),
    mealEntriesToday: Math.max(Math.round(toFiniteNumber(record.mealEntriesToday)), 0),
    waterConsumedMl: Math.max(Math.round(toFiniteNumber(record.waterConsumedMl)), 0),
    waterTargetMl: Math.max(Math.round(toFiniteNumber(record.waterTargetMl)), 0),
    latestWeight: toFiniteNumber(record.latestWeight, currentUser.weight ?? 0),
    weightChangeKg: toFiniteNumber(record.weightChangeKg),
    weeklyCheckInDue: Boolean(record.weeklyCheckInDue),
    assistantName: normalizeText(record.assistantName, {
      maxLength: 40,
      fallback: "Smart Nutrition companion",
    }),
    assistantRole: normalizeText(record.assistantRole, {
      maxLength: 24,
      fallback: "assistant",
    }),
    assistantTone,
    humorEnabled: Boolean(record.humorEnabled),
    assistantPersonality,
    communicationStyle,
    personalDetails: normalizePersonalDetails(record.personalDetails),
    womenHealth: normalizeWomenHealth(record.womenHealth, gender),
    dailyContext: normalizeDailyContext(record.dailyContext),
    coachPrimaryInsight: normalizeText(record.coachPrimaryInsight, {
      maxLength: 40,
      fallback: "on_track",
    }),
    coach: {
      score: Math.max(Math.round(toFiniteNumber(coach.score)), 0),
      status: normalizeText(coach.status, { maxLength: 24, fallback: "steady" }),
      daysLogged: Math.max(Math.round(toFiniteNumber(coach.daysLogged)), 0),
      averageCalories: toFiniteNumber(coach.averageCalories),
      averageProtein: toFiniteNumber(coach.averageProtein),
      averageWater: toFiniteNumber(coach.averageWater),
      averageFiber: toFiniteNumber(coach.averageFiber),
      averageMeals: toFiniteNumber(coach.averageMeals),
      breakfastSkippedDays: Math.max(Math.round(toFiniteNumber(coach.breakfastSkippedDays)), 0),
      calorieTarget: toFiniteNumber(coach.calorieTarget),
      proteinTarget: toFiniteNumber(coach.proteinTarget),
      waterTarget: toFiniteNumber(coach.waterTarget),
      fiberTarget: toFiniteNumber(coach.fiberTarget),
      weightChange: toFiniteNumber(coach.weightChange),
    },
    motivation: {
      points: Math.max(Math.round(toFiniteNumber(motivation.points)), 0),
      level: Math.max(Math.round(toFiniteNumber(motivation.level, 1)), 1),
      completedTasks: Math.max(Math.round(toFiniteNumber(motivation.completedTasks)), 0),
      openTasks: countOpenTasks(motivation),
    },
    profile: {
      goal: normalizeText(record.goal, {
        maxLength: 24,
        fallback: currentUser.goal ?? "maintain",
      }),
      gender,
      dietStyle: normalizeText(record.dietStyle, { maxLength: 24, fallback: "balanced" }),
      latestWeight: toFiniteNumber(record.latestWeight, currentUser.weight ?? 0),
      weeklyCheckInDue: Boolean(record.weeklyCheckInDue),
    },
    nutritionState: {
      dailyCalories: toFiniteNumber(record.dailyCalories),
      caloriesConsumed: toFiniteNumber(record.caloriesConsumed),
      caloriesRemaining: toFiniteNumber(record.caloriesRemaining),
      proteinConsumed: toFiniteNumber(record.proteinConsumed),
      proteinTarget: toFiniteNumber(record.proteinTarget),
      fatConsumed: toFiniteNumber(record.fatConsumed),
      carbsConsumed: toFiniteNumber(record.carbsConsumed),
      waterConsumedMl: Math.max(Math.round(toFiniteNumber(record.waterConsumedMl)), 0),
      waterTargetMl: Math.max(Math.round(toFiniteNumber(record.waterTargetMl)), 0),
    },
    behavior: {
      mealEntriesToday: Math.max(Math.round(toFiniteNumber(record.mealEntriesToday)), 0),
      waterLoggedToday: Math.max(Math.round(toFiniteNumber(record.waterConsumedMl)), 0) > 0,
      openMotivationTasks: countOpenTasks(motivation),
      completedMotivationTasks: Math.max(
        Math.round(toFiniteNumber(motivation.completedTasks)),
        0
      ),
    },
    memory: normalizeIncomingAssistantMemory(record.memory, assistantPersonality),
    promptContext: normalizePromptContext(record.promptContext, currentPath),
  };
};

const inferProviderIdFromBaseUrl = (baseUrl) => {
  const normalizedBaseUrl = String(baseUrl ?? "").toLowerCase();

  if (normalizedBaseUrl.includes("openrouter.ai")) {
    return "openrouter";
  }

  if (normalizedBaseUrl.includes("api.groq.com")) {
    return "groq";
  }

  if (normalizedBaseUrl.includes("generativelanguage.googleapis.com")) {
    return "google";
  }

  if (normalizedBaseUrl.includes("api.openai.com")) {
    return "openai";
  }

  return "custom";
};

const getProviderLabel = (providerId) => {
  if (providerId === "openrouter") {
    return "OpenRouter";
  }

  if (providerId === "groq") {
    return "Groq";
  }

  if (providerId === "google") {
    return "Google AI Studio";
  }

  if (providerId === "openai") {
    return "OpenAI";
  }

  return "Custom OpenAI-compatible";
};

const buildConfiguredProviderList = (config) => {
  if (Array.isArray(config.assistantProviders) && config.assistantProviders.length > 0) {
    return config.assistantProviders;
  }

  if (!config.assistantRuntimeConfigured || !config.assistantApiKey || !config.assistantModel) {
    return [];
  }

  const providerId = inferProviderIdFromBaseUrl(config.assistantBaseUrl);

  return [
    {
      id: providerId,
      label: getProviderLabel(providerId),
      apiKey: config.assistantApiKey,
      model: config.assistantModel,
      baseUrl: config.assistantBaseUrl,
      apiPath: config.assistantApiPath,
      timeoutMs: config.assistantTimeoutMs,
      temperature: config.assistantTemperature,
      httpReferer: null,
      title: providerId === "openrouter" ? "Smart Nutrition" : null,
    },
  ];
};

const createProviderState = () => ({
  lastAttemptedAtMs: null,
  lastSuccessAtMs: null,
  lastFailureAtMs: null,
  consecutiveFailures: 0,
  lastError: null,
  lastErrorCode: null,
  lastErrorStatus: null,
});

const toIsoString = (value) => (value ? new Date(value).toISOString() : null);

const formatProviderErrorForState = (error) => {
  if (error instanceof AssistantApiError) {
    return {
      message: normalizeText(error.details?.providerMessage ?? error.message, {
        maxLength: 240,
        fallback: error.message,
      }),
      code: error.code,
      status: error.details?.status ?? null,
    };
  }

  if (error instanceof Error) {
    return {
      message: normalizeText(error.message, { maxLength: 240, fallback: "Unknown error" }),
      code: "ASSISTANT_RUNTIME_FAILED",
      status: null,
    };
  }

  return {
    message: "Unknown error",
    code: "ASSISTANT_RUNTIME_FAILED",
    status: null,
  };
};

const toProviderFailureSummary = (provider, error) => {
  const formattedError = formatProviderErrorForState(error);

  return {
    providerId: provider.id,
    providerLabel: provider.label,
    model: provider.model,
    baseUrl: provider.baseUrl,
    status: formattedError.status,
    code: formattedError.code,
    message: formattedError.message,
  };
};

export const createAiService = ({
  aiRepository,
  assistantMemoryRepository = null,
  assistantAgent = null,
  config,
}) => {
  const configuredProviders = buildConfiguredProviderList(config);
  const providerRuntimeState = new Map(
    configuredProviders.map((provider) => [provider.id, createProviderState()])
  );
  const retryCooldownMs = Math.max(Number(config.assistantRetryCooldownMs) || 0, 0);
  const aiGuard = getAiGuardConfig(config);
  const debugLoggingEnabled = Boolean(config.aiDebugLogging);
  const debugLog = (...args) => {
    if (debugLoggingEnabled) {
      console.log(...args);
    }
  };
  const debugError = (...args) => {
    if (debugLoggingEnabled) {
      console.error(...args);
    }
  };

  const getHistoryLimit = (limit) =>
    Math.min(
      Math.max(Number(limit) || config.assistantMemoryMessageLimit, 1),
      config.assistantMemoryMessageLimit
    );

  const getProviderState = (providerId) => {
    if (!providerRuntimeState.has(providerId)) {
      providerRuntimeState.set(providerId, createProviderState());
    }

    return providerRuntimeState.get(providerId);
  };

  const markProviderAttempt = (provider) => {
    const state = getProviderState(provider.id);
    state.lastAttemptedAtMs = Date.now();
  };

  const markProviderSuccess = (provider) => {
    const state = getProviderState(provider.id);
    const now = Date.now();

    state.lastAttemptedAtMs = now;
    state.lastSuccessAtMs = now;
    state.consecutiveFailures = 0;
    state.lastError = null;
    state.lastErrorCode = null;
    state.lastErrorStatus = null;
  };

  const markProviderFailure = (provider, error) => {
    const state = getProviderState(provider.id);
    const now = Date.now();
    const formattedError = formatProviderErrorForState(error);

    state.lastAttemptedAtMs = now;
    state.lastFailureAtMs = now;
    state.consecutiveFailures += 1;
    state.lastError = formattedError.message;
    state.lastErrorCode = formattedError.code;
    state.lastErrorStatus = formattedError.status;
  };

  const isProviderCoolingDown = (provider, now = Date.now()) => {
    const state = getProviderState(provider.id);

    if (!state.lastFailureAtMs || state.consecutiveFailures === 0 || retryCooldownMs <= 0) {
      return false;
    }

    return state.lastFailureAtMs + retryCooldownMs > now;
  };

  const calculateEstimatedCostUsd = (totalTokens) =>
    Number(((toNonNegativeInteger(totalTokens) / 1000) * aiGuard.estimatedUsdPer1kTokens).toFixed(6));

  const getUsageSummary = async (currentUser, windowName) => {
    if (!aiRepository.getUsageSummary) {
      return emptyUsageSummary;
    }

    return normalizeUsageSummary(
      await aiRepository.getUsageSummary({
        userId: currentUser.id,
        sinceIso: getUtcWindowStartIso(windowName),
        route: AI_USAGE_ROUTE,
      })
    );
  };

  const recordAiUsageEvent = async (
    currentUser,
    {
      eventType,
      promptTokens = 0,
      completionTokens = 0,
      providerId = null,
      blockedReason = null,
      details = {},
    }
  ) => {
    const createdAt = new Date().toISOString();
    const usageEventId = createId("ai-usage");
    const normalizedPromptTokens = toNonNegativeInteger(promptTokens);
    const normalizedCompletionTokens = toNonNegativeInteger(completionTokens);
    const totalTokens = normalizedPromptTokens + normalizedCompletionTokens;
    const estimatedCostUsd = calculateEstimatedCostUsd(totalTokens);

    await aiRepository.insertUsageEvent?.({
      id: usageEventId,
      userId: currentUser.id,
      route: AI_USAGE_ROUTE,
      eventType,
      promptTokens: normalizedPromptTokens,
      completionTokens: normalizedCompletionTokens,
      totalTokens,
      estimatedCostUsd,
      providerId,
      blockedReason,
      createdAt,
    });

    await aiRepository.createAuditLog?.({
      id: createId("audit"),
      actorUserId: currentUser.id,
      actorRole: currentUser.role ?? "USER",
      action: `ai.request.${eventType}`,
      targetType: "ai_usage_event",
      targetId: usageEventId,
      details: {
        route: AI_USAGE_ROUTE,
        providerId,
        promptTokens: normalizedPromptTokens,
        completionTokens: normalizedCompletionTokens,
        totalTokens,
        estimatedCostUsd,
        blockedReason,
        ...details,
      },
      createdAt,
    });
  };

  const resolveAssistantMemory = async (currentUser, context) => {
    let storedMemory = null;

    try {
      storedMemory =
        (await assistantMemoryRepository?.findByUserId?.(currentUser.id)) ?? null;
    } catch {
      storedMemory = null;
    }

    const nextMemory = createContextualAssistantMemory({
      currentUser,
      context,
      storedMemory,
    });

    try {
      return (await assistantMemoryRepository?.upsert?.(nextMemory)) ?? nextMemory;
    } catch {
      return nextMemory;
    }
  };

  const rejectAiRequest = async ({
    currentUser,
    code,
    message,
    reason,
    promptTokens,
    details = {},
  }) => {
    await recordAiUsageEvent(currentUser, {
      eventType: "blocked",
      promptTokens,
      blockedReason: reason,
      details: {
        code,
        ...details,
      },
    });

    throw new AssistantApiError(code, message, {
      reason,
      ...details,
    });
  };

  const enforceAiGuard = async ({ currentUser, question, promptTokens }) => {
    const abuseMatch = detectAssistantAbuse(question);

    if (abuseMatch) {
      await rejectAiRequest({
        currentUser,
        code: "ASSISTANT_REQUEST_BLOCKED",
        message: "Assistant request was blocked by the safety policy.",
        reason: abuseMatch.reason,
        promptTokens,
      });
    }

    const latestCompletedEvent = await aiRepository.findLatestUsageEvent?.({
      userId: currentUser.id,
      route: AI_USAGE_ROUTE,
      eventType: "completed",
    });
    const latestCompletedAtMs = latestCompletedEvent?.createdAt
      ? Date.parse(latestCompletedEvent.createdAt)
      : Number.NaN;
    const retryAfterMs =
      Number.isFinite(latestCompletedAtMs) && aiGuard.requestCooldownMs > 0
        ? latestCompletedAtMs + aiGuard.requestCooldownMs - Date.now()
        : 0;

    if (retryAfterMs > 0) {
      await rejectAiRequest({
        currentUser,
        code: "ASSISTANT_COOLDOWN",
        message: "Please wait before sending another assistant request.",
        reason: "cooldown",
        promptTokens,
        details: {
          retryAfterMs: Math.ceil(retryAfterMs),
        },
      });
    }

    const dailyUsage = await getUsageSummary(currentUser, "day");
    const monthlyUsage = await getUsageSummary(currentUser, "month");

    if (dailyUsage.requestCount >= aiGuard.dailyRequestLimit) {
      await rejectAiRequest({
        currentUser,
        code: "ASSISTANT_QUOTA_EXCEEDED",
        message: "Daily assistant request quota exceeded.",
        reason: "daily_request_limit",
        promptTokens,
        details: {
          limit: aiGuard.dailyRequestLimit,
          used: dailyUsage.requestCount,
          window: "day",
        },
      });
    }

    if (monthlyUsage.requestCount >= aiGuard.monthlyRequestLimit) {
      await rejectAiRequest({
        currentUser,
        code: "ASSISTANT_QUOTA_EXCEEDED",
        message: "Monthly assistant request quota exceeded.",
        reason: "monthly_request_limit",
        promptTokens,
        details: {
          limit: aiGuard.monthlyRequestLimit,
          used: monthlyUsage.requestCount,
          window: "month",
        },
      });
    }

    if (dailyUsage.totalTokens + promptTokens > aiGuard.dailyTokenLimit) {
      await rejectAiRequest({
        currentUser,
        code: "ASSISTANT_QUOTA_EXCEEDED",
        message: "Daily assistant token budget exceeded.",
        reason: "daily_token_limit",
        promptTokens,
        details: {
          limit: aiGuard.dailyTokenLimit,
          used: dailyUsage.totalTokens,
          requested: promptTokens,
          window: "day",
        },
      });
    }

    if (monthlyUsage.totalTokens + promptTokens > aiGuard.monthlyTokenLimit) {
      await rejectAiRequest({
        currentUser,
        code: "ASSISTANT_QUOTA_EXCEEDED",
        message: "Monthly assistant token budget exceeded.",
        reason: "monthly_token_limit",
        promptTokens,
        details: {
          limit: aiGuard.monthlyTokenLimit,
          used: monthlyUsage.totalTokens,
          requested: promptTokens,
          window: "month",
        },
      });
    }
  };

  const getProviderAttemptOrder = () => {
    const now = Date.now();
    const readyProviders = [];
    const coolingProviders = [];

    configuredProviders.forEach((provider) => {
      if (isProviderCoolingDown(provider, now)) {
        coolingProviders.push(provider);
      } else {
        readyProviders.push(provider);
      }
    });

    return [...readyProviders, ...coolingProviders];
  };

  const getRuntimeStatus = () => ({
    configured: configuredProviders.length > 0,
    providerCount: configuredProviders.length,
    fallbackEnabled: configuredProviders.length > 1,
    model: configuredProviders[0]?.model ?? null,
    baseUrl: configuredProviders[0]?.baseUrl ?? null,
    primaryProviderId: configuredProviders[0]?.id ?? null,
    primaryProviderLabel: configuredProviders[0]?.label ?? null,
    memoryMessageLimit: config.assistantMemoryMessageLimit,
    dataProvider: config.aiDataProvider ?? "primary",
    retryCooldownMs,
    abuseProtection: {
      route: AI_USAGE_ROUTE,
      requestCooldownMs: aiGuard.requestCooldownMs,
      dailyRequestLimit: aiGuard.dailyRequestLimit,
      monthlyRequestLimit: aiGuard.monthlyRequestLimit,
      dailyTokenLimit: aiGuard.dailyTokenLimit,
      monthlyTokenLimit: aiGuard.monthlyTokenLimit,
      estimatedUsdPer1kTokens: aiGuard.estimatedUsdPer1kTokens,
    },
    providers: configuredProviders.map((provider, index) => {
      const state = getProviderState(provider.id);
      const coolingDownUntilMs =
        state.lastFailureAtMs && state.consecutiveFailures > 0 && retryCooldownMs > 0
          ? state.lastFailureAtMs + retryCooldownMs
          : null;

      return {
        id: provider.id,
        label: provider.label,
        model: provider.model,
        baseUrl: provider.baseUrl,
        priority: index + 1,
        primary: index === 0,
        coolingDown: Boolean(coolingDownUntilMs && coolingDownUntilMs > Date.now()),
        coolingDownUntil: toIsoString(coolingDownUntilMs),
        lastAttemptedAt: toIsoString(state.lastAttemptedAtMs),
        lastSuccessAt: toIsoString(state.lastSuccessAtMs),
        lastFailureAt: toIsoString(state.lastFailureAtMs),
        consecutiveFailures: state.consecutiveFailures,
        lastError: state.lastError,
        lastErrorCode: state.lastErrorCode,
        lastErrorStatus: state.lastErrorStatus,
      };
    }),
  });

  const callRemoteAi = async ({ question, quickQuestionId, context, history }) => {
    const providerErrors = [];

    for (const provider of getProviderAttemptOrder()) {
      markProviderAttempt(provider);
      debugLog("AI REQUEST");
      debugLog("Provider:", provider.label);
      debugLog("Provider ID:", provider.id);
      debugLog("Model:", provider.model);
      debugLog("Base URL:", provider.baseUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), provider.timeoutMs);

      try {
        const text = await callAiProvider({
          question,
          quickQuestionId,
          context,
          history,
          provider,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        markProviderSuccess(provider);
        debugLog("AI provider success:", provider.label, provider.model);
        return { text, provider };
      } catch (error) {
        clearTimeout(timeoutId);

        const resolvedError =
          error instanceof Error && error.name === "AbortError"
            ? new AssistantApiError(
                "ASSISTANT_RUNTIME_FAILED",
                "The remote assistant provider timed out.",
                {
                  providerId: provider.id,
                  providerLabel: provider.label,
                  providerModel: provider.model,
                  providerBaseUrl: provider.baseUrl,
                }
              )
            : error instanceof AssistantApiError
              ? error
              : new AssistantApiError(
                  "ASSISTANT_RUNTIME_FAILED",
                  "The remote assistant provider is unavailable.",
                  {
                    providerId: provider.id,
                    providerLabel: provider.label,
                    providerModel: provider.model,
                    providerBaseUrl: provider.baseUrl,
                  }
                );

        markProviderFailure(provider, resolvedError);
        debugError("AI provider failed");
        debugError("Provider:", provider.label);
        debugError("Model:", provider.model);
        debugError(
          "Error:",
          resolvedError instanceof AssistantApiError
            ? resolvedError.details?.providerMessage ?? resolvedError.message
            : resolvedError instanceof Error
              ? resolvedError.message
              : "Unknown error"
        );
        if (resolvedError instanceof AssistantApiError) {
          debugError("Code:", resolvedError.code);
          debugError("Status:", resolvedError.details?.status ?? "n/a");
        }
        providerErrors.push(toProviderFailureSummary(provider, resolvedError));
      }
    }

    throw new AssistantApiError(
      "ASSISTANT_RUNTIME_FAILED",
      "All configured assistant providers failed.",
      {
        providerErrors,
      }
    );
  };

  return {
    getConversationHistory: async (currentUser, limit = undefined) =>
      aiRepository.listConversationMessages(currentUser.id, getHistoryLimit(limit)),

    clearConversationHistory: async (currentUser) => {
      await aiRepository.clearConversationMessages(currentUser.id);
    },

    getRuntimeStatus,

    askQuestion: async (currentUser, payload) => {
      const question = normalizeText(payload?.question, { maxLength: 800 });

      if (!question) {
        throw new AssistantApiError(
          "INVALID_ASSISTANT_REQUEST",
          "Assistant question is required."
        );
      }

      const quickQuestionId = normalizeQuickQuestionId(payload?.quickQuestionId);
      const context = normalizeContext(payload?.context, currentUser);

      const agentResult = await assistantAgent?.run?.({
        user: currentUser,
        message: question,
        quickQuestionId,
        context,
      });

      if (agentResult?.handled) {
        const userMessageCreatedAt = new Date().toISOString();
        const assistantMessageCreatedAt = new Date(Date.now() + 1).toISOString();

        await aiRepository.insertConversationMessage({
          id: createId("assistant-msg"),
          userId: currentUser.id,
          role: "user",
          text: question,
          createdAt: userMessageCreatedAt,
        });
        await aiRepository.insertConversationMessage({
          id: createId("assistant-msg"),
          userId: currentUser.id,
          role: "assistant",
          text: agentResult.text,
          createdAt: assistantMessageCreatedAt,
        });
        await aiRepository.pruneConversationMessages(
          currentUser.id,
          config.assistantMemoryMessageLimit
        );
        await aiRepository.createAuditLog?.({
          id: createId("audit"),
          actorUserId: currentUser.id,
          actorRole: currentUser.role ?? "USER",
          action: "assistant.agent.handled",
          targetType: "assistant_agent_action",
          targetId: agentResult.intent?.intent ?? "unknown",
          details: {
            intent: agentResult.intent?.intent ?? "unknown",
            reason: agentResult.intent?.reason ?? null,
            actions: agentResult.actions ?? [],
            memoryUpdated: Boolean(agentResult.memoryUpdated),
          },
          createdAt: assistantMessageCreatedAt,
        });

        return {
          text: agentResult.text,
          mode: agentResult.mode,
          providerId: agentResult.providerId,
          providerLabel: agentResult.providerLabel,
          followUpQuestionIds: agentResult.followUpQuestionIds,
          actions: agentResult.actions ?? [],
          agent: {
            intent: agentResult.intent,
            actions: agentResult.actions,
            memoryUpdated: Boolean(agentResult.memoryUpdated),
          },
        };
      }

      if (!configuredProviders.length) {
        throw new AssistantApiError(
          "ASSISTANT_RUNTIME_UNAVAILABLE",
          "Remote assistant runtime is not configured on this server."
        );
      }

      context.memory = await resolveAssistantMemory(currentUser, context);
      const history = await aiRepository.listConversationMessages(
        currentUser.id,
        config.assistantMemoryMessageLimit
      );
      const promptTokens = estimatePromptTokens({
        question,
        quickQuestionId,
        context,
        history,
      });

      await enforceAiGuard({
        currentUser,
        question,
        promptTokens,
      });

      let aiReply;

      try {
        aiReply = await callRemoteAi({
          question,
          quickQuestionId,
          context,
          history,
        });
      } catch (error) {
        await recordAiUsageEvent(currentUser, {
          eventType: "failed",
          promptTokens,
          blockedReason:
            error instanceof AssistantApiError ? error.code : "ASSISTANT_RUNTIME_FAILED",
        });
        throw error;
      }

      const completionTokens = estimateTokens(aiReply.text);
      const userMessageCreatedAt = new Date().toISOString();
      const assistantMessageCreatedAt = new Date(Date.now() + 1).toISOString();

      await aiRepository.insertConversationMessage({
        id: createId("assistant-msg"),
        userId: currentUser.id,
        role: "user",
        text: question,
        createdAt: userMessageCreatedAt,
      });
      await aiRepository.insertConversationMessage({
        id: createId("assistant-msg"),
        userId: currentUser.id,
        role: "assistant",
        text: aiReply.text,
        createdAt: assistantMessageCreatedAt,
      });
      await aiRepository.pruneConversationMessages(
        currentUser.id,
        config.assistantMemoryMessageLimit
      );
      await recordAiUsageEvent(currentUser, {
        eventType: "completed",
        promptTokens,
        completionTokens,
        providerId: aiReply.provider.id,
      });

      return {
        text: aiReply.text,
        mode: "remote-cloud",
        providerId: aiReply.provider.id,
        providerLabel: aiReply.provider.label,
        followUpQuestionIds: quickQuestionId
          ? assistantFollowUps[quickQuestionId]
          : ["day_status", "protein_help", "water_help"],
      };
    },
  };
};
