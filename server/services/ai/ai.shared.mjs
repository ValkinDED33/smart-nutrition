import { AssistantApiError } from "../../lib/domain.mjs";

export const DEFAULT_PROVIDER_MAX_TOKENS = 512;

export const normalizeText = (value, { maxLength = 600, fallback = "" } = {}) => {
  const nextValue = String(value ?? "").trim().replace(/\s+/g, " ");
  return nextValue ? nextValue.slice(0, maxLength) : fallback;
};

const assistantLanguageLabels = {
  uk: "Ukrainian",
  pl: "Polish",
  en: "English",
};

const formatList = (value) =>
  Array.isArray(value) && value.length > 0 ? value.join(", ") : "none";

const formatPersonality = (personality) =>
  personality
    ? `warmth ${personality.warmth}, humor ${personality.humor}, strictness ${personality.strictness}, motivation ${personality.motivation}`
    : "warmth 0.9, humor 0.4, strictness 0.2, motivation 0.8";

const formatDailyContextLine = (context) => {
  const dailyContext = context.dailyContext;

  if (!dailyContext) {
    return "- Daily context engine: unavailable";
  }

  return [
    `- Daily context engine: focus ${dailyContext.primaryFocus}, suggested meal ${dailyContext.suggestedMealType}, nudge tone ${dailyContext.nudgeTone}`,
    `- Today vs yesterday: ${Math.round(dailyContext.today?.calories ?? 0)} kcal / ${Math.round(
      dailyContext.today?.protein ?? 0
    )} g protein today, ${Math.round(dailyContext.yesterday?.calories ?? 0)} kcal / ${Math.round(
      dailyContext.yesterday?.protein ?? 0
    )} g protein yesterday`,
    `- Daily gaps: ${Math.round(dailyContext.gaps?.calories ?? 0)} kcal, ${Math.round(
      dailyContext.gaps?.protein ?? 0
    )} g protein, ${Math.round(dailyContext.gaps?.fiber ?? 0)} g fiber, ${Math.round(
      dailyContext.gaps?.waterMl ?? 0
    )} ml water`,
    `- Behavior patterns: ${formatList(dailyContext.patterns)}`,
  ].join("\n");
};

const buildSystemPrompt = (context) =>
  [
    `You are ${context.assistantName}, the Smart Nutrition assistant.`,
    `Reply in ${assistantLanguageLabels[context.language] ?? "Ukrainian"}.`,
    `Communication style: ${context.communicationStyle}. Personality sliders: ${formatPersonality(
      context.assistantPersonality
    )}.`,
    "Be concise, practical, and emotionally aware.",
    "Use only the current nutrition context and the conversation memory provided below.",
    "Do not invent calories, macros, diagnoses, or certainty.",
    "Use relationship, support, and pet context only to adapt tone and practical contact style.",
    "Do not make medical or nutrition claims from blood group or eye color.",
    "If the logged data looks incomplete, say so directly.",
    "Prefer 2-5 short sentences or a very short bullet list when it helps.",
  ].join(" ");

const buildContextBlock = (context) =>
  [
    "Current Smart Nutrition context:",
    `- User: ${context.userName}`,
    `- Goal: ${context.goal}`,
    `- Diet style: ${context.profile?.dietStyle ?? "balanced"}`,
    `- Structured profile: goal ${context.profile?.goal ?? context.goal}, latest weight ${Number(
      context.profile?.latestWeight ?? context.latestWeight
    ).toFixed(1)} kg, weekly check-in due ${
      context.profile?.weeklyCheckInDue ? "yes" : "no"
    }`,
    `- Nutrition state: ${Math.round(
      context.nutritionState?.caloriesConsumed ?? context.caloriesConsumed
    )} / ${Math.round(
      context.nutritionState?.dailyCalories ?? context.dailyCalories
    )} kcal, protein ${Math.round(
      context.nutritionState?.proteinConsumed ?? context.proteinConsumed
    )} / ${Math.round(
      context.nutritionState?.proteinTarget ?? context.proteinTarget
    )} g, water ${Math.round(
      context.nutritionState?.waterConsumedMl ?? context.waterConsumedMl
    )} / ${Math.round(context.nutritionState?.waterTargetMl ?? context.waterTargetMl)} ml`,
    `- Behavior: ${context.behavior?.mealEntriesToday ?? context.mealEntriesToday} meal entries today, water logged ${
      context.behavior?.waterLoggedToday ? "yes" : "no"
    }, ${context.behavior?.openMotivationTasks ?? context.motivation.openTasks} open motivation tasks`,
    formatDailyContextLine(context),
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
    `- Assistant personality: ${formatPersonality(context.assistantPersonality)}`,
    `- Communication style: ${context.communicationStyle}`,
    `- Assistant memory personality: ${formatPersonality(
      context.memory?.personality ?? context.assistantPersonality
    )}`,
    `- Assistant memory goals: ${formatList(context.memory?.goals)}`,
    `- Assistant memory struggles: ${formatList(context.memory?.struggles)}`,
    `- Assistant memory habits: ${formatList(context.memory?.habits)}`,
    `- Assistant memory motivation triggers: ${formatList(
      context.memory?.motivationTriggers
    )}`,
    `- Assistant memory last mood: ${context.memory?.lastMood ?? "unknown"}`,
    `- Assistant memory recent problems: ${formatList(context.memory?.recentProblems)}`,
    `- Blood group: ${context.personalDetails?.bloodGroup ?? "unknown"}`,
    `- Eye color: ${context.personalDetails?.eyeColor ?? "unknown"}`,
    `- Relationship status: ${context.personalDetails?.relationshipStatus ?? "prefer_not"}`,
    `- Support system: ${context.personalDetails?.supportSystem ?? "self"}`,
    `- Pet companion: ${context.personalDetails?.petCompanion ?? "none"}`,
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
