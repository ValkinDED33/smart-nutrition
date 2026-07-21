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

const normalizeLanguage = (value) =>
  value === "en" || value === "pl" || value === "uk" ? value : "uk";

const copy = {
  uk: {
    waterUnit: "мл",
    scheduleFallback: "за розкладом",
    reminderFallback: "нагадування",
    productFallback: "продукт",
    mealTypes: {
      breakfast: "сніданок",
      lunch: "обід",
      dinner: "вечеря",
      snack: "перекус",
    },
    reminderKinds: {
      medication_course: "курс ліків",
      pregnancy_supplement: "нагадування для вагітності / supplement",
      water: "нагадування про воду",
      habit: "нагадування про звичку",
      task: "нагадування",
      medication: "нагадування про ліки",
    },
    actionPhrases: {
      medication: "прийнято, пізніше або пропустити",
      water: "випито, пізніше або пропустити",
      task: "зроблено, пізніше або пропустити",
    },
    waterFailed: [
      "Я зрозумів дію з водою, але зараз не зміг підтвердити збереження в Smart Nutrition.",
      "Спробуйте ще раз трохи пізніше — я не буду показувати це як збережене, поки хмара Smart Nutrition не підтвердить.",
    ],
    productNotFound: (query) => [
      `Я не знайшов продукт "${query}" в онлайн-базі.`,
      "Відкрийте пошук їжі або додайте продукт у спільну базу, щоб я міг використовувати його наступного разу.",
    ],
    foodFailed: "Я зрозумів дію з їжею, але зараз не зміг безпечно виконати пошук у каталозі.",
    weightFailed: [
      "Я зрозумів вагу, але зараз не зміг підтвердити збереження в Smart Nutrition.",
      "Спробуйте ще раз трохи пізніше — я не покажу це як записане без підтвердження хмари.",
    ],
    medicationScheduleFailed: [
      "Я не зміг безпечно розібрати розклад ліків.",
      "Напишіть так: /addmed Вітамін D 1 капсула щодня о 09:00",
    ],
    taskScheduleFailed: [
      "Я не зміг безпечно розібрати час нагадування.",
      "Напишіть так: /addtask Подзвонити лікарю о 10:00",
    ],
    typedReminderFailed: [
      "Я зрозумів тип нагадування, але не зміг безпечно розібрати розклад.",
      "Напишіть з конкретним часом: щодня о 09:00, 13:00 або 21:00.",
    ],
    genericFailed:
      "Я поруч, але зараз не зміг виконати дію автоматично. Спробуйте ще раз трохи конкретніше.",
    waterAdded: (amount) => `Готово 💧 Додав ${amount} мл води.`,
    currentWater: (consumed, target, percent) => `Зараз: ${consumed} / ${target} мл (${percent}).`,
    waterRemaining: (remaining) => `До цілі лишилось приблизно ${remaining} мл.`,
    waterClosed: "Ціль по воді вже закрита. Гарний ритм.",
    productSearchEmpty: (query) => [
      `Я пошукав "${query}", але не знайшов готовий продукт.`,
      "Можна додати його в спільну базу через пошук їжі.",
    ],
    productSearchHeader: (count, query) => `Знайшов ${count} варіант(и) для "${query}":`,
    productSearchHint:
      "Напишіть: додай назву і кількість, наприклад “додай chicken breast 150 г”.",
    mealAdded: (title, quantity, unit) => `Готово 🥗 Додав ${title} — ${quantity} ${unit}.`,
    mealTypeLine: (mealType) => `Прийом: ${mealType}.`,
    mealNutrients: (calories, protein, fat, carbs) =>
      `Орієнтовно: ${calories} ккал, білок ${protein} г, жири ${fat} г, вуглеводи ${carbs} г.`,
    weightLogged: (weight) => `Готово. Записав вагу ${weight} кг.`,
    weightTrend: (delta) => `Зміна від попереднього запису: ${delta} кг.`,
    weightTrendFirst: "Це перший запис ваги в історії прогресу.",
    medicationCreated: "Готово 💊 Нагадування створено.",
    medicationButtons: "Я нагадаю і дам кнопки: прийнято, пізніше або пропустити.",
    pregnancySafety:
      "Оскільки увімкнений режим вагітності / підготовки, я триматимуся тільки плану лікаря і не змінюватиму дозування.",
    clinicianSafety: "Важливо: я не замінюю лікаря і не змінюю дозування самостійно.",
    taskCreated: "Готово. Нагадування створено.",
    repeatOnce: "Повтор: один раз.",
    repeatDaily: "Повтор: щодня.",
    taskButtons: "Я нагадаю в Telegram і дам кнопки: зроблено, пізніше або пропустити.",
    reminderCreated: (kind) => `Готово. Створено ${kind}.`,
    details: (dose) => `Деталі: ${dose}.`,
    pregnancyReminderSafety:
      "Я буду триматися тільки вашого плану лікаря і не змінюватиму дозування самостійно.",
    telegramButtons: (phrase) => `Я нагадаю в Telegram і дам кнопки: ${phrase}.`,
    waterToday: "Вода сьогодні:",
    waterLeft: (remaining) => `Ще приблизно ${remaining} мл.`,
    waterGoalClosed: "Ціль вже закрита.",
    nutritionToday: "Нутрієнти сьогодні:",
    mealEntries: (count) => `🥗 Записів їжі: ${count}`,
    calories: (current, target) => `🔥 Калорії: ${current} / ${target} ккал`,
    protein: (value) => `🥩 Білок: ${value} г`,
    fat: (value) => `🥑 Жири: ${value} г`,
    carbs: (value) => `🍚 Вуглеводи: ${value} г`,
    fiber: (value) => `🌾 Клітковина: ${value} г`,
    dayStatus: "Короткий статус дня:",
    foodEntries: (count) => `🥗 Їжа: ${count} запис(ів)`,
    waterLine: (consumed, target) => `💧 Вода: ${consumed} / ${target} мл`,
    nextFirstStep: "Найпростіший наступний крок — додати перший прийом їжі або воду.",
    nextCoachingStep: "Можу підказати наступний крок по білку, воді або калоріях.",
    done: "Готово. Я оновив дані Smart Nutrition.",
  },
  pl: {
    waterUnit: "ml",
    scheduleFallback: "według harmonogramu",
    reminderFallback: "przypomnienie",
    productFallback: "produkt",
    mealTypes: {
      breakfast: "śniadanie",
      lunch: "obiad",
      dinner: "kolacja",
      snack: "przekąska",
    },
    reminderKinds: {
      medication_course: "kurs leków",
      pregnancy_supplement: "przypomnienie ciążowe / suplement",
      water: "przypomnienie o wodzie",
      habit: "przypomnienie o nawyku",
      task: "przypomnienie",
      medication: "przypomnienie o lekach",
    },
    actionPhrases: {
      medication: "przyjęte, później albo pomiń",
      water: "wypite, później albo pomiń",
      task: "zrobione, później albo pomiń",
    },
    waterFailed: [
      "Rozumiem działanie z wodą, ale nie mogę teraz potwierdzić zapisu w Smart Nutrition.",
      "Spróbuj ponownie trochę później — nie pokażę tego jako zapisane, dopóki chmura Smart Nutrition tego nie potwierdzi.",
    ],
    productNotFound: (query) => [
      `Nie znalazłem produktu "${query}" w bazie online.`,
      "Otwórz wyszukiwanie jedzenia albo dodaj produkt do wspólnej bazy, żebym mógł użyć go następnym razem.",
    ],
    foodFailed: "Rozumiem działanie z jedzeniem, ale nie mogę teraz bezpiecznie wykonać wyszukiwania w katalogu.",
    weightFailed: [
      "Rozumiem wagę, ale nie mogę teraz potwierdzić zapisu w Smart Nutrition.",
      "Spróbuj ponownie trochę później — nie pokażę tego jako zapisane bez potwierdzenia w chmurze.",
    ],
    medicationScheduleFailed: [
      "Nie udało mi się bezpiecznie odczytać harmonogramu leku.",
      "Napisz tak: /addmed Witamina D 1 kapsułka codziennie o 09:00",
    ],
    taskScheduleFailed: [
      "Nie udało mi się bezpiecznie odczytać czasu przypomnienia.",
      "Napisz tak: /addtask Zadzwonić do lekarza o 10:00",
    ],
    typedReminderFailed: [
      "Rozumiem typ przypomnienia, ale nie mogę bezpiecznie odczytać harmonogramu.",
      "Napisz z konkretną godziną: codziennie o 09:00, 13:00 albo 21:00.",
    ],
    genericFailed:
      "Jestem obok, ale teraz nie mogłem wykonać działania automatycznie. Spróbuj trochę konkretniej.",
    waterAdded: (amount) => `Gotowe 💧 Dodałem ${amount} ml wody.`,
    currentWater: (consumed, target, percent) => `Teraz: ${consumed} / ${target} ml (${percent}).`,
    waterRemaining: (remaining) => `Do celu zostało około ${remaining} ml.`,
    waterClosed: "Cel wody jest już zamknięty. Dobry rytm.",
    productSearchEmpty: (query) => [
      `Poszukałem "${query}", ale nie znalazłem gotowego produktu.`,
      "Możesz dodać go do wspólnej bazy przez wyszukiwanie jedzenia.",
    ],
    productSearchHeader: (count, query) => `Znalazłem ${count} wariant(y) dla "${query}":`,
    productSearchHint:
      "Napisz: dodaj nazwę i ilość, na przykład „dodaj chicken breast 150 g”.",
    mealAdded: (title, quantity, unit) => `Gotowe 🥗 Dodałem ${title} — ${quantity} ${unit}.`,
    mealTypeLine: (mealType) => `Posiłek: ${mealType}.`,
    mealNutrients: (calories, protein, fat, carbs) =>
      `Szacunkowo: ${calories} kcal, białko ${protein} g, tłuszcz ${fat} g, węglowodany ${carbs} g.`,
    weightLogged: (weight) => `Gotowe. Zapisałem wagę ${weight} kg.`,
    weightTrend: (delta) => `Zmiana od poprzedniego wpisu: ${delta} kg.`,
    weightTrendFirst: "To pierwszy wpis wagi w historii postępów.",
    medicationCreated: "Gotowe 💊 Przypomnienie utworzone.",
    medicationButtons: "Przypomnę i dam przyciski: przyjęte, później albo pomiń.",
    pregnancySafety:
      "Ponieważ włączony jest tryb ciąży / przygotowania, trzymam się tylko planu lekarza i nie zmieniam dawkowania.",
    clinicianSafety: "Ważne: nie zastępuję lekarza i samodzielnie nie zmieniam dawkowania.",
    taskCreated: "Gotowe. Przypomnienie utworzone.",
    repeatOnce: "Powtórka: jeden raz.",
    repeatDaily: "Powtórka: codziennie.",
    taskButtons: "Przypomnę w Telegramie i dam przyciski: zrobione, później albo pomiń.",
    reminderCreated: (kind) => `Gotowe. Utworzono ${kind}.`,
    details: (dose) => `Szczegóły: ${dose}.`,
    pregnancyReminderSafety:
      "Będę trzymał się tylko Twojego planu lekarza i nie będę samodzielnie zmieniać dawkowania.",
    telegramButtons: (phrase) => `Przypomnę w Telegramie i dam przyciski: ${phrase}.`,
    waterToday: "Woda dzisiaj:",
    waterLeft: (remaining) => `Jeszcze około ${remaining} ml.`,
    waterGoalClosed: "Cel jest już zamknięty.",
    nutritionToday: "Składniki dzisiaj:",
    mealEntries: (count) => `🥗 Wpisów jedzenia: ${count}`,
    calories: (current, target) => `🔥 Kalorie: ${current} / ${target} kcal`,
    protein: (value) => `🥩 Białko: ${value} g`,
    fat: (value) => `🥑 Tłuszcz: ${value} g`,
    carbs: (value) => `🍚 Węglowodany: ${value} g`,
    fiber: (value) => `🌾 Błonnik: ${value} g`,
    dayStatus: "Krótki status dnia:",
    foodEntries: (count) => `🥗 Jedzenie: ${count} wpis(y)`,
    waterLine: (consumed, target) => `💧 Woda: ${consumed} / ${target} ml`,
    nextFirstStep: "Najprostszy następny krok — dodaj pierwszy posiłek albo wodę.",
    nextCoachingStep: "Mogę podpowiedzieć następny krok dla białka, wody albo kalorii.",
    done: "Gotowe. Zaktualizowałem dane Smart Nutrition.",
  },
  en: {
    waterUnit: "ml",
    scheduleFallback: "on schedule",
    reminderFallback: "reminder",
    productFallback: "product",
    mealTypes: {
      breakfast: "breakfast",
      lunch: "lunch",
      dinner: "dinner",
      snack: "snack",
    },
    reminderKinds: {
      medication_course: "medication course",
      pregnancy_supplement: "pregnancy / supplement reminder",
      water: "water reminder",
      habit: "habit reminder",
      task: "reminder",
      medication: "medication reminder",
    },
    actionPhrases: {
      medication: "taken, later, or skip",
      water: "drank it, later, or skip",
      task: "done, later, or skip",
    },
    waterFailed: [
      "I understood the water action, but I could not confirm the save in Smart Nutrition right now.",
      "Try again a bit later — I will not show it as saved until Smart Nutrition cloud confirms it.",
    ],
    productNotFound: (query) => [
      `I did not find "${query}" in the online database.`,
      "Open food search or add the product to the shared catalog so I can use it next time.",
    ],
    foodFailed: "I understood the food action, but could not safely search the catalog right now.",
    weightFailed: [
      "I understood the weight, but I could not confirm the save in Smart Nutrition right now.",
      "Try again a bit later — I will not show it as saved without cloud confirmation.",
    ],
    medicationScheduleFailed: [
      "I could not safely parse the medication schedule.",
      "Write it like this: /addmed Vitamin D 1 capsule daily at 09:00",
    ],
    taskScheduleFailed: [
      "I could not safely parse the reminder time.",
      "Write it like this: /addtask Call the doctor at 10:00",
    ],
    typedReminderFailed: [
      "I understood the reminder type, but could not safely parse the schedule.",
      "Write a specific time: daily at 09:00, 13:00, or 21:00.",
    ],
    genericFailed:
      "I am here, but could not perform the action automatically right now. Try again with a little more detail.",
    waterAdded: (amount) => `Done 💧 Added ${amount} ml of water.`,
    currentWater: (consumed, target, percent) => `Now: ${consumed} / ${target} ml (${percent}).`,
    waterRemaining: (remaining) => `About ${remaining} ml left to reach the goal.`,
    waterClosed: "Your water goal is already closed. Nice rhythm.",
    productSearchEmpty: (query) => [
      `I searched for "${query}", but did not find a ready product.`,
      "You can add it to the shared catalog through food search.",
    ],
    productSearchHeader: (count, query) => `Found ${count} option(s) for "${query}":`,
    productSearchHint:
      "Write: add the name and quantity, for example “add chicken breast 150 g”.",
    mealAdded: (title, quantity, unit) => `Done 🥗 Added ${title} — ${quantity} ${unit}.`,
    mealTypeLine: (mealType) => `Meal: ${mealType}.`,
    mealNutrients: (calories, protein, fat, carbs) =>
      `Estimated: ${calories} kcal, protein ${protein} g, fat ${fat} g, carbs ${carbs} g.`,
    weightLogged: (weight) => `Done. Logged weight ${weight} kg.`,
    weightTrend: (delta) => `Change from the previous entry: ${delta} kg.`,
    weightTrendFirst: "This is the first weight entry in your progress history.",
    medicationCreated: "Done 💊 Reminder created.",
    medicationButtons: "I will remind you and show buttons: taken, later, or skip.",
    pregnancySafety:
      "Because pregnancy / trying-to-conceive mode is enabled, I will stay within your clinician plan and will not change dosage.",
    clinicianSafety: "Important: I do not replace a clinician and do not change dosage on my own.",
    taskCreated: "Done. Reminder created.",
    repeatOnce: "Repeat: once.",
    repeatDaily: "Repeat: daily.",
    taskButtons: "I will remind you in Telegram and show buttons: done, later, or skip.",
    reminderCreated: (kind) => `Done. Created ${kind}.`,
    details: (dose) => `Details: ${dose}.`,
    pregnancyReminderSafety:
      "I will stay within your clinician plan and will not change dosage on my own.",
    telegramButtons: (phrase) => `I will remind you in Telegram and show buttons: ${phrase}.`,
    waterToday: "Water today:",
    waterLeft: (remaining) => `About ${remaining} ml left.`,
    waterGoalClosed: "Goal already closed.",
    nutritionToday: "Nutrition today:",
    mealEntries: (count) => `🥗 Food entries: ${count}`,
    calories: (current, target) => `🔥 Calories: ${current} / ${target} kcal`,
    protein: (value) => `🥩 Protein: ${value} g`,
    fat: (value) => `🥑 Fat: ${value} g`,
    carbs: (value) => `🍚 Carbs: ${value} g`,
    fiber: (value) => `🌾 Fiber: ${value} g`,
    dayStatus: "Quick day status:",
    foodEntries: (count) => `🥗 Food: ${count} entr${count === 1 ? "y" : "ies"}`,
    waterLine: (consumed, target) => `💧 Water: ${consumed} / ${target} ml`,
    nextFirstStep: "The simplest next step is to add the first meal or water.",
    nextCoachingStep: "I can suggest the next step for protein, water, or calories.",
    done: "Done. I updated Smart Nutrition data.",
  },
};

