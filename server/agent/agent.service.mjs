import { buildAgentReply } from "./agent.actions.mjs";
import { detectAgentIntent } from "./agent.intents.mjs";
import { buildAgentMemoryPatch, mergeAgentMemoryPatch } from "./agent.memory.mjs";
import { createAgentTools } from "./agent.tools.mjs";

const MIN_EXECUTION_CONFIDENCE = 0.7;

const toSafeError = (error) => ({
  code: error?.code ?? error?.name ?? "AGENT_ACTION_FAILED",
  message: String(error?.message ?? "Assistant agent action failed.")
    .replace(/\s+/g, " ")
    .slice(0, 180),
});

const getFollowUpsForIntent = (intent) => {
  if (intent === "add_water" || intent === "show_water_status") {
    return ["day_status", "water_help"];
  }

  if (intent === "show_nutrition_status") {
    return ["protein_help", "next_meal"];
  }

  if (intent === "create_medication_reminder") {
    return ["day_status", "coach_focus"];
  }

  return ["day_status", "protein_help", "water_help"];
};

export const createAssistantAgentService = ({
  stateService = null,
  medicationReminderService = null,
  assistantMemoryRepository = null,
  logger = console,
  now = () => new Date(),
} = {}) => {
  const tools = createAgentTools({
    stateService,
    medicationReminderService,
    now,
  });

  const executeIntent = async (user, intent) => {
    if (intent.intent === "add_water") {
      return tools.addWater(user, intent.entities);
    }

    if (intent.intent === "create_medication_reminder") {
      return tools.createMedicationReminder(user, intent.entities);
    }

    if (intent.intent === "show_day_status") {
      return tools.getDayStatus(user);
    }

    if (intent.intent === "show_water_status") {
      return tools.getWaterStatus(user);
    }

    if (intent.intent === "show_nutrition_status") {
      return tools.getNutritionStatus(user);
    }

    return { ok: false, code: "AGENT_INTENT_UNSUPPORTED" };
  };

  const updateMemory = async ({ user, intent, toolResult }) => {
    if (!assistantMemoryRepository?.upsert || !user?.id) {
      return null;
    }

    try {
      const previousMemory =
        (await assistantMemoryRepository.findByUserId?.(user.id)) ?? { userId: user.id };
      const patch = buildAgentMemoryPatch({ user, intent, toolResult });
      const nextMemory = mergeAgentMemoryPatch(previousMemory, patch);

      return assistantMemoryRepository.upsert(nextMemory);
    } catch (error) {
      logger.warn?.("[assistant-agent] memory update failed", toSafeError(error));
      return null;
    }
  };

  const run = async ({ user, message, quickQuestionId = null } = {}) => {
    const intent = detectAgentIntent(message, { quickQuestionId });

    if (intent.confidence < MIN_EXECUTION_CONFIDENCE || intent.intent === "unknown") {
      return {
        handled: false,
        intent,
        actions: [],
        reason: intent.reason,
      };
    }

    let toolResult;

    try {
      toolResult = await executeIntent(user, intent);
    } catch (error) {
      toolResult = {
        ok: false,
        ...toSafeError(error),
      };
      logger.warn?.("[assistant-agent] action failed", {
        intent: intent.intent,
        ...toolResult,
      });
    }

    const memory = await updateMemory({ user, intent, toolResult });
    const reply = buildAgentReply({ intent, toolResult });

    return {
      handled: true,
      text: reply,
      mode: "agent-action",
      providerId: "assistant-agent",
      providerLabel: "Smart Nutrition Agent",
      intent,
      actions: [
        {
          id: intent.intent,
          ok: Boolean(toolResult?.ok),
          resultType: toolResult?.type ?? null,
          code: toolResult?.code ?? null,
        },
      ],
      memoryUpdated: Boolean(memory),
      followUpQuestionIds: getFollowUpsForIntent(intent.intent),
    };
  };

  return {
    run,
    detectIntent: detectAgentIntent,
  };
};
