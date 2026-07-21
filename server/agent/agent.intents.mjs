const WATER_WORD_PATTERN =
  /(water|drink|drank|hydration|вода|воды|воде|водой|водою|воду|води|воді|водою|водичк|пил|пила|выпил|выпила|випив|випила|пью|склянк|стакан|glass)/i;
const WATER_STATUS_PATTERN =
  /(что|шо|що|сколько|скільки|скока|статус|status|прогресс|прогрес|скільки|how much|how many|today|сегодня|сьогодні).*(вод|water|hydration)|(?:вод|water|hydration).*(что|шо|що|сколько|скільки|статус|status|прогресс|прогрес|today|сегодня|сьогодні)/i;
const WATER_ADD_ACTION_PATTERN =
  /(^|\s)(добавь|добави|додай|додати|запиши|занеси|залей|выпил|выпила|випив|випила|пил|пила|пью|log|add|drank)(\s|$)/i;
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
const FOLLOW_UP_WORD_PATTERN =
  /(follow[-\s]?up|фоллоу|фолоу|вернись|вернуться|повернись|повернутись|провер|перевір|check back|check in|later|позже|пізніше)/i;
const RELATIVE_SCHEDULE_PATTERN =
  /(?:через|за|in)\s+\d{1,3}\s*(?:мин(?:ут[уы]?)?|хв(?:илин[уы]?)?|minutes?|min|час(?:а|ов)?|год(?:ини|ин)?|hours?|h)(?=\s|$|[,.!?])/i;
const TODAY_WORD_PATTERN =
  /(today|день|сегодня|сьогодні|статус|план|summary|итог|підсумок)/i;
const DAY_SUMMARY_PATTERN =
  /(?:итог|підсумок|отчет|отчёт|звіт|summary|report|recap|обзор|огляд).*(?:дня|день|сегодня|сьогодні|today)|(?:дня|день|сегодня|сьогодні|today).*(?:итог|підсумок|отчет|отчёт|звіт|summary|report|recap|обзор|огляд)/i;
const REPORT_WORD_PATTERN =
  /(?:отчет|отчёт|звіт|report|recap|обзор|огляд|аналитик|аналітик|analytics|progress)/i;
const REPORT_PERIOD_PATTERN =
  /(?:недел|тижд|week|weekly|месяц|місяц|month|monthly|30\s*(?:дн|днів|days?))/i;
const NUTRITION_WORD_PATTERN =
  /(калор|ккал|белк|білк|protein|нутри|нутрі|жир|carb|углев|вуглев|клетчат|клітков)/i;
const WEIGHT_WORD_PATTERN =
  /(вес|вага|важу|вешу|weight|kg|кг|кілограм|килограмм)/i;
const WEIGHT_ACTION_PATTERN =
  /(^|\s)(запиши|занеси|додай|добавь|онови|обнови|update|log|add|record)(\s|$)/i;
const SYMPTOM_WORD_PATTERN =
  /(болит|біль|болить|тошнит|нудить|тошнота|нудота|головокруж|запамороч|спазм|кровотеч|bleeding|pain|ache|nausea|dizzy|dizziness|cramp|symptom)/i;