const getCopy = (language) => copy[normalizeLanguage(language)] ?? copy.uk;

const formatReminderTimes = (reminder, language = "uk") =>
  Array.isArray(reminder?.times) && reminder.times.length > 0
    ? reminder.times.join(", ")
    : getCopy(language).scheduleFallback;

const getMedicationReminderTitle = (reminder, language = "uk") =>
  String(reminder?.title ?? reminder?.name ?? getCopy(language).reminderFallback).trim() ||
  getCopy(language).reminderFallback;

const getReminderKindLabel = (reminderKind, language = "uk") =>
  getCopy(language).reminderKinds[reminderKind] ?? getCopy(language).reminderKinds.medication;

const getReminderActionPhrase = (reminderKind, language = "uk") => {
  const labels = getCopy(language).actionPhrases;
  if (
    reminderKind === "medication" ||
    reminderKind === "medication_course" ||
    reminderKind === "pregnancy_supplement"
  ) {
    return labels.medication;
  }

  if (reminderKind === "water") {
    return labels.water;
  }

  return labels.task;
};

const getProductTitle = (product, language = "uk") =>
  [product?.brand, product?.name]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .trim() || getCopy(language).productFallback;

const formatMealType = (mealType, language = "uk") =>
  getCopy(language).mealTypes[mealType] ?? getCopy(language).mealTypes.snack;

