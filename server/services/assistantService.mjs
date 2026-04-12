import { AssistantApiError, createId } from "../lib/domain.mjs";

const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const assistantFollowUps = {
  day_status: ["protein_help", "coach_focus"],
  protein_help: ["day_status", "coach_focus"],
  coach_focus: ["protein_help", "motivation_focus"],
  motivation_focus: ["coach_focus", "day_status"],
};

const toFiniteNumber = (value, fallback = 0) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
};

const normalizeText = (value, { maxLength = 600, fallback = "" } = {}) => {
  const nextValue = String(value ?? "").trim().replace(/\s+/g, " ");
  return nextValue ? nextValue.slice(0, maxLength) : fallback;
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

const buildSystemPrompt = (context) =>
  [
    `You are ${context.assistantName}, the Smart Nutrition assistant.`,
    `Reply in ${context.language === "pl" ? "Polish" : "Ukrainian"}.`,
    "Be warm, concise, and practical.",
    "Use only the current nutrition context and the conversation memory provided below.",
    "Do not invent calories, macros, diagnoses, or certainty.",
    "If the logged data looks incomplete, say so directly.",
    "Prefer 2-5 short sentences or a very short bullet list when it helps.",
  ].join(" ");

const buildContextBlock = (context) =>
  [
    "Current Smart Nutrition context:",
    `- User: ${context.userName}`,
    `- Goal: ${context.goal}`,
    `- Daily calories target: ${Math.round(context.dailyCalories)} kcal`,
    `- Calories consumed today: ${Math.round(context.caloriesConsumed)} kcal`,
    `- Calories remaining today: ${Math.round(context.caloriesRemaining)} kcal`,
    `- Protein today: ${Math.round(context.proteinConsumed)} / ${Math.round(context.proteinTarget)} g`,
    `- Fat today: ${Math.round(context.fatConsumed)} g`,
    `- Carbs today: ${Math.round(context.carbsConsumed)} g`,
    `- Logged meal entries today: ${context.mealEntriesToday}`,
    `- Assistant role/tone: ${context.assistantRole} / ${context.assistantTone}`,
    `- Humor enabled: ${context.humorEnabled ? "yes" : "no"}`,
    `- Coach insight: ${context.coachPrimaryInsight}`,
    `- Coach score: ${context.coach.score}/100`,
    `- Coach weekly averages: ${Math.round(context.coach.averageCalories)} kcal, ${Math.round(
      context.coach.averageProtein
    )} g protein, ${Math.round(context.coach.averageFiber)} g fiber, ${context.coach.averageMeals.toFixed(
      1
    )} meals`,
    `- Coach targets: ${Math.round(context.coach.calorieTarget)} kcal, ${Math.round(
      context.coach.proteinTarget
    )} g protein, ${Math.round(context.coach.fiberTarget)} g fiber`,
    `- Weight change: ${context.coach.weightChange.toFixed(1)} kg`,
    `- Motivation: ${context.motivation.points} points, level ${context.motivation.level}, ${context.motivation.completedTasks} completed tasks, ${context.motivation.openTasks} open tasks`,
  ].join("\n");

const buildProviderMessages = ({ context, history, question, quickQuestionId }) => [
  {
    role: "system",
    content: buildSystemPrompt(context),
  },
  {
    role: "system",
    content: buildContextBlock(context),
  },
  ...history.map((message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: normalizeText(message.text, { maxLength: 2_000 }),
  })),
  {
    role: "user",
    content: [
      quickQuestionId ? `Quick question id: ${quickQuestionId}` : null,
      `User question: ${question}`,
    ]
      .filter(Boolean)
      .join("\n"),
  },
];

const extractAssistantText = (payload) => {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const chatCompletionContent = payload?.choices?.[0]?.message?.content;

  if (typeof chatCompletionContent === "string" && chatCompletionContent.trim()) {
    return chatCompletionContent.trim();
  }

  if (Array.isArray(chatCompletionContent)) {
    const text = chatCompletionContent
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (typeof part?.text === "string") {
          return part.text;
        }

        return "";
      })
      .join("\n")
      .trim();

    if (text) {
      return text;
    }
  }

  return "";
};

const callRemoteAssistant = async ({
  question,
  quickQuestionId,
  context,
  history,
  config,
}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.assistantTimeoutMs);

  try {
    const response = await fetch(`${config.assistantBaseUrl}${config.assistantApiPath}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.assistantApiKey}`,
      },
      body: JSON.stringify({
        model: config.assistantModel,
        temperature: config.assistantTemperature,
        messages: buildProviderMessages({
          context,
          history,
          question,
          quickQuestionId,
        }),
      }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new AssistantApiError(
        "ASSISTANT_RUNTIME_FAILED",
        "The remote assistant provider returned an error.",
        {
          status: response.status,
          providerMessage:
            normalizeText(payload?.error?.message ?? payload?.message, {
              maxLength: 240,
              fallback: null,
            }) ?? null,
        }
      );
    }

    const text = extractAssistantText(payload);

    if (!text) {
      throw new AssistantApiError(
        "ASSISTANT_RUNTIME_FAILED",
        "The remote assistant provider returned an empty response."
      );
    }

    return normalizeText(text, { maxLength: 4_000 });
  } catch (error) {
    if (error instanceof AssistantApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new AssistantApiError(
        "ASSISTANT_RUNTIME_FAILED",
        "The remote assistant provider timed out."
      );
    }

    throw new AssistantApiError(
      "ASSISTANT_RUNTIME_FAILED",
      "The remote assistant provider is unavailable."
    );
  } finally {
    clearTimeout(timeoutId);
  }
};

export const createAssistantService = ({ assistantRepository, config }) => {
  const getHistoryLimit = (limit) =>
    Math.min(
      Math.max(Number(limit) || config.assistantMemoryMessageLimit, 1),
      config.assistantMemoryMessageLimit
    );

  return {
    getConversationHistory: (currentUser, limit = undefined) =>
      assistantRepository.listConversationMessages(currentUser.id, getHistoryLimit(limit)),

    clearConversationHistory: (currentUser) => {
      assistantRepository.clearConversationMessages(currentUser.id);
    },

    askQuestion: async (currentUser, payload) => {
      if (!config.assistantRuntimeConfigured) {
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
      const history = assistantRepository.listConversationMessages(
        currentUser.id,
        config.assistantMemoryMessageLimit
      );
      const assistantText = await callRemoteAssistant({
        question,
        quickQuestionId,
        context,
        history,
        config,
      });
      const userMessageCreatedAt = new Date().toISOString();
      const assistantMessageCreatedAt = new Date(Date.now() + 1).toISOString();

      assistantRepository.insertConversationMessage({
        id: createId("assistant-msg"),
        userId: currentUser.id,
        role: "user",
        text: question,
        createdAt: userMessageCreatedAt,
      });
      assistantRepository.insertConversationMessage({
        id: createId("assistant-msg"),
        userId: currentUser.id,
        role: "assistant",
        text: assistantText,
        createdAt: assistantMessageCreatedAt,
      });
      assistantRepository.pruneConversationMessages(
        currentUser.id,
        config.assistantMemoryMessageLimit
      );

      return {
        text: assistantText,
        mode: "remote-cloud",
        followUpQuestionIds: quickQuestionId
          ? assistantFollowUps[quickQuestionId]
          : ["day_status", "protein_help", "coach_focus"],
      };
    },
  };
};
