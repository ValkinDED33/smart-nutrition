const formatNumber = (value, digits = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue.toFixed(digits) : "0";
};

const formatPercent = (current, target) => {
  const currentNumber = Number(current) || 0;
  const targetNumber = Number(target) || 0;

  if (targetNumber <= 0) {
    return "0%";
  }

  return `${Math.min(Math.round((currentNumber / targetNumber) * 100), 999)}%`;
};

const formatReminderTimes = (reminder) =>
  Array.isArray(reminder?.times) && reminder.times.length > 0
    ? reminder.times.join(", ")
    : "за розкладом";

const getMedicationReminderTitle = (reminder) =>
  String(reminder?.title ?? reminder?.name ?? "нагадування").trim() || "нагадування";

const getReminderKindLabel = (reminderKind) => {
  if (reminderKind === "medication_course") return "курс ліків";
  if (reminderKind === "pregnancy_supplement") return "нагадування для вагітності / supplement";
  if (reminderKind === "water") return "нагадування про воду";
  if (reminderKind === "habit") return "нагадування про звичку";
  if (reminderKind === "task") return "нагадування";

  return "нагадування про ліки";
};

const getReminderActionPhrase = (reminderKind) => {
  if (
    reminderKind === "medication" ||
    reminderKind === "medication_course" ||
    reminderKind === "pregnancy_supplement"
  ) {
    return "прийнято, пізніше або пропустити";
  }

  if (reminderKind === "water") {
    return "випито, пізніше або пропустити";
  }

  return "зроблено, пізніше або пропустити";
};

const getProductTitle = (product) =>
  [product?.brand, product?.name]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .trim() || "продукт";

const formatMealType = (mealType) => {
  if (mealType === "breakfast") return "сніданок";
  if (mealType === "lunch") return "обід";
  if (mealType === "dinner") return "вечеря";
  return "перекус";
};

