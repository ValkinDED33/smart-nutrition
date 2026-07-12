const MEDICATION_REMINDER_SCAN_INTERVAL_MS = 60_000;
const DEFAULT_REMINDER_TIMEZONE = "Europe/Warsaw";
const TELEGRAM_SNOOZE_MINUTES = 15;
const REMINDER_LANGUAGE_FALLBACK = "uk";
const REMINDER_SUPPORTED_LANGUAGES = new Set(["uk", "pl", "en"]);
const REMINDER_LOCALES = {
  uk: "uk-UA",
  pl: "pl-PL",
  en: "en-US",
};
const REMINDER_COPY = {
  uk: {
    timeMissing: "час не задан",
    dose: (dose) => `\nДоза: ${dose}`,
    statusActive: "активне",
    statusPaused: "пауза",
    notScheduled: "не заплановано",
    kinds: {
      medication_course: "Курс ліків",
      pregnancy_supplement: "Вагітність",
      water: "Вода",
      habit: "Звичка",
      task: "Задача",
      medication: "Ліки",
    },
    safetyNote:
      "Медична безпека: я тільки нагадую і веду журнал. Дозування, призначення або зміну лікування погоджуйте з лікарем.",
    details: {
      time: "Час",
      timezone: "Часовий пояс",
      status: "Статус",
      next: "Найближче",
      repeatOnce: "Повтор: один раз",
      repeatDaily: "Повтор: щодня",
      duration: (days) => `Тривалість: ${days} дн.`,
    },
    usage: [
      "Напишіть нагадування про ліки простими словами.",
      "",
      "Приклади:",
      "Амоксиклав 875 мг, 2 раза в день, 08:00 и 20:00, 7 дней",
      "Напоминай пить витамин D по 1 капсуле каждый день в 9 утра",
      "",
      "Команди:",
      "/addmed <текст> — створити нагадування",
      "/addwater <текст> — вода за розкладом",
      "/addhabit <текст> — звичка за розкладом",
      "/meds — список активних нагадувань",
      "",
      "Я тільки нагадую і веду журнал. Призначення, дозування і зміни лікування потрібно узгоджувати з лікарем.",
    ],
    created: "Готово, нагадування створено.",
    nextReminder: "Найближче нагадування",
    medicationCreatedHint:
      "Коли прийде нагадування, можна натиснути: прийняла, через 15 хвилин або пропустити.",
    taskCreatedHint:
      "Коли прийде нагадування, можна натиснути: зроблено, через 15 хвилин або пропустити.",
    notificationStart: {
      pregnancy_supplement: "Час для добавки за вашим планом.",
      medication_course: "Час прийому з курсу ліків.",
      medication: "Пора прийняти ліки.",
      task: "Нагадування.",
    },
    notificationHint: "Позначте дію кнопкою нижче, щоб я вів журнал.",
    taskNotificationHint: "Позначте дію кнопкою нижче, щоб я не губив контекст.",
    noMedicationReminders: [
      "Активних нагадувань про ліки поки немає.",
      "",
      "Створити можна так:",
      "/addmed Вітамін D 1 капсула щодня о 09:00",
    ],
    noReminders: [
      "Активних нагадувань поки немає.",
      "",
      "Приклади:",
      "/addtask Подзвонити лікарю о 10:00",
      "/addmed Вітамін D 1 капсула щодня о 09:00",
    ],
    activeReminders: "Активні нагадування:",
    keyboard: {
      taken: "✅ Прийняла",
      done: "✅ Зроблено",
      snooze15: "⏰ Через 15 хв",
      edit: "✏️ Змінити",
      pause: "⏸ Пауза",
      resume: "▶️ Увімкнути",
      skip: "Пропустити",
      delete: "🗑 Видалити",
      confirmDelete: "Так, видалити",
      cancel: "Скасувати",
    },
    scheduleUpdated: "Готово, я оновив час останнього нагадування.",
    newTime: "Новий час",
    unavailable: "Нагадування тимчасово недоступні.",
    scheduleUnavailable: "Зміна часу нагадувань тимчасово недоступна.",
    actionUnavailable: "Ця дія для нагадувань тимчасово недоступна.",
    taskParseFailed:
      "Не зміг безпечно розібрати час. Напишіть так: /addtask Подзвонити лікарю о 10:00",
    timeParseFailed:
      "Не зміг розпізнати новий час. Напишіть, наприклад: 22:00 або о 9 ранку.",
    updateFailed: "Не зміг оновити нагадування. Відкрийте /reminders і спробуйте ще раз.",
    lookupFailure: {
      missing: "Напишіть назву нагадування. Наприклад: змінити магній на 22:00.",
      ambiguous:
        "Знайшов кілька схожих нагадувань. Відкрийте /reminders і натисніть кнопку біля потрібного.",
      notFound: "Не знайшов таке нагадування. Відкрийте /reminders і перевірте назву.",
    },
    editPrompt: (title, id) => [
      `Що змінити для "${title}"?`,
      "Напишіть новий час, наприклад: 22:00 або о 9 ранку.",
      "Якщо бот перезапуститься або відповідь загубиться, використайте команду:",
      `/settime ${id} 22:00`,
    ],
    deleteQuestion: (title) => `Видалити нагадування "${title}"?`,
    paused: "Нагадування поставлено на паузу.",
    resumed: "Нагадування увімкнено.",
    connectTelegram: "Підключіть Telegram у профілі.",
    notDeleting: "Не видаляю.",
    kept: "Добре, нагадування залишилось.",
    notFound: "Нагадування не знайдено.",
    confirmationRequired: "Потрібне підтвердження.",
    writeNewTime: "Напишіть новий час.",
    callbackAnswers: {
      taken: "Записано: прийнято.",
      done: "Записано: зроблено.",
      snooze: "Нагадаю пізніше.",
      snooze15: "Нагадаю через 15 хвилин.",
      skipped: "Записано: пропущено.",
      confirm_delete: "Нагадування видалено.",
      pause: "Нагадування на паузі.",
      resume: "Нагадування увімкнено.",
      fallback: "Готово.",
    },
    addTaskHint: "Напишіть так: /addtask Подзвонити лікарю о 10:00",
    addWaterHint: "Напишіть так: /addwater Склянка води щодня о 09:00 і 13:00",
    addHabitHint: "Напишіть так: /addhabit 10 хв прогулянки щодня о 19:00",
    addSupplementHint:
      "Напишіть так: /addsupplement Фолієва кислота 1 капсула щодня о 09:00",
    addGenericHint: [
      "Напишіть текст нагадування після /add.",
      "",
      "Приклади:",
      "/addtask Подзвонити лікарю о 10:00",
      "/addmed Вітамін D 1 капсула щодня о 09:00",
    ],
    setTimeHint: [
      "Напишіть так:",
      "/settime <id-нагадування> 22:00",
      "",
      "ID є у повідомленні після кнопки ✏️ Змінити.",
    ],
  },
  pl: {
    timeMissing: "czas nie ustawiony",
    dose: (dose) => `\nDawka: ${dose}`,
    statusActive: "aktywne",
    statusPaused: "pauza",
    notScheduled: "nie zaplanowano",
    kinds: {
      medication_course: "Kurs leków",
      pregnancy_supplement: "Ciąża",
      water: "Woda",
      habit: "Nawyk",
      task: "Zadanie",
      medication: "Leki",
    },
    safetyNote:
      "Bezpieczeństwo medyczne: tylko przypominam i prowadzę dziennik. Dawkowanie, zalecenia lub zmianę leczenia uzgadniaj z lekarzem.",
    details: {
      time: "Czas",
      timezone: "Strefa czasowa",
      status: "Status",
      next: "Najbliższe",
      repeatOnce: "Powtórka: jeden raz",
      repeatDaily: "Powtórka: codziennie",
      duration: (days) => `Czas trwania: ${days} dni`,
    },
    usage: [
      "Napisz przypomnienie o lekach prostymi słowami.",
      "",
      "Przykłady:",
      "Amoksiklav 875 mg, 2 razy dziennie, 08:00 i 20:00, 7 dni",
      "Przypominaj o witaminie D, 1 kapsułka codziennie o 9 rano",
      "",
      "Komendy:",
      "/addmed <tekst> — utwórz przypomnienie",
      "/addwater <tekst> — woda według harmonogramu",
      "/addhabit <tekst> — nawyk według harmonogramu",
      "/meds — lista aktywnych przypomnień",
      "",
      "Tylko przypominam i prowadzę dziennik. Zalecenia, dawkowanie i zmiany leczenia uzgadniaj z lekarzem.",
    ],
    created: "Gotowe, przypomnienie utworzone.",
    nextReminder: "Najbliższe przypomnienie",
    medicationCreatedHint:
      "Gdy przyjdzie przypomnienie, możesz nacisnąć: przyjęte, za 15 minut albo pomiń.",
    taskCreatedHint:
      "Gdy przyjdzie przypomnienie, możesz nacisnąć: zrobione, za 15 minut albo pomiń.",
    notificationStart: {
      pregnancy_supplement: "Czas na suplement zgodnie z Twoim planem.",
      medication_course: "Czas dawki z kursu leków.",
      medication: "Czas przyjąć lek.",
      task: "Przypomnienie.",
    },
    notificationHint: "Zaznacz akcję przyciskiem niżej, żebym prowadził dziennik.",
    taskNotificationHint: "Zaznacz akcję przyciskiem niżej, żebym nie zgubił kontekstu.",
    noMedicationReminders: [
      "Nie ma jeszcze aktywnych przypomnień o lekach.",
      "",
      "Możesz utworzyć tak:",
      "/addmed Witamina D 1 kapsułka codziennie o 09:00",
    ],
    noReminders: [
      "Nie ma jeszcze aktywnych przypomnień.",
      "",
      "Przykłady:",
      "/addtask Zadzwonić do lekarza o 10:00",
      "/addmed Witamina D 1 kapsułka codziennie o 09:00",
    ],
    activeReminders: "Aktywne przypomnienia:",
    keyboard: {
      taken: "✅ Przyjęte",
      done: "✅ Zrobione",
      snooze15: "⏰ Za 15 min",
      edit: "✏️ Zmień",
      pause: "⏸ Pauza",
      resume: "▶️ Włącz",
      skip: "Pomiń",
      delete: "🗑 Usuń",
      confirmDelete: "Tak, usuń",
      cancel: "Anuluj",
    },
    scheduleUpdated: "Gotowe, zaktualizowałem czas ostatniego przypomnienia.",
    newTime: "Nowy czas",
    unavailable: "Przypomnienia są chwilowo niedostępne.",
    scheduleUnavailable: "Zmiana czasu przypomnień jest chwilowo niedostępna.",
    actionUnavailable: "Ta akcja dla przypomnień jest chwilowo niedostępna.",
    taskParseFailed:
      "Nie mogłem bezpiecznie odczytać czasu. Napisz tak: /addtask Zadzwonić do lekarza o 10:00",
    timeParseFailed:
      "Nie mogłem rozpoznać nowego czasu. Napisz na przykład: 22:00 albo o 9 rano.",
    updateFailed: "Nie mogłem zaktualizować przypomnienia. Otwórz /reminders i spróbuj ponownie.",
    lookupFailure: {
      missing: "Napisz nazwę przypomnienia. Na przykład: zmień magnez na 22:00.",
      ambiguous:
        "Znalazłem kilka podobnych przypomnień. Otwórz /reminders i naciśnij przycisk przy właściwym.",
      notFound: "Nie znalazłem takiego przypomnienia. Otwórz /reminders i sprawdź nazwę.",
    },
    editPrompt: (title, id) => [
      `Co zmienić dla "${title}"?`,
      "Napisz nowy czas, na przykład: 22:00 albo o 9 rano.",
      "Jeśli bot się zrestartuje albo odpowiedź zginie, użyj komendy:",
      `/settime ${id} 22:00`,
    ],
    deleteQuestion: (title) => `Usunąć przypomnienie "${title}"?`,
    paused: "Przypomnienie ustawione na pauzę.",
    resumed: "Przypomnienie włączone.",
    connectTelegram: "Połącz Telegram w profilu.",
    notDeleting: "Nie usuwam.",
    kept: "Dobrze, przypomnienie zostaje.",
    notFound: "Przypomnienie nie znalezione.",
    confirmationRequired: "Wymagane potwierdzenie.",
    writeNewTime: "Napisz nowy czas.",
    callbackAnswers: {
      taken: "Zapisano: przyjęte.",
      done: "Zapisano: zrobione.",
      snooze: "Przypomnę później.",
      snooze15: "Przypomnę za 15 minut.",
      skipped: "Zapisano: pominięte.",
      confirm_delete: "Przypomnienie usunięte.",
      pause: "Przypomnienie na pauzie.",
      resume: "Przypomnienie włączone.",
      fallback: "Gotowe.",
    },
    addTaskHint: "Napisz tak: /addtask Zadzwonić do lekarza o 10:00",
    addWaterHint: "Napisz tak: /addwater Szklanka wody codziennie o 09:00 i 13:00",
    addHabitHint: "Napisz tak: /addhabit 10 minut spaceru codziennie o 19:00",
    addSupplementHint:
      "Napisz tak: /addsupplement Kwas foliowy 1 kapsułka codziennie o 09:00",
    addGenericHint: [
      "Napisz tekst przypomnienia po /add.",
      "",
      "Przykłady:",
      "/addtask Zadzwonić do lekarza o 10:00",
      "/addmed Witamina D 1 kapsułka codziennie o 09:00",
    ],
    setTimeHint: [
      "Napisz tak:",
      "/settime <id-przypomnienia> 22:00",
      "",
      "ID jest w wiadomości po przycisku ✏️ Zmień.",
    ],
  },
  en: {
    timeMissing: "time not set",
    dose: (dose) => `\nDose: ${dose}`,
    statusActive: "active",
    statusPaused: "paused",
    notScheduled: "not scheduled",
    kinds: {
      medication_course: "Medication course",
      pregnancy_supplement: "Pregnancy",
      water: "Water",
      habit: "Habit",
      task: "Task",
      medication: "Medication",
    },
    safetyNote:
      "Medical safety: I only remind you and keep a log. Dosage, prescriptions, or treatment changes should be agreed with your clinician.",
    details: {
      time: "Time",
      timezone: "Time zone",
      status: "Status",
      next: "Next",
      repeatOnce: "Repeat: once",
      repeatDaily: "Repeat: daily",
      duration: (days) => `Duration: ${days} day(s)`,
    },
    usage: [
      "Write a medication reminder in plain language.",
      "",
      "Examples:",
      "Amoxiclav 875 mg, twice a day, 08:00 and 20:00, 7 days",
      "Remind me to take vitamin D, 1 capsule every day at 9 in the morning",
      "",
      "Commands:",
      "/addmed <text> — create a reminder",
      "/addwater <text> — scheduled water reminder",
      "/addhabit <text> — scheduled habit reminder",
      "/meds — list active reminders",
      "",
      "I only remind you and keep a log. Prescriptions, dosage, and treatment changes should be agreed with your clinician.",
    ],
    created: "Done, reminder created.",
    nextReminder: "Next reminder",
    medicationCreatedHint:
      "When the reminder arrives, you can press: taken, in 15 minutes, or skip.",
    taskCreatedHint:
      "When the reminder arrives, you can press: done, in 15 minutes, or skip.",
    notificationStart: {
      pregnancy_supplement: "Time for the supplement in your plan.",
      medication_course: "Time for a dose from your medication course.",
      medication: "Time to take your medication.",
      task: "Reminder.",
    },
    notificationHint: "Mark an action with the button below so I can keep the log.",
    taskNotificationHint: "Mark an action with the button below so I keep the context.",
    noMedicationReminders: [
      "There are no active medication reminders yet.",
      "",
      "You can create one like this:",
      "/addmed Vitamin D 1 capsule every day at 09:00",
    ],
    noReminders: [
      "There are no active reminders yet.",
      "",
      "Examples:",
      "/addtask Call the doctor at 10:00",
      "/addmed Vitamin D 1 capsule every day at 09:00",
    ],
    activeReminders: "Active reminders:",
    keyboard: {
      taken: "✅ Taken",
      done: "✅ Done",
      snooze15: "⏰ In 15 min",
      edit: "✏️ Edit",
      pause: "⏸ Pause",
      resume: "▶️ Enable",
      skip: "Skip",
      delete: "🗑 Delete",
      confirmDelete: "Yes, delete",
      cancel: "Cancel",
    },
    scheduleUpdated: "Done, I updated the latest reminder time.",
    newTime: "New time",
    unavailable: "Reminders are temporarily unavailable.",
    scheduleUnavailable: "Changing reminder time is temporarily unavailable.",
    actionUnavailable: "This reminder action is temporarily unavailable.",
    taskParseFailed:
      "I could not safely read the time. Write it like this: /addtask Call the doctor at 10:00",
    timeParseFailed:
      "I could not recognize the new time. Write, for example: 22:00 or 9 in the morning.",
    updateFailed: "I could not update the reminder. Open /reminders and try again.",
    lookupFailure: {
      missing: "Write the reminder name. For example: change magnesium to 22:00.",
      ambiguous:
        "I found several similar reminders. Open /reminders and press the button next to the right one.",
      notFound: "I did not find that reminder. Open /reminders and check the name.",
    },
    editPrompt: (title, id) => [
      `What should I change for "${title}"?`,
      "Write the new time, for example: 22:00 or 9 in the morning.",
      "If the bot restarts or the reply is lost, use this command:",
      `/settime ${id} 22:00`,
    ],
    deleteQuestion: (title) => `Delete reminder "${title}"?`,
    paused: "Reminder paused.",
    resumed: "Reminder enabled.",
    connectTelegram: "Connect Telegram in your profile.",
    notDeleting: "Not deleting.",
    kept: "Okay, the reminder stays.",
    notFound: "Reminder not found.",
    confirmationRequired: "Confirmation required.",
    writeNewTime: "Write the new time.",
    callbackAnswers: {
      taken: "Saved: taken.",
      done: "Saved: done.",
      snooze: "I will remind you later.",
      snooze15: "I will remind you in 15 minutes.",
      skipped: "Saved: skipped.",
      confirm_delete: "Reminder deleted.",
      pause: "Reminder paused.",
      resume: "Reminder enabled.",
      fallback: "Done.",
    },
    addTaskHint: "Write it like this: /addtask Call the doctor at 10:00",
    addWaterHint: "Write it like this: /addwater Glass of water every day at 09:00 and 13:00",
    addHabitHint: "Write it like this: /addhabit 10-minute walk every day at 19:00",
    addSupplementHint:
      "Write it like this: /addsupplement Folic acid 1 capsule every day at 09:00",
    addGenericHint: [
      "Write the reminder text after /add.",
      "",
      "Examples:",
      "/addtask Call the doctor at 10:00",
      "/addmed Vitamin D 1 capsule every day at 09:00",
    ],
    setTimeHint: [
      "Write it like this:",
      "/settime <reminder-id> 22:00",
      "",
      "The ID is in the message after the ✏️ Edit button.",
    ],
  },
};

