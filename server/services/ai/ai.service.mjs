import { AssistantApiError, createId } from "../../lib/domain.mjs";
import { callAiProvider } from "./providers/index.mjs";
import { normalizeText } from "./ai.shared.mjs";

const assistantFollowUps = {
  day_status: ["protein_help", "coach_focus"],
  protein_help: ["day_status", "coach_focus"],
  coach_focus: ["protein_help", "motivation_focus"],
  motivation_focus: ["coach_focus", "day_status"],
};

const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toFiniteNumber = (value, fallback = 0) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
};

const normalizeQuickQuestionId = (value) =>
  value === "day_status" ||
  value === "protein_help" ||
  value === "coach_focus" ||
  value === "motivation_focus"
    ? value
    : null;

const countOpenTasks = (motivation) =>
  Array.isArray(motivation?.activeTasks)
    ? motivation.activeTasks.filter(
        (task) => !task?.completedAt && !task?.skippedWithDayOffAt
      ).length
    : 0;

const normalizeContext = (payload, currentUser) => {
  const record = isRecord(payload) ? payload : {};
  const coach = isRecord(record.coach) ? record.coach : {};
  const motivation = isRecord(record.motivation) ? record.motivation : {};

  return {
    language: record.language === "pl" ? "pl" : "uk",
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
    assistantName: normalizeText(record.assistantName, {
      maxLength: 40,
      fallback: "Nova",
    }),
    assistantRole: normalizeText(record.assistantRole, {
      maxLength: 24,
      fallback: "assistant",
    }),
    assistantTone: normalizeText(record.assistantTone, {
      maxLength: 24,
      fallback: "gentle",
    }),
    humorEnabled: Boolean(record.humorEnabled),
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
      averageFiber: toFiniteNumber(coach.averageFiber),
      averageMeals: toFiniteNumber(coach.averageMeals),
      calorieTarget: toFiniteNumber(coach.calorieTarget),
      proteinTarget: toFiniteNumber(coach.proteinTarget),
      fiberTarget: toFiniteNumber(coach.fiberTarget),
      weightChange: toFiniteNumber(coach.weightChange),
    },
    motivation: {
      points: Math.max(Math.round(toFiniteNumber(motivation.points)), 0),
      level: Math.max(Math.round(toFiniteNumber(motivation.level, 1)), 1),
      completedTasks: Math.max(Math.round(toFiniteNumber(motivation.completedTasks)), 0),
      openTasks: countOpenTasks(motivation),
    },
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

export const createAiService = ({ aiRepository, config }) => {
  const configuredProviders = buildConfiguredProviderList(config);
  const providerRuntimeState = new Map(
    configuredProviders.map((provider) => [provider.id, createProviderState()])
  );
  const retryCooldownMs = Math.max(Number(config.assistantRetryCooldownMs) || 0, 0);

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
    retryCooldownMs,
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
    getConversationHistory: (currentUser, limit = undefined) =>
      aiRepository.listConversationMessages(currentUser.id, getHistoryLimit(limit)),

    clearConversationHistory: (currentUser) => {
      aiRepository.clearConversationMessages(currentUser.id);
    },

    getRuntimeStatus,

    askQuestion: async (currentUser, payload) => {
      if (!configuredProviders.length) {
        throw new AssistantApiError(
          "ASSISTANT_RUNTIME_UNAVAILABLE",
          "Remote assistant runtime is not configured on this server."
        );
      }

      const question = normalizeText(payload?.question, { maxLength: 800 });

      if (!question) {
        throw new AssistantApiError(
          "INVALID_ASSISTANT_REQUEST",
          "Assistant question is required."
        );
      }

      const quickQuestionId = normalizeQuickQuestionId(payload?.quickQuestionId);
      const context = normalizeContext(payload?.context, currentUser);
      const history = aiRepository.listConversationMessages(
        currentUser.id,
        config.assistantMemoryMessageLimit
      );
      const aiReply = await callRemoteAi({
        question,
        quickQuestionId,
        context,
        history,
      });
      const userMessageCreatedAt = new Date().toISOString();
      const assistantMessageCreatedAt = new Date(Date.now() + 1).toISOString();

      aiRepository.insertConversationMessage({
        id: createId("assistant-msg"),
        userId: currentUser.id,
        role: "user",
        text: question,
        createdAt: userMessageCreatedAt,
      });
      aiRepository.insertConversationMessage({
        id: createId("assistant-msg"),
        userId: currentUser.id,
        role: "assistant",
        text: aiReply.text,
        createdAt: assistantMessageCreatedAt,
      });
      aiRepository.pruneConversationMessages(
        currentUser.id,
        config.assistantMemoryMessageLimit
      );

      return {
        text: aiReply.text,
        mode: "remote-cloud",
        providerId: aiReply.provider.id,
        providerLabel: aiReply.provider.label,
        followUpQuestionIds: quickQuestionId
          ? assistantFollowUps[quickQuestionId]
          : ["day_status", "protein_help", "coach_focus"],
      };
    },
  };
};
