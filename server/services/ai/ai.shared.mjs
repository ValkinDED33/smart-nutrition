import { AssistantApiError } from "../../lib/domain.mjs";

export const DEFAULT_PROVIDER_MAX_TOKENS = 512;

export const normalizeText = (value, { maxLength = 600, fallback = "" } = {}) => {
  const nextValue = String(value ?? "").trim().replace(/\s+/g, " ");
  return nextValue ? nextValue.slice(0, maxLength) : fallback;
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
    `- Water today: ${Math.round(context.waterConsumedMl)} / ${Math.round(context.waterTargetMl)} ml`,
    `- Latest weight: ${context.latestWeight.toFixed(1)} kg`,
    `- Weight trend change: ${context.weightChangeKg.toFixed(1)} kg`,
    `- Weekly body check-in due: ${context.weeklyCheckInDue ? "yes" : "no"}`,
    `- Assistant role/tone: ${context.assistantRole} / ${context.assistantTone}`,
    `- Humor enabled: ${context.humorEnabled ? "yes" : "no"}`,
    `- Coach insight: ${context.coachPrimaryInsight}`,
    `- Coach score: ${context.coach.score}/100`,
    `- Coach weekly averages: ${Math.round(context.coach.averageCalories)} kcal, ${Math.round(
      context.coach.averageProtein
    )} g protein, ${Math.round(context.coach.averageWater)} ml water, ${Math.round(
      context.coach.averageFiber
    )} g fiber, ${context.coach.averageMeals.toFixed(
      1
    )} meals`,
    `- Coach targets: ${Math.round(context.coach.calorieTarget)} kcal, ${Math.round(
      context.coach.proteinTarget
    )} g protein, ${Math.round(context.coach.waterTarget)} ml water, ${Math.round(
      context.coach.fiberTarget
    )} g fiber`,
    `- Breakfast skipped days: ${context.coach.breakfastSkippedDays}`,
    `- Weight change: ${context.coach.weightChange.toFixed(1)} kg`,
    `- Motivation: ${context.motivation.points} points, level ${context.motivation.level}, ${context.motivation.completedTasks} completed tasks, ${context.motivation.openTasks} open tasks`,
  ].join("\n");

const buildQuestionBlock = ({ question, quickQuestionId }) =>
  [quickQuestionId ? `Quick question id: ${quickQuestionId}` : null, `User question: ${question}`]
    .filter(Boolean)
    .join("\n");

export const buildOpenAiCompatibleMessages = ({
  context,
  history,
  question,
  quickQuestionId,
}) => [
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
    content: buildQuestionBlock({ question, quickQuestionId }),
  },
];

export const buildGoogleSystemInstruction = (context) =>
  `${buildSystemPrompt(context)}\n\n${buildContextBlock(context)}`;

export const buildGoogleNativeContents = ({ history, question, quickQuestionId }) => [
  ...history.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [
      {
        text: normalizeText(message.text, { maxLength: 2_000 }),
      },
    ],
  })),
  {
    role: "user",
    parts: [
      {
        text: buildQuestionBlock({ question, quickQuestionId }),
      },
    ],
  },
];

const unwrapProviderPayload = (payload) => (Array.isArray(payload) ? payload[0] ?? null : payload);

export const extractAssistantText = (payload) => {
  const resolvedPayload = unwrapProviderPayload(payload);

  if (typeof resolvedPayload?.output_text === "string" && resolvedPayload.output_text.trim()) {
    return resolvedPayload.output_text.trim();
  }

  const chatCompletionContent = resolvedPayload?.choices?.[0]?.message?.content;

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

  const googleParts = resolvedPayload?.candidates?.[0]?.content?.parts;

  if (Array.isArray(googleParts)) {
    const text = googleParts
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("\n")
      .trim();

    if (text) {
      return text;
    }
  }

  return "";
};

const extractProviderMessage = (payload) =>
  normalizeText(
    unwrapProviderPayload(payload)?.error?.message ?? unwrapProviderPayload(payload)?.message,
    {
      maxLength: 240,
      fallback: null,
    }
  ) ?? null;

export const createProviderError = (provider, status, payload) =>
  new AssistantApiError(
    "ASSISTANT_RUNTIME_FAILED",
    "The remote assistant provider returned an error.",
    {
      providerId: provider.id,
      providerLabel: provider.label,
      providerModel: provider.model,
      providerBaseUrl: provider.baseUrl,
      status,
      providerMessage: extractProviderMessage(payload),
    }
  );