const normalizeReminderLanguage = (value) => {
  const language = String(value ?? "").trim().toLowerCase();
  return REMINDER_SUPPORTED_LANGUAGES.has(language) ? language : REMINDER_LANGUAGE_FALLBACK;
};

const getReminderCopy = (language) =>
  REMINDER_COPY[normalizeReminderLanguage(language)] ?? REMINDER_COPY[REMINDER_LANGUAGE_FALLBACK];

const getReminderLanguageFromCode = (value) => {
  const code = String(value ?? "").trim().toLowerCase();

  if (code.startsWith("pl")) return "pl";
  if (code.startsWith("en")) return "en";
  if (code.startsWith("uk") || code.startsWith("ua")) return "uk";

  return REMINDER_LANGUAGE_FALLBACK;
};

const getReminderLanguageFromContext = (ctx) =>
  getReminderLanguageFromCode(
    ctx?.from?.language_code ??
      ctx?.message?.from?.language_code ??
      ctx?.callbackQuery?.from?.language_code ??
      ctx?.update?.callback_query?.from?.language_code ??
      ctx?.update?.message?.from?.language_code
  );

const toSafeErrorCode = (error) =>
  String(error?.code ?? error?.name ?? "TELEGRAM_MEDICATION_ERROR")
    .replace(/[^\w.-]+/g, "_")
    .slice(0, 80);

