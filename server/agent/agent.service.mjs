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

  if (intent === "generate_day_summary") {
    return ["protein_help", "water_help", "coach_focus"];
  }

  if (intent === "generate_report") {
    return ["day_status", "protein_help", "coach_focus"];
  }

  if (intent === "generate_daily_plan") {
    return ["search_product", "water_help", "coach_focus"];
  }

  if (intent === "create_follow_up") {
    return ["day_status", "coach_focus"];
  }

  if (intent === "add_meal" || intent === "search_product") {
    return ["day_status", "protein_help", "water_help"];
  }

  if (intent === "save_favorite") {
    return ["search_product", "coach_focus"];
  }

  if (intent === "create_recipe") {
    return ["day_status", "search_product", "coach_focus"];
  }

  if (intent === "open_scanner" || intent === "request_photo_meal_analysis") {
    return ["search_product", "day_status", "coach_focus"];
  }

  if (intent === "log_weight") {
    return ["day_status", "coach_focus"];
  }

  if (intent === "log_symptom") {
    return ["coach_focus", "day_status"];
  }

  if (
    intent === "create_medication_reminder" ||
    intent === "create_medication_course_reminder" ||
    intent === "create_pregnancy_supplement_reminder" ||
    intent === "create_water_reminder" ||
    intent === "create_habit_reminder" ||
    intent === "create_task_reminder"
  ) {
    return ["day_status", "coach_focus"];
  }

  return ["day_status", "protein_help", "water_help"];
};

export const createAssistantAgentService = ({
  stateService = null,
  platformService = null,
  reminderService = null,
  medicationReminderService = null,
  assistantMemoryRepository = null,
  logger = console,
  now = () => new Date(),
} = {}) => {
  const reminders = reminderService ?? medicationReminderService;
  const tools = createAgentTools({
    stateService,
    platformService,
    reminderService: reminders,
    now,
  });

  const executeIntent = async (user, intent) => {
    if (intent.intent === "add_water") {
      return tools.addWater(user, intent.entities);
    }

    if (intent.intent === "create_medication_reminder") {
      return tools.createMedicationReminder(user, intent.entities);
    }

    if (intent.intent === "create_task_reminder") {
      return tools.createTaskReminder(user, intent.entities);
    }

    if (intent.intent === "create_follow_up") {
      return tools.createFollowUp(user, intent.entities);
    }

    if (intent.intent === "create_medication_course_reminder") {
      return tools.createTypedReminder(user, {
        type: "medication_course",
        text: intent.entities.text,
      });
    }

    if (intent.intent === "create_pregnancy_supplement_reminder") {
      return tools.createTypedReminder(user, {
        type: "pregnancy_supplement",
        text: intent.entities.text,
      });
    }

    if (intent.intent === "create_water_reminder") {
      return tools.createTypedReminder(user, {
        type: "water",
        text: intent.entities.text,
      });
    }

    if (intent.intent === "create_habit_reminder") {
      return tools.createTypedReminder(user, {
        type: "habit",
        text: intent.entities.text,
      });
    }

    if (intent.intent === "search_product") {
      return tools.searchProducts(user, intent.entities);
    }

    if (intent.intent === "add_meal") {
      return tools.addMeal(user, intent.entities);
    }

    if (intent.intent === "save_favorite") {
      return tools.saveFavorite(user, intent.entities);
    }

    if (intent.intent === "create_recipe") {
      return tools.createRecipe(user, intent.entities);
    }

    if (intent.intent === "open_scanner") {
      return tools.openScanner(user, intent.entities);
    }

    if (intent.intent === "request_photo_meal_analysis") {
      return tools.requestPhotoMealAnalysis(user, intent.entities);
    }

    if (intent.intent === "log_weight") {
      return tools.logWeight(user, intent.entities);
    }

    if (intent.intent === "log_symptom") {
      return tools.logSymptom(user, intent.entities);
    }

    if (intent.intent === "show_day_status") {
      return tools.getDayStatus(user);
    }

    if (intent.intent === "generate_day_summary") {
      return tools.generateDaySummary(user);
    }

    if (intent.intent === "generate_daily_plan") {
      return tools.generateDailyPlan(user);
    }

    if (intent.intent === "generate_report") {
      return tools.generateReport(user, intent.entities);
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

  const run = async ({ user, message, quickQuestionId = null, context = null } = {}) => {
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
    const reply = buildAgentReply({ intent, toolResult, language: context?.language });

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
          targetRoute: toolResult?.targetRoute ?? null,
          targetSurface: toolResult?.targetSurface ?? null,
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