export const buildAgentReply = ({ intent, toolResult, language = "uk" }) => {
  const text = getCopy(language);

  if (!toolResult?.ok) {
    if (intent.intent === "add_water" || intent.intent === "show_water_status") {
      return text.waterFailed.join("\n");
    }

    if (intent.intent === "add_meal" || intent.intent === "search_product") {
      if (toolResult?.code === "PRODUCT_NOT_FOUND") {
        return text
          .productNotFound(toolResult.query ?? intent.entities?.productQuery)
          .join("\n");
      }

      return text.foodFailed;
    }

    if (intent.intent === "log_weight") {
      return text.weightFailed.join("\n");
    }

    if (intent.intent === "create_medication_reminder") {
      return text.medicationScheduleFailed.join("\n");
    }

    if (intent.intent === "create_task_reminder") {
      return text.taskScheduleFailed.join("\n");
    }

    if (
      intent.intent === "create_water_reminder" ||
      intent.intent === "create_habit_reminder" ||
      intent.intent === "create_medication_course_reminder" ||
      intent.intent === "create_pregnancy_supplement_reminder"
    ) {
      return text.typedReminderFailed.join("\n");
    }

    return text.genericFailed;
  }

  if (toolResult.type === "water_added") {
    const consumed = toolResult.water?.consumedMl ?? 0;
    const target = toolResult.water?.targetMl ?? 0;
    const remaining = Math.max(target - consumed, 0);

    return [
      text.waterAdded(formatNumber(toolResult.amountMl)),
      text.currentWater(formatNumber(consumed), formatNumber(target), formatPercent(consumed, target)),
      remaining > 0
        ? text.waterRemaining(formatNumber(remaining))
        : text.waterClosed,
    ].join("\n");
  }

  if (toolResult.type === "product_search") {
    const products = Array.isArray(toolResult.products) ? toolResult.products : [];

    if (products.length === 0) {
      return text.productSearchEmpty(toolResult.query).join("\n");
    }

    return [
      text.productSearchHeader(products.length, toolResult.query),
      ...products.slice(0, 5).map((product, index) =>
        `${index + 1}. ${getProductTitle(product, language)} — ${formatNumber(
          product?.nutrients?.calories
        )} kcal / 100 ${product?.unit ?? "g"}`
      ),
      text.productSearchHint,
    ].join("\n");
  }

  if (toolResult.type === "meal_added") {
    const product = toolResult.product;
    const nutrients = toolResult.nutrients ?? {};

    return [
      text.mealAdded(
        getProductTitle(product, language),
        formatNumber(toolResult.quantity),
        product?.unit ?? "g"
      ),
      text.mealTypeLine(formatMealType(toolResult.mealType, language)),
      text.mealNutrients(
        formatNumber(nutrients.calories),
        formatNumber(nutrients.protein, 1),
        formatNumber(nutrients.fat, 1),
        formatNumber(nutrients.carbs, 1)
      ),
    ].join("\n");
  }

  if (toolResult.type === "weight_logged") {
    const previousWeight = Number(toolResult.previousWeightKg);
    const currentWeight = Number(toolResult.weightKg);
    const hasPreviousWeight = Number.isFinite(previousWeight) && previousWeight > 0;
    const delta = hasPreviousWeight
      ? Math.round((currentWeight - previousWeight) * 10) / 10
      : 0;

    return [
      text.weightLogged(formatNumber(currentWeight, 1)),
      hasPreviousWeight
        ? text.weightTrend(`${delta > 0 ? "+" : ""}${formatNumber(delta, 1)}`)
        : text.weightTrendFirst,
    ].join("\n");
  }

  if (toolResult.type === "medication_reminder_created") {
    const reminder = toolResult.reminder;
    const womenHealthMode = toolResult.healthContext?.womenHealthMode;
    const needsPregnancySafety =
      womenHealthMode === "pregnant" || womenHealthMode === "trying_to_conceive";

    return [
      text.medicationCreated,
      `${getMedicationReminderTitle(reminder, language)} — ${formatReminderTimes(reminder, language)}`,
      text.medicationButtons,
      needsPregnancySafety ? text.pregnancySafety : null,
      text.clinicianSafety,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (toolResult.type === "task_reminder_created") {
    const reminder = toolResult.reminder;

    return [
      text.taskCreated,
      `${getMedicationReminderTitle(reminder, language)} — ${formatReminderTimes(reminder, language)}`,
      reminder.repeat === "once" ? text.repeatOnce : text.repeatDaily,
      text.taskButtons,
    ].join("\n");
  }

  if (toolResult.type === "reminder_created") {
    const reminder = toolResult.reminder;
    const reminderKind = toolResult.reminderKind ?? reminder?.type;
    const doseLine = reminder?.dose ? text.details(reminder.dose) : null;
    const safetyLine =
      reminderKind === "pregnancy_supplement"
        ? text.pregnancyReminderSafety
        : null;

    return [
      text.reminderCreated(getReminderKindLabel(reminderKind, language)),
      `${getMedicationReminderTitle(reminder, language)} — ${formatReminderTimes(reminder, language)}`,
      doseLine,
      reminder?.repeat === "once" ? text.repeatOnce : text.repeatDaily,
      safetyLine,
      text.telegramButtons(getReminderActionPhrase(reminderKind, language)),
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (toolResult.type === "water_status") {
    const consumed = toolResult.water?.consumedMl ?? 0;
    const target = toolResult.water?.targetMl ?? 0;
    const remaining = Math.max(target - consumed, 0);

    return [
      text.waterToday,
      `💧 ${formatNumber(consumed)} / ${formatNumber(target)} ${text.waterUnit} (${formatPercent(consumed, target)})`,
      remaining > 0
        ? text.waterLeft(formatNumber(remaining))
        : text.waterGoalClosed,
    ].join("\n");
  }

  if (toolResult.type === "nutrition_status") {
    const nutrients = toolResult.nutrients ?? {};

    return [
      text.nutritionToday,
      text.mealEntries(toolResult.mealCount),
      text.calories(formatNumber(nutrients.calories), formatNumber(toolResult.dailyCalories)),
      text.protein(formatNumber(nutrients.protein, 1)),
      text.fat(formatNumber(nutrients.fat, 1)),
      text.carbs(formatNumber(nutrients.carbs, 1)),
      text.fiber(formatNumber(nutrients.fiber, 1)),
    ].join("\n");
  }

  if (toolResult.type === "day_status") {
    const nutrients = toolResult.nutrients ?? {};
    const water = toolResult.water ?? {};

    return [
      text.dayStatus,
      text.foodEntries(toolResult.mealCount),
      text.calories(formatNumber(nutrients.calories), formatNumber(toolResult.dailyCalories)),
      text.protein(formatNumber(nutrients.protein, 1)),
      text.waterLine(formatNumber(water.consumedMl), formatNumber(water.targetMl)),
      toolResult.mealCount === 0 ? text.nextFirstStep : text.nextCoachingStep,
    ].join("\n");
  }

  return text.done;
};