const toSafeErrorMessage = (error) =>
  String(error?.message ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);

const formatMedicationReminderTimes = (reminder, language = REMINDER_LANGUAGE_FALLBACK) =>
  Array.isArray(reminder?.times) && reminder.times.length > 0
    ? reminder.times.join(", ")
    : getReminderCopy(language).timeMissing;

const formatMedicationReminderDose = (reminder, language = REMINDER_LANGUAGE_FALLBACK) =>
  reminder?.dose ? getReminderCopy(language).dose(reminder.dose) : "";

const formatReminderDateTime = (
  reminder,
  value,
  language = REMINDER_LANGUAGE_FALLBACK
) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timeZone =
    typeof reminder?.timezone === "string" && reminder.timezone.trim()
      ? reminder.timezone.trim()
      : DEFAULT_REMINDER_TIMEZONE;
  const options = {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  };

  try {
    return new Intl.DateTimeFormat(REMINDER_LOCALES[normalizeReminderLanguage(language)], options).format(date);
  } catch {
    return new Intl.DateTimeFormat(REMINDER_LOCALES[REMINDER_LANGUAGE_FALLBACK], {
      ...options,
      timeZone: DEFAULT_REMINDER_TIMEZONE,
    }).format(date);
  }
};

const MEDICATION_LIKE_REMINDER_TYPES = new Set([
  "medication",
  "medication_course",
  "pregnancy_supplement",
]);