export const buildAgentReply = ({ intent, toolResult }) => {
  if (!toolResult?.ok) {
    if (intent.intent === "add_water" || intent.intent === "show_water_status") {
      return [
        "Я зрозумів дію з водою, але зараз не зміг підтвердити збереження в Smart Nutrition.",
        "Спробуйте ще раз трохи пізніше — я не буду показувати це як збережене, поки бекенд не підтвердить.",
      ].join("\n");
    }

    if (intent.intent === "add_meal" || intent.intent === "search_product") {
      if (toolResult?.code === "PRODUCT_NOT_FOUND") {
        return [
          `Я не знайшов продукт "${toolResult.query ?? intent.entities?.productQuery}" в онлайн-базі.`,
          "Відкрийте пошук їжі або додайте продукт у спільну базу, щоб я міг використовувати його наступного разу.",
        ].join("\n");
      }

      return "Я зрозумів дію з їжею, але зараз не зміг безпечно виконати пошук у каталозі.";
    }

    if (intent.intent === "create_medication_reminder") {
      return [
        "Я не зміг безпечно розібрати розклад ліків.",
        "Напишіть так: /addmed Вітамін D 1 капсула щодня о 09:00",
      ].join("\n");
    }

    if (intent.intent === "create_task_reminder") {
      return [
        "Я не зміг безпечно розібрати час нагадування.",
        "Напишіть так: /addtask Подзвонити лікарю о 10:00",
      ].join("\n");
    }

    if (
      intent.intent === "create_water_reminder" ||
      intent.intent === "create_habit_reminder" ||
      intent.intent === "create_medication_course_reminder" ||
      intent.intent === "create_pregnancy_supplement_reminder"
    ) {
      return [
        "Я зрозумів тип нагадування, але не зміг безпечно розібрати розклад.",
        "Напишіть з конкретним часом: щодня о 09:00, 13:00 або 21:00.",
      ].join("\n");
    }

    return "Я поруч, але зараз не зміг виконати дію автоматично. Спробуйте ще раз трохи конкретніше.";
  }

  if (toolResult.type === "water_added") {
    const consumed = toolResult.water?.consumedMl ?? 0;
    const target = toolResult.water?.targetMl ?? 0;
    const remaining = Math.max(target - consumed, 0);

    return [
      `Готово 💧 Додав ${formatNumber(toolResult.amountMl)} мл води.`,
      `Зараз: ${formatNumber(consumed)} / ${formatNumber(target)} мл (${formatPercent(
        consumed,
        target
      )}).`,
      remaining > 0
        ? `До цілі лишилось приблизно ${formatNumber(remaining)} мл.`
        : "Ціль по воді вже закрита. Гарний ритм.",
    ].join("\n");
  }

  if (toolResult.type === "product_search") {
    const products = Array.isArray(toolResult.products) ? toolResult.products : [];

    if (products.length === 0) {
      return [
        `Я пошукав "${toolResult.query}", але не знайшов готовий продукт.`,
        "Можна додати його в спільну базу через пошук їжі.",
      ].join("\n");
    }

    return [
      `Знайшов ${products.length} варіант(и) для "${toolResult.query}":`,
      ...products.slice(0, 5).map((product, index) =>
        `${index + 1}. ${getProductTitle(product)} — ${formatNumber(
          product?.nutrients?.calories
        )} ккал / 100 ${product?.unit ?? "г"}`
      ),
      "Напишіть: додай назву і кількість, наприклад “додай chicken breast 150 г”.",
    ].join("\n");
  }

  if (toolResult.type === "meal_added") {
    const product = toolResult.product;
    const nutrients = toolResult.nutrients ?? {};

    return [
      `Готово 🥗 Додав ${getProductTitle(product)} — ${formatNumber(
        toolResult.quantity
      )} ${product?.unit ?? "г"}.`,
      `Прийом: ${formatMealType(toolResult.mealType)}.`,
      `Орієнтовно: ${formatNumber(nutrients.calories)} ккал, білок ${formatNumber(
        nutrients.protein,
        1
      )} г, жири ${formatNumber(nutrients.fat, 1)} г, вуглеводи ${formatNumber(
        nutrients.carbs,
        1
      )} г.`,
    ].join("\n");
  }

  if (toolResult.type === "medication_reminder_created") {
    const reminder = toolResult.reminder;
    const womenHealthMode = toolResult.healthContext?.womenHealthMode;
    const needsPregnancySafety =
      womenHealthMode === "pregnant" || womenHealthMode === "trying_to_conceive";

    return [
      "Готово 💊 Нагадування створено.",
      `${getMedicationReminderTitle(reminder)} — ${formatReminderTimes(reminder)}`,
      "Я нагадаю і дам кнопки: прийнято, пізніше або пропустити.",
      needsPregnancySafety
        ? "Оскільки увімкнений режим вагітності / підготовки, я триматимуся тільки плану лікаря і не змінюватиму дозування."
        : null,
      "Важливо: я не замінюю лікаря і не змінюю дозування самостійно.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (toolResult.type === "task_reminder_created") {
    const reminder = toolResult.reminder;

    return [
      "Готово. Нагадування створено.",
      `${getMedicationReminderTitle(reminder)} — ${formatReminderTimes(reminder)}`,
      reminder.repeat === "once" ? "Повтор: один раз." : "Повтор: щодня.",
      "Я нагадаю в Telegram і дам кнопки: зроблено, пізніше або пропустити.",
    ].join("\n");
  }

  if (toolResult.type === "reminder_created") {
    const reminder = toolResult.reminder;
    const reminderKind = toolResult.reminderKind ?? reminder?.type;
    const doseLine = reminder?.dose ? `Деталі: ${reminder.dose}.` : null;
    const safetyLine =
      reminderKind === "pregnancy_supplement"
        ? "Я буду триматися тільки вашого плану лікаря і не змінюватиму дозування самостійно."
        : null;

    return [
      `Готово. Створено ${getReminderKindLabel(reminderKind)}.`,
      `${getMedicationReminderTitle(reminder)} — ${formatReminderTimes(reminder)}`,
      doseLine,
      reminder?.repeat === "once" ? "Повтор: один раз." : "Повтор: щодня.",
      safetyLine,
      `Я нагадаю в Telegram і дам кнопки: ${getReminderActionPhrase(reminderKind)}.`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (toolResult.type === "water_status") {
    const consumed = toolResult.water?.consumedMl ?? 0;
    const target = toolResult.water?.targetMl ?? 0;
    const remaining = Math.max(target - consumed, 0);

    return [
      "Вода сьогодні:",
      `💧 ${formatNumber(consumed)} / ${formatNumber(target)} мл (${formatPercent(
        consumed,
        target
      )})`,
      remaining > 0
        ? `Ще приблизно ${formatNumber(remaining)} мл.`
        : "Ціль вже закрита.",
    ].join("\n");
  }

  if (toolResult.type === "nutrition_status") {
    const nutrients = toolResult.nutrients ?? {};

    return [
      "Нутрієнти сьогодні:",
      `🥗 Записів їжі: ${toolResult.mealCount}`,
      `🔥 Калорії: ${formatNumber(nutrients.calories)} / ${formatNumber(
        toolResult.dailyCalories
      )} ккал`,
      `🥩 Білок: ${formatNumber(nutrients.protein, 1)} г`,
      `🥑 Жири: ${formatNumber(nutrients.fat, 1)} г`,
      `🍚 Вуглеводи: ${formatNumber(nutrients.carbs, 1)} г`,
      `🌾 Клітковина: ${formatNumber(nutrients.fiber, 1)} г`,
    ].join("\n");
  }

  if (toolResult.type === "day_status") {
    const nutrients = toolResult.nutrients ?? {};
    const water = toolResult.water ?? {};

    return [
      "Короткий статус дня:",
      `🥗 Їжа: ${toolResult.mealCount} запис(ів)`,
      `🔥 Калорії: ${formatNumber(nutrients.calories)} / ${formatNumber(
        toolResult.dailyCalories
      )} ккал`,
      `🥩 Білок: ${formatNumber(nutrients.protein, 1)} г`,
      `💧 Вода: ${formatNumber(water.consumedMl)} / ${formatNumber(water.targetMl)} мл`,
      toolResult.mealCount === 0
        ? "Найпростіший наступний крок — додати перший прийом їжі або воду."
        : "Можу підказати наступний крок по білку, воді або калоріях.",
    ].join("\n");
  }

  return "Готово. Я оновив дані Smart Nutrition.";
};
