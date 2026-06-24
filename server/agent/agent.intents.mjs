const WATER_WORD_PATTERN =
  /(water|drink|drank|hydration|вода|воды|воду|води|водичк|пил|пила|выпил|выпила|випив|випила|пью|склянк|стакан|glass)/i;
const MEDICATION_WORD_PATTERN =
  /(таблет|ліки|лекарств|препарат|витамин|вітамін|магний|магній|омега|доза|капсул|пить|пити|принимать|приймати|med|meds)/i;
const PREGNANCY_SUPPLEMENT_WORD_PATTERN =
  /(беремен|вагіт|pregnan|prenatal|пренатал|фолиев|фолієв|folic|йод|iodine)/i;
const HABIT_WORD_PATTERN =
  /(звичк|привычк|habit|routine|рутин|прогулянк|walk|сон|sleep)/i;
const REMINDER_WORD_PATTERN =
  /(напомни|напоминай|нагадай|нагадуй|remind me|remind|reminder|нагадування|напоминание)/i;
const REMINDER_SCHEDULE_PATTERN =
  /(\d{1,2}[:.]\d{2}|(?:^|\s)(?:в|о|at)\s*\d{1,2}(?:\s|$)|утром|ранку|вечером|вечір|morning|evening|night)/i;
const TODAY_WORD_PATTERN =
  /(today|день|сегодня|сьогодні|статус|план|summary|итог|підсумок)/i;
const NUTRITION_WORD_PATTERN =
  /(калор|ккал|белк|білк|protein|нутри|нутрі|жир|carb|углев|вуглев|клетчат|клітков)/i;
const MEAL_ACTION_PATTERN =
  /(^|\s)(добавь|добави|додай|запиши|занеси|записати|додати|съел|съела|з'їв|зʼїв|зїла|їла|ел|ела|ate|add|log)(\s|$)/i;
const PRODUCT_SEARCH_PATTERN =
  /(^|\s)(найди|знайди|поищи|пошукай|search|find)(\s|$)/i;
const MEAL_TYPE_PATTERN =
  /(breakfast|lunch|dinner|snack|завтрак|сніданок|обед|обід|ужин|вечеря|перекус)/i;

const normalizeMessage = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");

const readAmountMl = (message) => {
  const normalized = normalizeMessage(message).toLowerCase();
  const litersMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:л|l|liter|litre|литр|літр)\b/i);

  if (litersMatch) {
    return Math.round(Number(litersMatch[1].replace(",", ".")) * 1000);
  }

  const mlMatch = normalized.match(/(\d{2,4})\s*(?:мл|ml|милл|мілі)/i);

  if (mlMatch) {
    return Math.round(Number(mlMatch[1]));
  }

  if (/(склянк|стакан|glass)/i.test(normalized)) {
    return 250;
  }

  return null;
};

const readFoodQuantity = (message) => {
  const normalized = normalizeMessage(message).toLowerCase();
  const match = normalized.match(
    /(\d+(?:[.,]\d+)?)\s*(?:г|гр|g|gram|grams|мл|ml|шт|штука|штуки|piece|pieces)(?:\s|$|[,.!?])/i
  );
  const quantity = Number(match?.[1]?.replace(",", ".") ?? 0);

  return Number.isFinite(quantity) && quantity > 0
    ? Math.min(Math.round(quantity * 10) / 10, 5000)
    : null;
};

const readMealType = (message) => {
  const normalized = normalizeMessage(message).toLowerCase();

  if (/(breakfast|завтрак|сніданок)/i.test(normalized)) return "breakfast";
  if (/(lunch|обед|обід)/i.test(normalized)) return "lunch";
  if (/(dinner|ужин|вечеря)/i.test(normalized)) return "dinner";
  if (/(snack|перекус)/i.test(normalized)) return "snack";

  return "snack";
};