const isMedicationReminder = (reminder) =>
  MEDICATION_LIKE_REMINDER_TYPES.has(String(reminder?.type ?? "medication"));

const normalizeSearchText = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s:-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const getReminderStatusLabel = (reminder, language = REMINDER_LANGUAGE_FALLBACK) => {
  const copy = getReminderCopy(language);
  return reminder?.active ? copy.statusActive : copy.statusPaused;
};

const getReminderTimeZone = (reminder) =>
  typeof reminder?.timezone === "string" && reminder.timezone.trim()
    ? reminder.timezone.trim()
    : DEFAULT_REMINDER_TIMEZONE;

const formatReminderNextRun = (reminder, language = REMINDER_LANGUAGE_FALLBACK) =>
  reminder?.active && reminder?.nextRunAt
    ? formatReminderDateTime(reminder, reminder.nextRunAt, language)
    : getReminderCopy(language).notScheduled;

const buildReminderDetailsMessage = (
  reminder,
  language = REMINDER_LANGUAGE_FALLBACK
) => {
  const copy = getReminderCopy(language);

  return [
    `${formatReminderKindTitle(reminder, language)}: ${reminder.title}`,
    `${copy.details.time}: ${formatMedicationReminderTimes(reminder, language)}`,
    `${copy.details.timezone}: ${getReminderTimeZone(reminder)}`,
    `${copy.details.status}: ${getReminderStatusLabel(reminder, language)}`,
    `${copy.details.next}: ${formatReminderNextRun(reminder, language)}`,
    reminder.dose ? `${copy.dose(reminder.dose).trim()}` : null,
    reminder.repeat === "once" ? copy.details.repeatOnce : copy.details.repeatDaily,
    reminder.durationDays ? copy.details.duration(reminder.durationDays) : null,
    isMedicationReminder(reminder) ? `\n${copy.safetyNote}` : null,
  ]
    .filter(Boolean)
    .join("\n");
};

const getListableReminders = (reminders, { medicationsOnly = false } = {}) =>
  reminders.filter((reminder) => !medicationsOnly || isMedicationReminder(reminder));

const getLegacyReminderCreator = (reminders, kind) => {
  if (!reminders) {
    return null;
  }

  if (kind === "medication") {
    return reminders.createMedicationReminderFromText ?? reminders.createReminderFromText ?? null;
  }

  if (kind === "medication_course") {
    return reminders.createMedicationCourseReminderFromText ?? null;
  }

  if (kind === "pregnancy_supplement") {
    return reminders.createPregnancySupplementReminderFromText ?? null;
  }

  if (kind === "water") {
    return reminders.createWaterReminderFromText ?? null;
  }

  if (kind === "habit") {
    return reminders.createHabitReminderFromText ?? null;
  }

  if (kind === "task") {
    return reminders.createTaskReminderFromText ?? null;
  }

  return null;
};

const getReminderCreator = (reminders, kind) => {
  if (reminders?.createReminderFromUserText) {
    return (connectedUser, reminderText) =>
      reminders.createReminderFromUserText(connectedUser, {
        type: kind,
        text: reminderText,
      });
  }

  const legacyCreator = getLegacyReminderCreator(reminders, kind);

  return legacyCreator
    ? (connectedUser, reminderText) => legacyCreator(connectedUser, reminderText)
    : null;
};

const formatReminderKindTitle = (reminder, language = REMINDER_LANGUAGE_FALLBACK) => {
  const copy = getReminderCopy(language);
  return copy.kinds[reminder?.type] ?? copy.kinds.medication;
};

export const buildMedicationReminderUsageMessage = (
  language = REMINDER_LANGUAGE_FALLBACK
) => getReminderCopy(language).usage.join("\n");

export const buildMedicationReminderCreatedMessage = (
  reminder,
  language = REMINDER_LANGUAGE_FALLBACK
) => {
  const copy = getReminderCopy(language);

  return [
    copy.created,
    "",
    `${formatReminderKindTitle(reminder, language)}: ${reminder.title}`,
    `${copy.details.time}: ${formatMedicationReminderTimes(reminder, language)}`,
    reminder.dose ? copy.dose(reminder.dose).trim() : null,
    reminder.durationDays ? copy.details.duration(reminder.durationDays) : null,
    reminder.nextRunAt
      ? `${copy.nextReminder}: ${formatReminderDateTime(reminder, reminder.nextRunAt, language)}`
      : null,
    "",
    copy.medicationCreatedHint,
    "",
    isMedicationReminder(reminder) ? copy.safetyNote : null,
  ]
    .filter(Boolean)
    .join("\n");
};

export const buildMedicationReminderNotificationMessage = (
  reminder,
  language = REMINDER_LANGUAGE_FALLBACK
) => {
  const copy = getReminderCopy(language);

  return [
    copy.notificationStart[reminder?.type] ?? copy.notificationStart.medication,
    "",
    `${formatReminderKindTitle(reminder, language)}: ${reminder.title}`,
    `${copy.details.time}: ${formatMedicationReminderTimes(reminder, language)}`,
    formatMedicationReminderDose(reminder, language).trim() || null,
    "",
    copy.notificationHint,
  ]
    .filter(Boolean)
    .join("\n");
};