const MEAL_ACTION_PATTERN =
  /(^|\s)(добавь|добави|додай|запиши|занеси|записати|додати|съел|съела|з'їв|зʼїв|зїла|їла|ел|ела|ate|add|log)(\s|$)/i;
const PRODUCT_SEARCH_PATTERN =
  /(^|\s)(найди|знайди|поищи|пошукай|search|find)(\s|$)/i;
const MEAL_TYPE_PATTERN =
  /(breakfast|lunch|dinner|snack|завтрак|сніданок|обед|обід|ужин|вечеря|перекус)/i;
const FAVORITE_SAVE_PATTERN =
  /(^|\s)(сохрани|сохранить|збережи|зберегти|додай в обране|добавь в избранное|save|favorite|favourite|bookmark)(\s|$)/i;
const FAVORITE_TARGET_PATTERN =
  /(избран[а-яё]*|обран[а-яіїєґ]*|улюблен[а-яіїєґ]*|favorite|favourite|saved|збережен[а-яіїєґ]*|сохранен[а-яё]*)/i;
const RECIPE_WORD_PATTERN =
  /(рецепт|recipe|meal idea|иде[яю]|іде[яю]|пригот|приготов|cook|готовить|готувати)/i;
const RECIPE_CREATE_PATTERN =
  /(^|\s)(создай|сделай|придумай|составь|зроби|створи|придумай|склади|create|make|build|suggest)(\s|$)/i;
const FRIDGE_WORD_PATTERN =
  /(холодильник|холодильника|fridge|pantry|що є|что есть|залишків|остатков)/i;
const SCANNER_WORD_PATTERN =
  /(сканер|скан|штрихкод|barcode|bar code|scan)/i;
const SCANNER_OPEN_PATTERN =
  /(^|\s)(открой|відкрий|відкрити|запусти|запустити|покажи|показати|open|start|launch)(\s|$)/i;
const PHOTO_MEAL_WORD_PATTERN =
  /(фото|фотограф|снимок|знімок|картинк|image|photo|picture|plate|тарелк|тарілк)/i;
const PHOTO_MEAL_ACTION_PATTERN =
  /(^|\s)(проанализируй|проаналізуй|аналіз|анализ|розпізнай|распознай|открой|відкрий|загрузи|завантаж|open|analyze|analyse|recognize|upload)(\s|$)/i;

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

const readWeightKg = (message) => {
  const normalized = normalizeMessage(message).toLowerCase();
  const directMatch = normalized.match(
    /(?:вес|вага|важу|вешу|weight)\D{0,20}(\d{2,3}(?:[.,]\d{1,2})?)\s*(?:кг|kg|кілограм|килограмм)?/i
  );
  const unitMatch = normalized.match(
    /(\d{2,3}(?:[.,]\d{1,2})?)\s*(?:кг|kg|кілограм|килограмм)\b/i
  );
  const weight = Number((directMatch?.[1] ?? unitMatch?.[1] ?? "").replace(",", "."));

  return Number.isFinite(weight) && weight >= 30 && weight <= 400
    ? Math.round(weight * 10) / 10
    : null;
};

const readSymptomSeverity = (message) => {
  const normalized = normalizeMessage(message).toLowerCase();
  const scoreMatch = normalized.match(/(?:на|severity|score)?\s*(10|[1-9])\s*(?:\/\s*10|из\s*10|з\s*10|out\s+of\s+10)?/i);
  const severity = Number(scoreMatch?.[1] ?? 0);

  return Number.isFinite(severity) && severity >= 1 && severity <= 10
    ? Math.round(severity)
    : 5;
};

const cleanSymptomLabel = (message) => {
  const cleaned = normalizeMessage(message)
    .replace(/^\/?(?:symptom|logsymptom|addsymptom)\b/i, " ")
    .replace(MEAL_ACTION_PATTERN, " ")
    .replace(WEIGHT_ACTION_PATTERN, " ")
    .replace(/(?:на|severity|score)?\s*(10|[1-9])\s*(?:\/\s*10|из\s*10|з\s*10|out\s+of\s+10)?/giu, " ")
    .replace(/(^|\s)(?:симптом|symptom|пожалуйста|будь ласка|please)(?=\s|$)/giu, " ")
    .replace(/[,:;.!?]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length >= 2 ? cleaned.slice(0, 80) : "";
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

const cleanFavoriteProductQuery = (message) => {
  const cleaned = normalizeMessage(message)
    .replace(/^\/?(?:savefavorite|save-favorite|favorite|favourite|bookmark)\b/i, " ")
    .replace(FAVORITE_SAVE_PATTERN, " ")
    .replace(FAVORITE_TARGET_PATTERN, " ")
    .replace(PRODUCT_SEARCH_PATTERN, " ")
    .replace(/(^|\s)(?:продукт|product|food|їжу|еду|в|до|to|as|please|пожалуйста|будь ласка)(?=\s|$)/giu, " ")
    .replace(/[,:;.!?]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length >= 2 ? cleaned.slice(0, 120) : "";
};

const cleanRecipeIngredientText = (message) => {
  const cleaned = normalizeMessage(message)
    .replace(/^\/?(?:recipe|createrecipe|create-recipe)\b/i, " ")
    .replace(RECIPE_CREATE_PATTERN, " ")
    .replace(RECIPE_WORD_PATTERN, " ")
    .replace(MEAL_TYPE_PATTERN, " ")
    .replace(/(^|\s)(?:из|із|з|с|со|with|from|на|for|please|пожалуйста|будь ласка|мені|мне|my|мо[єїй]|моего|моїх|моих)(?=\s|$)/giu, " ")
    .replace(FRIDGE_WORD_PATTERN, " ")
    .replace(/[;:!?]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length >= 2 ? cleaned.slice(0, 180) : "";
};

const hasMedicationCourseIntent = (message) =>
  /(?:^|\s)(?:курс|course)(?:\s|$)/iu.test(message) ||
  /(?:^|\s)\d{1,3}\s*(?:дн(?:я|ей|ів|і)?|days?)(?:\s|$)/iu.test(message);

const readReportPeriod = (message) => {
  const normalized = normalizeMessage(message).toLowerCase();

  if (/(месяц|місяц|month|monthly|30\s*(?:дн|днів|days?))/iu.test(normalized)) {
    return "month";
  }

  if (/(недел|тижд|week|weekly)/iu.test(normalized)) {
    return "week";
  }

  return null;
};

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

  if (
    /^\/?(?:followup|follow-up)\b/i.test(normalized) ||
    (FOLLOW_UP_WORD_PATTERN.test(normalized) &&
      (REMINDER_SCHEDULE_PATTERN.test(normalized) || RELATIVE_SCHEDULE_PATTERN.test(normalized)))
  ) {
    return {
      intent: "create_follow_up",
      confidence: 0.86,
      entities: {
        text: normalized.replace(/^\/?(?:followup|follow-up)\b/i, "").trim() || normalized,
      },
      reason: "follow_up_request",
    };
  }

  if (WATER_WORD_PATTERN.test(normalized) && WATER_STATUS_PATTERN.test(normalized) && !amountMl) {
    return {
      intent: "show_water_status",
      confidence: 0.86,
      entities: {},
      reason: "water_status_request",
    };
  }

  if (
    WATER_WORD_PATTERN.test(normalized) &&
    (amountMl || WATER_ADD_ACTION_PATTERN.test(normalized))
  ) {
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

  const weightKg = readWeightKg(normalized);

  if (
    weightKg &&
    (WEIGHT_WORD_PATTERN.test(normalized) ||
      WEIGHT_ACTION_PATTERN.test(normalized) ||
      /^\/?(?:weight|logweight|addweight)\b/i.test(normalized))
  ) {
    return {
      intent: "log_weight",
      confidence: 0.9,
      entities: {
        weightKg,
      },
      reason: "weight_value_detected",
    };
  }

  if (/^\/?(?:symptom|logsymptom|addsymptom)\b/i.test(normalized) || SYMPTOM_WORD_PATTERN.test(normalized)) {
    const label = cleanSymptomLabel(normalized);

    if (label) {
      return {
        intent: "log_symptom",
        confidence: 0.84,
        entities: {
          label,
          severity: readSymptomSeverity(normalized),
          text: normalized,
        },
        reason: "symptom_detected",
      };
    }
  }

  if (
    /^\/?(?:savefavorite|save-favorite|favorite|favourite|bookmark)\b/i.test(normalized) ||
    (FAVORITE_SAVE_PATTERN.test(normalized) && FAVORITE_TARGET_PATTERN.test(normalized))
  ) {
    const productQuery = cleanFavoriteProductQuery(normalized);

    if (productQuery) {
      return {
        intent: "save_favorite",
        confidence: 0.78,
        entities: {
          productQuery,
        },
        reason: "favorite_product_save_request",
      };
    }
  }

  if (
    /^\/?(?:scanner|openscanner|open-scanner|scan)\b/i.test(normalized) ||
    (SCANNER_WORD_PATTERN.test(normalized) && SCANNER_OPEN_PATTERN.test(normalized))
  ) {
    return {
      intent: "open_scanner",
      confidence: 0.9,
      entities: {
        targetRoute: "/meals?mode=barcode",
      },
      reason: "scanner_navigation_request",
    };
  }

  if (
    /^\/?(?:photo-meal|photomeal|mealphoto|photofood|foodphoto)\b/i.test(normalized) ||
    (PHOTO_MEAL_WORD_PATTERN.test(normalized) && PHOTO_MEAL_ACTION_PATTERN.test(normalized))
  ) {
    return {
      intent: "request_photo_meal_analysis",
      confidence: 0.88,
      entities: {
        targetRoute: "/meals?mode=photo",
      },
      reason: "photo_meal_navigation_request",
    };
  }

  if (
    /^\/?(?:recipe|createrecipe|create-recipe)\b/i.test(normalized) ||
    (RECIPE_WORD_PATTERN.test(normalized) && (RECIPE_CREATE_PATTERN.test(normalized) || FRIDGE_WORD_PATTERN.test(normalized)))
  ) {
    return {
      intent: "create_recipe",
      confidence: FRIDGE_WORD_PATTERN.test(normalized) ? 0.84 : 0.78,
      entities: {
        text: cleanRecipeIngredientText(normalized),
        mealType: readMealType(normalized),
        fromFridge: FRIDGE_WORD_PATTERN.test(normalized),
      },
      reason: FRIDGE_WORD_PATTERN.test(normalized)
        ? "fridge_recipe_request"
        : "recipe_create_request",
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

  if (REPORT_WORD_PATTERN.test(normalized) && REPORT_PERIOD_PATTERN.test(normalized)) {
    const period = readReportPeriod(normalized);

    return {
      intent: "generate_report",
      confidence: period ? 0.86 : 0.72,
      entities: {
        period: period ?? "week",
      },
      reason: "progress_report_request",
    };
  }

  if (DAY_SUMMARY_PATTERN.test(normalized)) {
    return {
      intent: "generate_day_summary",
      confidence: 0.84,
      entities: {},
      reason: "day_summary_request",
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