const cleanFoodQuery = (message) => {
  const cleaned = normalizeMessage(message)
    .replace(/^\/?(?:addmeal|food|meal|searchfood)\b/i, " ")
    .replace(MEAL_ACTION_PATTERN, " ")
    .replace(PRODUCT_SEARCH_PATTERN, " ")
    .replace(MEAL_TYPE_PATTERN, " ")
    .replace(
      /\d+(?:[.,]\d+)?\s*(?:г|гр|g|gram|grams|мл|ml|шт|штука|штуки|piece|pieces)(?:\s|$|[,.!?])/giu,
      " "
    )
    .replace(/(^|\s)(?:на|for|to|please|пожалуйста|будь ласка)(?=\s|$)/giu, " ")
    .replace(/[,:;.!?]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length >= 2 ? cleaned.slice(0, 120) : "";
};

const hasMedicationCourseIntent = (message) =>
  /(?:^|\s)(?:курс|course)(?:\s|$)/iu.test(message) ||
  /(?:^|\s)\d{1,3}\s*(?:дн(?:я|ей|ів|і)?|days?)(?:\s|$)/iu.test(message);

export const detectAgentIntent = (message, { quickQuestionId = null } = {}) => {
  const normalized = normalizeMessage(message);

  if (!normalized) {
    return {
      intent: "unknown",
      confidence: 0,
      entities: {},
      reason: "empty_message",
    };
  }

  const amountMl = readAmountMl(normalized);
  const hasReminderSchedule =
    REMINDER_WORD_PATTERN.test(normalized) && REMINDER_SCHEDULE_PATTERN.test(normalized);

  if (hasReminderSchedule && WATER_WORD_PATTERN.test(normalized)) {
    return {
      intent: "create_water_reminder",
      confidence: 0.9,
      entities: {
        text: normalized,
      },
      reason: "water_reminder_request",
    };
  }

  if (hasReminderSchedule && PREGNANCY_SUPPLEMENT_WORD_PATTERN.test(normalized)) {
    return {
      intent: "create_pregnancy_supplement_reminder",
      confidence: 0.91,
      entities: {
        text: normalized,
      },
      reason: "pregnancy_supplement_reminder_request",
    };
  }

  if (hasReminderSchedule && HABIT_WORD_PATTERN.test(normalized)) {
    return {
      intent: "create_habit_reminder",
      confidence: 0.88,
      entities: {
        text: normalized,
      },
      reason: "habit_reminder_request",
    };
  }

  if (WATER_WORD_PATTERN.test(normalized) && (amountMl || /(воду|воды|води|water)/i.test(normalized))) {
    return {
      intent: "add_water",
      confidence: amountMl ? 0.94 : 0.82,
      entities: {
        amountMl: amountMl ?? 250,
      },
      reason: amountMl ? "water_amount_detected" : "water_action_without_amount",
    };
  }

  if (
    /^\/?addmed\b/i.test(normalized) ||
    (MEDICATION_WORD_PATTERN.test(normalized) && /(напомни|нагадуй|remind|кажд|щодня|(?:^|\s)[во]\s+\d{1,2}|at\s+\d{1,2})/i.test(normalized))
  ) {
    const medicationCourseIntent = hasMedicationCourseIntent(normalized);

    return {
      intent: medicationCourseIntent
        ? "create_medication_course_reminder"
        : "create_medication_reminder",
      confidence: 0.9,
      entities: {
        text: normalized.replace(/^\/?addmed\b/i, "").trim() || normalized,
      },
      reason: medicationCourseIntent
        ? "medication_course_reminder_request"
        : "medication_reminder_request",
    };
  }

  if (
    /^\/?(?:addtask|task|reminder)\b/i.test(normalized) ||
    (REMINDER_WORD_PATTERN.test(normalized) && REMINDER_SCHEDULE_PATTERN.test(normalized))
  ) {
    return {
      intent: "create_task_reminder",
      confidence: 0.86,
      entities: {
        text: normalized.replace(/^\/?(?:addtask|task|reminder)\b/i, "").trim() || normalized,
      },
      reason: "task_reminder_request",
    };
  }

  if (/^\/?(?:addmeal|food|meal)\b/i.test(normalized) || MEAL_ACTION_PATTERN.test(normalized)) {
    const quantity = readFoodQuantity(normalized) ?? 100;
    const productQuery = cleanFoodQuery(normalized);

    if (productQuery) {
      return {
        intent: "add_meal",
        confidence: readFoodQuantity(normalized) ? 0.9 : 0.74,
        entities: {
          productQuery,
          quantity,
          mealType: readMealType(normalized),
        },
        reason: readFoodQuantity(normalized)
          ? "meal_product_and_quantity_detected"
          : "meal_product_detected_default_quantity",
      };
    }
  }

  if (/^\/?searchfood\b/i.test(normalized) || PRODUCT_SEARCH_PATTERN.test(normalized)) {
    const productQuery = cleanFoodQuery(normalized);

    if (productQuery) {
      return {
        intent: "search_product",
        confidence: 0.76,
        entities: {
          productQuery,
        },
        reason: "product_search_request",
      };
    }
  }

  if (quickQuestionId === "water_help" || WATER_WORD_PATTERN.test(normalized)) {
    return {
      intent: "show_water_status",
      confidence: 0.78,
      entities: {},
      reason: "water_status_request",
    };
  }

  if (quickQuestionId === "day_status" || TODAY_WORD_PATTERN.test(normalized)) {
    return {
      intent: "show_day_status",
      confidence: 0.74,
      entities: {},
      reason: "day_status_request",
    };
  }

  if (quickQuestionId === "protein_help" || NUTRITION_WORD_PATTERN.test(normalized)) {
    return {
      intent: "show_nutrition_status",
      confidence: 0.72,
      entities: {},
      reason: "nutrition_status_request",
    };
  }

  return {
    intent: "unknown",
    confidence: 0.2,
    entities: {},
    reason: "no_safe_tool_match",
  };
};