export const buildMedicationReminderListMessage = (
  reminders,
  language = REMINDER_LANGUAGE_FALLBACK
) => {
  const copy = getReminderCopy(language);
  const activeReminders = getListableReminders(reminders, { medicationsOnly: true });

  if (activeReminders.length === 0) {
    return copy.noMedicationReminders.join("\n");
  }

  return [
    copy.activeReminders,
    "",
    ...activeReminders.map((reminder, index) =>
      [
        `${index + 1}. ${reminder.title}`,
        `   ${copy.details.time}: ${formatMedicationReminderTimes(reminder, language)}`,
        `   ${copy.details.timezone}: ${getReminderTimeZone(reminder)}`,
        `   ${copy.details.status}: ${getReminderStatusLabel(reminder, language)}`,
        `   ${copy.details.next}: ${formatReminderNextRun(reminder, language)}`,
        reminder.dose ? `   ${copy.dose(reminder.dose).trim()}` : null,
        reminder.durationDays ? `   ${copy.details.duration(reminder.durationDays)}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    ),
    "",
    copy.safetyNote,
  ].join("\n");
};

export const buildReminderListMessage = (
  reminders,
  language = REMINDER_LANGUAGE_FALLBACK
) => {
  const copy = getReminderCopy(language);
  const activeReminders = getListableReminders(reminders);

  if (activeReminders.length === 0) {
    return copy.noReminders.join("\n");
  }

  return [
    copy.activeReminders,
    "",
    ...activeReminders.map((reminder, index) =>
      [
        `${index + 1}. ${formatReminderKindTitle(reminder, language)}: ${reminder.title}`,
        `   ${copy.details.time}: ${formatMedicationReminderTimes(reminder, language)}`,
        `   ${copy.details.timezone}: ${getReminderTimeZone(reminder)}`,
        `   ${copy.details.status}: ${getReminderStatusLabel(reminder, language)}`,
        `   ${copy.details.next}: ${formatReminderNextRun(reminder, language)}`,
        reminder.dose ? `   ${copy.dose(reminder.dose).trim()}` : null,
        reminder.repeat === "once" ? `   ${copy.details.repeatOnce}` : null,
        reminder.durationDays ? `   ${copy.details.duration(reminder.durationDays)}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    ),
  ].join("\n");
};

const buildReminderManagementKeyboard = (
  reminder,
  language = REMINDER_LANGUAGE_FALLBACK
) => {
  const copy = getReminderCopy(language);

  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: isMedicationReminder(reminder) ? copy.keyboard.taken : copy.keyboard.done,
            callback_data: `rem:${isMedicationReminder(reminder) ? "taken" : "done"}:${reminder.id}`,
          },
          { text: copy.keyboard.snooze15, callback_data: `rem:snooze15:${reminder.id}` },
        ],
        [
          { text: copy.keyboard.edit, callback_data: `rem:edit:${reminder.id}` },
          {
            text: reminder.active ? copy.keyboard.pause : copy.keyboard.resume,
            callback_data: `rem:${reminder.active ? "pause" : "resume"}:${reminder.id}`,
          },
        ],
        [
          { text: copy.keyboard.skip, callback_data: `rem:skipped:${reminder.id}` },
          { text: copy.keyboard.delete, callback_data: `rem:delete:${reminder.id}` },
        ],
      ],
    },
  };
};

const buildDeleteConfirmationKeyboard = (
  reminder,
  language = REMINDER_LANGUAGE_FALLBACK
) => {
  const copy = getReminderCopy(language);

  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: copy.keyboard.confirmDelete, callback_data: `rem:confirm_delete:${reminder.id}` },
          { text: copy.keyboard.cancel, callback_data: `rem:cancel_delete:${reminder.id}` },
        ],
      ],
    },
  };
};

const buildMedicationReminderKeyboard = buildReminderManagementKeyboard;
const buildTaskReminderKeyboard = buildReminderManagementKeyboard;

export const buildTaskReminderCreatedMessage = (
  reminder,
  language = REMINDER_LANGUAGE_FALLBACK
) => {
  const copy = getReminderCopy(language);

  return [
    copy.created,
    "",
    `${formatReminderKindTitle(reminder, language)}: ${reminder.title}`,
    `${copy.details.time}: ${formatMedicationReminderTimes(reminder, language)}`,
    reminder.repeat === "once" ? copy.details.repeatOnce : copy.details.repeatDaily,
    reminder.durationDays ? copy.details.duration(reminder.durationDays) : null,
    reminder.nextRunAt
      ? `${copy.nextReminder}: ${formatReminderDateTime(reminder, reminder.nextRunAt, language)}`
      : null,
    "",
    copy.taskCreatedHint,
  ]
    .filter(Boolean)
    .join("\n");
};

export const buildTaskReminderNotificationMessage = (
  reminder,
  language = REMINDER_LANGUAGE_FALLBACK
) => {
  const copy = getReminderCopy(language);

  return [
    copy.notificationStart.task,
    "",
    `${formatReminderKindTitle(reminder, language)}: ${reminder.title}`,
    `${copy.details.time}: ${formatMedicationReminderTimes(reminder, language)}`,
    "",
    copy.taskNotificationHint,
  ].join("\n");
};

export const buildReminderScheduleUpdatedMessage = (
  reminder,
  language = REMINDER_LANGUAGE_FALLBACK
) => {
  const copy = getReminderCopy(language);

  return [
    copy.scheduleUpdated,
    "",
    `${formatReminderKindTitle(reminder, language)}: ${reminder.title}`,
    `${copy.newTime}: ${formatMedicationReminderTimes(reminder, language)}`,
    reminder.nextRunAt
      ? `${copy.nextReminder}: ${formatReminderDateTime(reminder, reminder.nextRunAt, language)}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
};

const getCommandArgument = (ctx) =>
  String(ctx.message?.text ?? "")
    .replace(/^\/[\w_]+(?:@\w+)?\s*/u, "")
    .trim();

const looksLikeMedicationReminderText = (text) =>
  /(\d{1,2}[:.]\d{2}|\d{1,2}\s*(?:раз(?:а)?|разів|times?)|утром|ранку|вечером|вечір|morning|evening)/iu.test(
    String(text ?? "")
  ) &&
  /(мг|mg|мл|ml|таблет|табл|капсул|капс|витамин|вітамін|магний|магній|лекар|ліки|пить|пити|принимать|приймати)/iu.test(
    String(text ?? "")
  );

const looksLikeWaterReminderText = (text) =>
  /(напомни|напоминай|нагадай|нагадуй|remind|щодня|каждый|daily)/iu.test(
    String(text ?? "")
  ) &&
  /(вода|воды|води|water|склянк|стакан|glass)/iu.test(String(text ?? "")) &&
  /(\d{1,2}[:.]\d{2}|\d{1,2}\s*(?:раз(?:а)?|разів|times?)|утром|ранку|вечером|вечір|morning|evening)/iu.test(
    String(text ?? "")
  );

const looksLikeHabitReminderText = (text) =>
  /(звичк|привычк|habit|routine|рутин)/iu.test(String(text ?? "")) &&
  /(\d{1,2}[:.]\d{2}|утром|ранку|вечером|вечір|morning|evening|щодня|каждый|daily)/iu.test(
    String(text ?? "")
  );

const looksLikeScheduleCorrectionText = (text) =>
  /^(?:ой|ой,|сорри|sorry|краще|лучше|а|и|та)?\s*(?:в|о|at)?\s*(?:[01]?\d|2[0-3])(?::[0-5]\d)?\s*[.!?]*$/iu.test(
    String(text ?? "").trim()
  );

const looksLikeReminderListText = (text) =>
  /(?:^|\s)(?:что|шо|що|покажи|покажы|список|list|show)(?:\s|$)/iu.test(
    String(text ?? "")
  ) &&
  /(?:напомин|нагадув|reminder|таблет|ліки|лекар|медикамент)/iu.test(String(text ?? ""));

const looksLikeMedicationListText = (text) =>
  /(?:таблет|ліки|лекар|медикамент|витамин|вітамін|магний|магній)/iu.test(
    String(text ?? "")
  );

const getReminderManagementIntent = (text) => {
  const normalized = String(text ?? "").trim();

  if (/^(?:удали|удалить|видали|видалити|delete|remove)(?:\s|$)/iu.test(normalized)) {
    return "delete";
  }

  if (
    /^(?:отключи|выключи|пауза|поставь на паузу|зупини|вимкни|pause)(?:\s|$)/iu.test(normalized)
  ) {
    return "pause";
  }

  if (
    /^(?:включи|увімкни|возобнови|віднови|resume|enable)(?:\s|$)/iu.test(normalized)
  ) {
    return "resume";
  }

  if (
    /^(?:измени|изменить|поменяй|перенеси|зміні|змінити|update|edit)(?:\s|$)/iu.test(normalized)
  ) {
    return "edit";
  }

  return null;
};

const stripReminderManagementWords = (text) =>
  normalizeSearchText(text)
    .replace(
      /(?:^|\s)(?:удали|удалить|видали|видалити|delete|remove|отключи|выключи|пауза|поставь|на|зупини|вимкни|pause|включи|увімкни|возобнови|віднови|resume|enable|измени|изменить|поменяй|перенеси|зміні|змінити|update|edit|напоминание|напоминания|нагадування|reminder|таблетки|таблетку|таблеток|ліки|лекарство|лекарства)(?=\s|$)/giu,
      " "
    )
    .replace(/(?:^|\s)(?:[01]?\d|2[0-3])[:.][0-5]\d(?=\s|$)/gu, " ")
    .replace(/(?:^|\s)(?:[01]?\d|2[0-3])(?=\s|$)/gu, " ")
    .replace(/(?:^|\s)(?:в|о|at|на|to)(?=\s|$)/giu, " ")
    .replace(/\s+/g, " ")
    .trim();

const findReminderByText = (reminders, text, { medicationsOnly = false } = {}) => {
  const candidates = getListableReminders(reminders, { medicationsOnly });
  const target = stripReminderManagementWords(text);

  if (!target) {
    return { ok: false, code: "REMINDER_TARGET_MISSING" };
  }

  const matches = candidates.filter((reminder) =>
    normalizeSearchText(reminder.title).includes(target)
  );

  if (matches.length === 1) {
    return { ok: true, reminder: matches[0] };
  }

  if (matches.length > 1) {
    return { ok: false, code: "REMINDER_TARGET_AMBIGUOUS" };
  }

  return { ok: false, code: "REMINDER_NOT_FOUND" };
};

const buildReminderLookupFailureMessage = (
  code,
  language = REMINDER_LANGUAGE_FALLBACK
) => {
  const copy = getReminderCopy(language);

  if (code === "REMINDER_TARGET_MISSING") {
    return copy.lookupFailure.missing;
  }

  if (code === "REMINDER_TARGET_AMBIGUOUS") {
    return copy.lookupFailure.ambiguous;
  }

  return copy.lookupFailure.notFound;
};

const buildReminderEditPrompt = (
  reminder,
  language = REMINDER_LANGUAGE_FALLBACK
) => {
  const copy = getReminderCopy(language);

  return [
    ...copy.editPrompt(reminder.title, reminder.id),
    isMedicationReminder(reminder) ? copy.safetyNote : null,
  ]
    .filter(Boolean)
    .join("\n");
};

export const createTelegramMedicationReminderRuntime = ({
  configured,
  authRepository,
  reminderService = null,
  medicationReminderService,
  getConnectedUser,
  getUserLanguage,
  writeAuditLog,
  sendTelegramMessage,
  logger = console,
} = {}) => {
  const reminders = reminderService ?? medicationReminderService;
  let interval = null;
  let scanRunning = false;
  const editSessions = new Map();

  const getChatSessionKey = (ctx) =>
    ctx.chat?.id === undefined
      ? ctx.callbackQuery?.message?.chat?.id === undefined
        ? ""
        : String(ctx.callbackQuery.message.chat.id)
      : String(ctx.chat.id);

  const resolveUserLanguage = async (user, ctx = null) =>
    normalizeReminderLanguage(
      (user && (await getUserLanguage?.(user))) ??
        user?.languagePreference ??
        getReminderLanguageFromContext(ctx)
    );

  const replyWithList = async (ctx, { medicationsOnly = false } = {}) => {
    const user = await getConnectedUser(ctx);

    if (!user) {
      return;
    }
    const language = await resolveUserLanguage(user, ctx);
    const copy = getReminderCopy(language);

    if (!reminders?.getUserReminders) {
      await ctx.reply(copy.unavailable);
      return;
    }

    const userReminders = reminders.getUserReminders(user);
    const visibleReminders = getListableReminders(userReminders, { medicationsOnly });

    await ctx.reply(
      medicationsOnly
        ? buildMedicationReminderListMessage(userReminders, language)
        : buildReminderListMessage(userReminders, language)
    );

    for (const reminder of visibleReminders.slice(0, 10)) {
      await ctx.reply(
        buildReminderDetailsMessage(reminder, language),
        buildReminderManagementKeyboard(reminder, language)
      );
    }
  };

  const createFromText = async (ctx, text, { kind = "medication" } = {}) => {
    const user = await getConnectedUser(ctx);

    if (!user) {
      return;
    }
    const language = await resolveUserLanguage(user, ctx);
    const copy = getReminderCopy(language);

    const createReminder = getReminderCreator(reminders, kind);

    if (!createReminder) {
      await ctx.reply(copy.unavailable);
      return;
    }

    const result = await createReminder(user, text);

    if (!result.ok) {
      await ctx.reply(
        kind === "task"
          ? copy.taskParseFailed
          : buildMedicationReminderUsageMessage(language)
      );
      return;
    }

    await writeAuditLog?.({
      user: result.user ?? user,
      action:
        kind === "task"
          ? "telegram.task_reminder.created"
          : `telegram.${kind}_reminder.created`,
      details: {
        provider: "telegram",
        reminderId: result.reminder.id,
        times: result.reminder.times,
      },
    });
    await ctx.reply(
      !isMedicationReminder(result.reminder)
        ? buildTaskReminderCreatedMessage(result.reminder, language)
        : buildMedicationReminderCreatedMessage(result.reminder, language)
    );
  };

  const updateLatestScheduleFromText = async (ctx, text) => {
    const user = await getConnectedUser(ctx);

    if (!user) {
      return false;
    }
    const language = await resolveUserLanguage(user, ctx);

    if (!reminders?.updateLatestReminderSchedule) {
      return false;
    }

    const result = await reminders.updateLatestReminderSchedule(user, text);

    if (!result.ok) {
      return false;
    }

    await writeAuditLog?.({
      user: result.user ?? user,
      action: `telegram.${result.reminder?.type ?? "reminder"}_reminder.schedule_updated`,
      details: {
        provider: "telegram",
        reminderId: result.reminder.id,
        times: result.reminder.times,
      },
    });
    await ctx.reply(buildReminderScheduleUpdatedMessage(result.reminder, language));

    return true;
  };

  const updateReminderScheduleFromText = async (ctx, reminderId, text) => {
    const user = await getConnectedUser(ctx);

    if (!user) {
      return false;
    }
    const language = await resolveUserLanguage(user, ctx);
    const copy = getReminderCopy(language);

    if (!reminders?.updateReminderSchedule) {
      await ctx.reply(copy.scheduleUnavailable);
      return true;
    }

    const result = await reminders.updateReminderSchedule(user, reminderId, text);

    if (!result.ok) {
      await ctx.reply(copy.timeParseFailed);
      return true;
    }

    await writeAuditLog?.({
      user: result.user ?? user,
      action: `telegram.${result.reminder?.type ?? "reminder"}_reminder.schedule_updated`,
      details: {
        provider: "telegram",
        reminderId: result.reminder.id,
        times: result.reminder.times,
      },
    });
    await ctx.reply(buildReminderScheduleUpdatedMessage(result.reminder, language));

    return true;
  };

  const handleReminderManagementText = async (ctx, text) => {
    const intent = getReminderManagementIntent(text);

    if (!intent) {
      return false;
    }

    const user = await getConnectedUser(ctx);

    if (!user) {
      return true;
    }
    const language = await resolveUserLanguage(user, ctx);
    const copy = getReminderCopy(language);

    if (!reminders?.getUserReminders) {
      await ctx.reply(copy.unavailable);
      return true;
    }

    const lookup = findReminderByText(reminders.getUserReminders(user), text, {
      medicationsOnly: looksLikeMedicationListText(text),
    });

    if (!lookup.ok) {
      await ctx.reply(buildReminderLookupFailureMessage(lookup.code, language));
      return true;
    }

    if (intent === "edit") {
      if (/\b([01]?\d|2[0-3])[:.]?([0-5]\d)?\b/u.test(text)) {
        return updateReminderScheduleFromText(ctx, lookup.reminder.id, text);
      }

      const sessionKey = getChatSessionKey(ctx);
      editSessions.set(sessionKey, {
        reminderId: lookup.reminder.id,
        createdAt: Date.now(),
      });
      await ctx.reply(buildReminderEditPrompt(lookup.reminder, language));
      return true;
    }

    if (intent === "delete") {
      await ctx.reply(
        copy.deleteQuestion(lookup.reminder.title),
        buildDeleteConfirmationKeyboard(lookup.reminder, language)
      );
      return true;
    }

    const action =
      intent === "pause" ? reminders.pauseReminder : reminders.resumeReminder;

    if (!action) {
      await ctx.reply(copy.actionUnavailable);
      return true;
    }

    const result = await action(user, lookup.reminder.id, new Date());

    if (!result.ok) {
      await ctx.reply(copy.updateFailed);
      return true;
    }

    await writeAuditLog?.({
      user: result.user ?? user,
      action: `telegram.${result.reminder?.type ?? "reminder"}_reminder.${intent}`,
      details: {
        provider: "telegram",
        reminderId: result.reminder.id,
      },
    });
    await ctx.reply(intent === "pause" ? copy.paused : copy.resumed);

    return true;
  };

  const handleCallback = async (ctx) => {
    const data = String(ctx.callbackQuery?.data ?? "");
    const match = data.match(
      /^(med|rem):(taken|done|snooze|snooze15|skipped|delete|confirm_delete|cancel_delete|edit|pause|resume):(.+)$/u
    );

    if (!match) {
      return false;
    }

    const [, reminderKind, action, reminderId] = match;
    const user = await getConnectedUser(ctx);

    if (!user) {
      await ctx.answerCbQuery?.(getReminderCopy(getReminderLanguageFromContext(ctx)).connectTelegram);
      return true;
    }
    const language = await resolveUserLanguage(user, ctx);
    const copy = getReminderCopy(language);

    if (!reminders) {
      await ctx.answerCbQuery?.(copy.unavailable);
      return true;
    }

    if (action === "cancel_delete") {
      await ctx.answerCbQuery?.(copy.notDeleting);
      await ctx.reply(copy.kept);
      return true;
    }

    const reminder = reminders.getUserReminders?.(user)?.find((item) => item.id === reminderId);

    if ((action === "delete" || action === "edit") && !reminder) {
      await ctx.answerCbQuery?.(copy.notFound);
      return true;
    }

    if (action === "delete") {
      await ctx.answerCbQuery?.(copy.confirmationRequired);
      await ctx.reply(
        copy.deleteQuestion(reminder.title),
        buildDeleteConfirmationKeyboard(reminder, language)
      );
      return true;
    }

    if (action === "edit") {
      const sessionKey = getChatSessionKey(ctx);
      editSessions.set(sessionKey, {
        reminderId,
        createdAt: Date.now(),
      });
      await ctx.answerCbQuery?.(copy.writeNewTime);
      await ctx.reply(buildReminderEditPrompt(reminder, language));
      return true;
    }

    const now = new Date();
    const recordAction =
      reminders.recordReminderAction ??
      reminders.recordMedicationAction ??
      reminders.recordDoseAction;
    let result = null;

    if (action === "confirm_delete") {
      const deleteAction = reminders.deleteReminder ?? reminders.deactivateReminder;
      result = await deleteAction(user, reminderId, now);
    } else if (action === "pause") {
      result = reminders.pauseReminder
        ? await reminders.pauseReminder(user, reminderId, now)
        : await reminders.deactivateReminder(user, reminderId, now);
    } else if (action === "resume") {
      result = reminders.resumeReminder
        ? await reminders.resumeReminder(user, reminderId, now)
        : { ok: false, code: "REMINDER_RESUME_UNSUPPORTED" };
    } else if (action === "snooze15" && reminders.snoozeReminder) {
      result = await reminders.snoozeReminder(user, reminderId, TELEGRAM_SNOOZE_MINUTES, now);
    } else if (!recordAction) {
      result = { ok: false, code: "REMINDER_ACTION_UNSUPPORTED" };
    } else {
      result = await recordAction(
        user,
        reminderId,
        action === "snooze" || action === "snooze15" ? "snoozed" : action,
        now
      );
    }

    if (!result.ok) {
      await ctx.answerCbQuery?.(copy.notFound);
      return true;
    }

    const auditReminderType =
      result.reminder?.type ?? (reminderKind === "rem" ? "task" : "medication");

    await writeAuditLog?.({
      user: result.user ?? user,
      action: `telegram.${auditReminderType}_reminder.${action}`,
      details: {
        provider: "telegram",
        reminderId,
      },
    });
    await ctx.answerCbQuery?.(copy.callbackAnswers[action] ?? copy.callbackAnswers.fallback);

    if (action === "confirm_delete") {
      try {
        await ctx.editMessageReplyMarkup?.({ inline_keyboard: [] });
      } catch {
        // The original message can already be gone; the reminder itself is still disabled.
      }
    }

    return true;
  };

  const runScan = async () => {
    if (!configured || !reminders?.sendDueReminders || scanRunning) {
      return;
    }

    scanRunning = true;

    try {
      const users = await authRepository.listUsers?.();
      const connectedUsers = Array.isArray(users)
        ? users.filter((user) => user?.telegramChatId)
        : [];

      await reminders.sendDueReminders({
        users: connectedUsers,
        sendReminder: async (user, reminder) => {
          const language = await resolveUserLanguage(user);
          const result = await sendTelegramMessage(
            user.telegramChatId,
            isMedicationReminder(reminder)
              ? buildMedicationReminderNotificationMessage(reminder, language)
              : buildTaskReminderNotificationMessage(reminder, language),
            isMedicationReminder(reminder)
              ? buildMedicationReminderKeyboard(reminder, language)
              : buildTaskReminderKeyboard(reminder, language)
          );

          if (!result.ok) {
            throw new Error(result.code ?? "TELEGRAM_SEND_FAILED");
          }
        },
      });
    } catch (error) {
      logger.warn?.("[telegram] medication reminder scan failed", {
        provider: "telegram",
        code: toSafeErrorCode(error),
        message: toSafeErrorMessage(error),
      });
    } finally {
      scanRunning = false;
    }
  };

  const start = () => {
    if (!configured || interval || !reminders?.sendDueReminders) {
      return;
    }

    interval = setInterval(() => {
      void runScan();
    }, MEDICATION_REMINDER_SCAN_INTERVAL_MS);
    interval.unref?.();
    void runScan();
  };

  const stop = () => {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  };

  const registerHandlers = (bot) => {
    bot.command("meds", async (ctx) => {
      await replyWithList(ctx, { medicationsOnly: true });
    });

    bot.command("reminders", async (ctx) => {
      await replyWithList(ctx);
    });

    bot.command("addmed", async (ctx) => {
      const text = getCommandArgument(ctx);

      if (!text) {
        await ctx.reply(buildMedicationReminderUsageMessage(getReminderLanguageFromContext(ctx)));
        return;
      }

      await createFromText(ctx, text);
    });

    bot.command("addtask", async (ctx) => {
      const text = getCommandArgument(ctx);

      if (!text) {
        await ctx.reply(getReminderCopy(getReminderLanguageFromContext(ctx)).addTaskHint);
        return;
      }

      await createFromText(ctx, text, { kind: "task" });
    });

    bot.command("addwater", async (ctx) => {
      const text = getCommandArgument(ctx);

      if (!text) {
        await ctx.reply(getReminderCopy(getReminderLanguageFromContext(ctx)).addWaterHint);
        return;
      }

      await createFromText(ctx, text, { kind: "water" });
    });

    bot.command("addhabit", async (ctx) => {
      const text = getCommandArgument(ctx);

      if (!text) {
        await ctx.reply(getReminderCopy(getReminderLanguageFromContext(ctx)).addHabitHint);
        return;
      }

      await createFromText(ctx, text, { kind: "habit" });
    });

    bot.command("addsupplement", async (ctx) => {
      const text = getCommandArgument(ctx);

      if (!text) {
        await ctx.reply(getReminderCopy(getReminderLanguageFromContext(ctx)).addSupplementHint);
        return;
      }

      await createFromText(ctx, text, { kind: "pregnancy_supplement" });
    });

    bot.command("add", async (ctx) => {
      const text = getCommandArgument(ctx);

      if (!text) {
        await ctx.reply(getReminderCopy(getReminderLanguageFromContext(ctx)).addGenericHint.join("\n"));
        return;
      }

      await createFromText(ctx, text, {
        kind: looksLikeWaterReminderText(text)
          ? "water"
          : looksLikeHabitReminderText(text)
            ? "habit"
            : looksLikeMedicationReminderText(text)
              ? "medication"
              : "task",
      });
    });

    bot.command("settime", async (ctx) => {
      const text = getCommandArgument(ctx);
      const match = text.match(/^(\S+)\s+(.+)$/u);

      if (!match) {
        await ctx.reply(getReminderCopy(getReminderLanguageFromContext(ctx)).setTimeHint.join("\n"));
        return;
      }

      await updateReminderScheduleFromText(ctx, match[1], match[2]);
    });

    bot.on("callback_query", async (ctx) => {
      await handleCallback(ctx);
    });

    bot.on("text", async (ctx, next) => {
      const text = String(ctx.message?.text ?? "").trim();

      if (!text || text.startsWith("/")) {
        await next?.();
        return;
      }

      const sessionKey = getChatSessionKey(ctx);
      const editSession = editSessions.get(sessionKey);

      if (editSession) {
        editSessions.delete(sessionKey);
        const updated = await updateReminderScheduleFromText(ctx, editSession.reminderId, text);

        if (updated) {
          return;
        }
      }

      if (looksLikeScheduleCorrectionText(text)) {
        const updated = await updateLatestScheduleFromText(ctx, text);

        if (updated) {
          return;
        }
      }

      if (looksLikeReminderListText(text)) {
        await replyWithList(ctx, { medicationsOnly: looksLikeMedicationListText(text) });
        return;
      }

      if (await handleReminderManagementText(ctx, text)) {
        return;
      }

      if (looksLikeWaterReminderText(text)) {
        await createFromText(ctx, text, { kind: "water" });
        return;
      }

      if (looksLikeHabitReminderText(text)) {
        await createFromText(ctx, text, { kind: "habit" });
        return;
      }

      if (looksLikeMedicationReminderText(text)) {
        await createFromText(ctx, text, { kind: "medication" });
        return;
      }

      await next?.();
    });
  };

  return {
    registerHandlers,
    start,
    stop,
    getStatus: () => ({
      enabled: Boolean(reminders),
      polling: Boolean(interval),
      scanIntervalMs: MEDICATION_REMINDER_SCAN_INTERVAL_MS,
      capabilities: {
        medication: Boolean(
          reminders?.createMedicationReminderFromText ?? reminders?.createReminderFromText
        ),
        medicationCourse: Boolean(
          reminders?.createMedicationCourseReminderFromText ?? reminders?.createReminderFromUserText
        ),
        pregnancySupplement: Boolean(
          reminders?.createPregnancySupplementReminderFromText ??
            reminders?.createReminderFromUserText
        ),
        water: Boolean(reminders?.createWaterReminderFromText ?? reminders?.createReminderFromUserText),
        habit: Boolean(reminders?.createHabitReminderFromText ?? reminders?.createReminderFromUserText),
        task: Boolean(reminders?.createTaskReminderFromText ?? reminders?.createReminderFromUserText),
      },
    }),
  };
};
