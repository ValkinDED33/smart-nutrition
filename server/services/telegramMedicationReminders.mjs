const MEDICATION_REMINDER_SCAN_INTERVAL_MS = 60_000;
const DEFAULT_REMINDER_TIMEZONE = "Europe/Warsaw";
const TELEGRAM_SNOOZE_MINUTES = 15;
const MEDICATION_SAFETY_NOTE =
  "Медична безпека: я тільки нагадую і веду журнал. Дозування, призначення або зміну лікування погоджуйте з лікарем.";

const toSafeErrorCode = (error) =>
  String(error?.code ?? error?.name ?? "TELEGRAM_MEDICATION_ERROR")
    .replace(/[^\w.-]+/g, "_")
    .slice(0, 80);

const toSafeErrorMessage = (error) =>
  String(error?.message ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);

const formatMedicationReminderTimes = (reminder) =>
  Array.isArray(reminder?.times) && reminder.times.length > 0
    ? reminder.times.join(", ")
    : "час не задан";

const formatMedicationReminderDose = (reminder) =>
  reminder?.dose ? `\nДоза: ${reminder.dose}` : "";

const formatReminderDateTime = (reminder, value) => {
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
    return new Intl.DateTimeFormat("uk-UA", options).format(date);
  } catch {
    return new Intl.DateTimeFormat("uk-UA", {
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

const getReminderStatusLabel = (reminder) => (reminder?.active ? "активне" : "пауза");

const getReminderTimeZone = (reminder) =>
  typeof reminder?.timezone === "string" && reminder.timezone.trim()
    ? reminder.timezone.trim()
    : DEFAULT_REMINDER_TIMEZONE;

const formatReminderNextRun = (reminder) =>
  reminder?.active && reminder?.nextRunAt
    ? formatReminderDateTime(reminder, reminder.nextRunAt)
    : "не заплановано";

const buildReminderDetailsMessage = (reminder) =>
  [
    `${formatReminderKindTitle(reminder)}: ${reminder.title}`,
    `Час: ${formatMedicationReminderTimes(reminder)}`,
    `Часовий пояс: ${getReminderTimeZone(reminder)}`,
    `Статус: ${getReminderStatusLabel(reminder)}`,
    `Найближче: ${formatReminderNextRun(reminder)}`,
    reminder.dose ? `Доза: ${reminder.dose}` : null,
    reminder.repeat === "once" ? "Повтор: один раз" : "Повтор: щодня",
    reminder.durationDays ? `Тривалість: ${reminder.durationDays} дн.` : null,
    isMedicationReminder(reminder) ? `\n${MEDICATION_SAFETY_NOTE}` : null,
  ]
    .filter(Boolean)
    .join("\n");

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

const formatReminderKindTitle = (reminder) => {
  if (reminder?.type === "medication_course") return "Курс ліків";
  if (reminder?.type === "pregnancy_supplement") return "Вагітність";
  if (reminder?.type === "water") return "Вода";
  if (reminder?.type === "habit") return "Звичка";
  if (reminder?.type === "task") return "Задача";

  return "Ліки";
};

export const buildMedicationReminderUsageMessage = () =>
  [
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
  ].join("\n");

export const buildMedicationReminderCreatedMessage = (reminder) =>
  [
    "Готово, нагадування створено.",
    "",
    `${formatReminderKindTitle(reminder)}: ${reminder.title}`,
    `Час: ${formatMedicationReminderTimes(reminder)}`,
    reminder.dose ? `Доза: ${reminder.dose}` : null,
    reminder.durationDays ? `Тривалість: ${reminder.durationDays} дн.` : null,
    reminder.nextRunAt
      ? `Найближче нагадування: ${formatReminderDateTime(reminder, reminder.nextRunAt)}`
      : null,
    "",
    "Коли прийде нагадування, можна натиснути: прийняла, через 15 хвилин або пропустити.",
    "",
    isMedicationReminder(reminder) ? MEDICATION_SAFETY_NOTE : null,
  ]
    .filter(Boolean)
    .join("\n");

export const buildMedicationReminderNotificationMessage = (reminder) =>
  [
    reminder?.type === "pregnancy_supplement"
      ? "Час для добавки за вашим планом."
      : reminder?.type === "medication_course"
        ? "Час прийому з курсу ліків."
        : "Пора прийняти ліки.",
    "",
    `${formatReminderKindTitle(reminder)}: ${reminder.title}`,
    `Час: ${formatMedicationReminderTimes(reminder)}`,
    formatMedicationReminderDose(reminder).trim() || null,
    "",
    "Позначте дію кнопкою нижче, щоб я вів журнал.",
  ]
    .filter(Boolean)
    .join("\n");

export const buildMedicationReminderListMessage = (reminders) => {
  const activeReminders = getListableReminders(reminders, { medicationsOnly: true });

  if (activeReminders.length === 0) {
    return [
      "Активних нагадувань про ліки поки немає.",
      "",
      "Створити можна так:",
      "/addmed Вітамін D 1 капсула щодня о 09:00",
    ].join("\n");
  }

  return [
    "Активні нагадування:",
    "",
    ...activeReminders.map((reminder, index) =>
      [
        `${index + 1}. ${reminder.title}`,
        `   Час: ${formatMedicationReminderTimes(reminder)}`,
        `   Часовий пояс: ${getReminderTimeZone(reminder)}`,
        `   Статус: ${getReminderStatusLabel(reminder)}`,
        `   Найближче: ${formatReminderNextRun(reminder)}`,
        reminder.dose ? `   Доза: ${reminder.dose}` : null,
        reminder.durationDays ? `   Тривалість: ${reminder.durationDays} дн.` : null,
      ]
        .filter(Boolean)
        .join("\n")
    ),
    "",
    MEDICATION_SAFETY_NOTE,
  ].join("\n");
};

export const buildReminderListMessage = (reminders) => {
  const activeReminders = getListableReminders(reminders);

  if (activeReminders.length === 0) {
    return [
      "Активних нагадувань поки немає.",
      "",
      "Приклади:",
      "/addtask Подзвонити лікарю о 10:00",
      "/addmed Вітамін D 1 капсула щодня о 09:00",
    ].join("\n");
  }

  return [
    "Активні нагадування:",
    "",
    ...activeReminders.map((reminder, index) =>
      [
        `${index + 1}. ${formatReminderKindTitle(reminder)}: ${reminder.title}`,
        `   Час: ${formatMedicationReminderTimes(reminder)}`,
        `   Часовий пояс: ${getReminderTimeZone(reminder)}`,
        `   Статус: ${getReminderStatusLabel(reminder)}`,
        `   Найближче: ${formatReminderNextRun(reminder)}`,
        reminder.dose ? `   Доза: ${reminder.dose}` : null,
        reminder.repeat === "once" ? "   Повтор: один раз" : null,
        reminder.durationDays ? `   Тривалість: ${reminder.durationDays} дн.` : null,
      ]
        .filter(Boolean)
        .join("\n")
    ),
  ].join("\n");
};

const buildReminderManagementKeyboard = (reminder) => ({
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: isMedicationReminder(reminder) ? "✅ Прийняла" : "✅ Зроблено",
          callback_data: `rem:${isMedicationReminder(reminder) ? "taken" : "done"}:${reminder.id}`,
        },
        { text: "⏰ Через 15 хв", callback_data: `rem:snooze15:${reminder.id}` },
      ],
      [
        { text: "✏️ Змінити", callback_data: `rem:edit:${reminder.id}` },
        {
          text: reminder.active ? "⏸ Пауза" : "▶️ Увімкнути",
          callback_data: `rem:${reminder.active ? "pause" : "resume"}:${reminder.id}`,
        },
      ],
      [
        { text: "Пропустити", callback_data: `rem:skipped:${reminder.id}` },
        { text: "🗑 Видалити", callback_data: `rem:delete:${reminder.id}` },
      ],
    ],
  },
});

const buildDeleteConfirmationKeyboard = (reminder) => ({
  reply_markup: {
    inline_keyboard: [
      [
        { text: "Так, видалити", callback_data: `rem:confirm_delete:${reminder.id}` },
        { text: "Скасувати", callback_data: `rem:cancel_delete:${reminder.id}` },
      ],
    ],
  },
});

const buildMedicationReminderKeyboard = buildReminderManagementKeyboard;
const buildTaskReminderKeyboard = buildReminderManagementKeyboard;

export const buildTaskReminderCreatedMessage = (reminder) =>
  [
    "Готово, нагадування створено.",
    "",
    `${formatReminderKindTitle(reminder)}: ${reminder.title}`,
    `Час: ${formatMedicationReminderTimes(reminder)}`,
    reminder.repeat === "once" ? "Повтор: один раз" : "Повтор: щодня",
    reminder.durationDays ? `Тривалість: ${reminder.durationDays} дн.` : null,
    reminder.nextRunAt
      ? `Найближче нагадування: ${formatReminderDateTime(reminder, reminder.nextRunAt)}`
      : null,
    "",
    "Коли прийде нагадування, можна натиснути: зроблено, пізніше або пропустити.",
  ]
    .filter(Boolean)
    .join("\n");

export const buildTaskReminderNotificationMessage = (reminder) =>
  [
    "Нагадування.",
    "",
    `${formatReminderKindTitle(reminder)}: ${reminder.title}`,
    `Час: ${formatMedicationReminderTimes(reminder)}`,
    "",
    "Позначте дію кнопкою нижче, щоб я не губив контекст.",
  ].join("\n");

export const buildReminderScheduleUpdatedMessage = (reminder) =>
  [
    "Готово, я оновив час останнього нагадування.",
    "",
    `${formatReminderKindTitle(reminder)}: ${reminder.title}`,
    `Новий час: ${formatMedicationReminderTimes(reminder)}`,
    reminder.nextRunAt
      ? `Найближче нагадування: ${formatReminderDateTime(reminder, reminder.nextRunAt)}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

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

const buildReminderLookupFailureMessage = (code) => {
  if (code === "REMINDER_TARGET_MISSING") {
    return "Напишіть назву нагадування. Наприклад: змінити магній на 22:00.";
  }

  if (code === "REMINDER_TARGET_AMBIGUOUS") {
    return "Знайшов кілька схожих нагадувань. Відкрийте /reminders і натисніть кнопку біля потрібного.";
  }

  return "Не знайшов таке нагадування. Відкрийте /reminders і перевірте назву.";
};

const buildReminderEditPrompt = (reminder) =>
  [
    `Що змінити для "${reminder.title}"?`,
    "Напишіть новий час, наприклад: 22:00 або о 9 ранку.",
    "Якщо бот перезапуститься або відповідь загубиться, використайте команду:",
    `/settime ${reminder.id} 22:00`,
    isMedicationReminder(reminder) ? MEDICATION_SAFETY_NOTE : null,
  ]
    .filter(Boolean)
    .join("\n");

export const createTelegramMedicationReminderRuntime = ({
  configured,
  authRepository,
  reminderService = null,
  medicationReminderService,
  getConnectedUser,
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

  const replyWithList = async (ctx, { medicationsOnly = false } = {}) => {
    const user = await getConnectedUser(ctx);

    if (!user) {
      return;
    }

    if (!reminders?.getUserReminders) {
      await ctx.reply("Нагадування тимчасово недоступні.");
      return;
    }

    const userReminders = reminders.getUserReminders(user);
    const visibleReminders = getListableReminders(userReminders, { medicationsOnly });

    await ctx.reply(
      medicationsOnly
        ? buildMedicationReminderListMessage(userReminders)
        : buildReminderListMessage(userReminders)
    );

    for (const reminder of visibleReminders.slice(0, 10)) {
      await ctx.reply(buildReminderDetailsMessage(reminder), buildReminderManagementKeyboard(reminder));
    }
  };

  const createFromText = async (ctx, text, { kind = "medication" } = {}) => {
    const user = await getConnectedUser(ctx);

    if (!user) {
      return;
    }

    const createReminder = getReminderCreator(reminders, kind);

    if (!createReminder) {
      await ctx.reply("Нагадування тимчасово недоступні.");
      return;
    }

    const result = await createReminder(user, text);

    if (!result.ok) {
      await ctx.reply(
        kind === "task"
          ? "Не зміг безпечно розібрати час. Напишіть так: /addtask Подзвонити лікарю о 10:00"
          : buildMedicationReminderUsageMessage()
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
        ? buildTaskReminderCreatedMessage(result.reminder)
        : buildMedicationReminderCreatedMessage(result.reminder)
    );
  };

  const updateLatestScheduleFromText = async (ctx, text) => {
    const user = await getConnectedUser(ctx);

    if (!user) {
      return false;
    }

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
    await ctx.reply(buildReminderScheduleUpdatedMessage(result.reminder));

    return true;
  };

  const updateReminderScheduleFromText = async (ctx, reminderId, text) => {
    const user = await getConnectedUser(ctx);

    if (!user) {
      return false;
    }

    if (!reminders?.updateReminderSchedule) {
      await ctx.reply("Зміна часу нагадувань тимчасово недоступна.");
      return true;
    }

    const result = await reminders.updateReminderSchedule(user, reminderId, text);

    if (!result.ok) {
      await ctx.reply(
        "Не зміг розпізнати новий час. Напишіть, наприклад: 22:00 або о 9 ранку."
      );
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
    await ctx.reply(buildReminderScheduleUpdatedMessage(result.reminder));

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

    if (!reminders?.getUserReminders) {
      await ctx.reply("Нагадування тимчасово недоступні.");
      return true;
    }

    const lookup = findReminderByText(reminders.getUserReminders(user), text, {
      medicationsOnly: looksLikeMedicationListText(text),
    });

    if (!lookup.ok) {
      await ctx.reply(buildReminderLookupFailureMessage(lookup.code));
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
      await ctx.reply(buildReminderEditPrompt(lookup.reminder));
      return true;
    }

    if (intent === "delete") {
      await ctx.reply(
        `Видалити нагадування "${lookup.reminder.title}"?`,
        buildDeleteConfirmationKeyboard(lookup.reminder)
      );
      return true;
    }

    const action =
      intent === "pause" ? reminders.pauseReminder : reminders.resumeReminder;

    if (!action) {
      await ctx.reply("Ця дія для нагадувань тимчасово недоступна.");
      return true;
    }

    const result = await action(user, lookup.reminder.id, new Date());

    if (!result.ok) {
      await ctx.reply("Не зміг оновити нагадування. Відкрийте /reminders і спробуйте ще раз.");
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
    await ctx.reply(intent === "pause" ? "Нагадування поставлено на паузу." : "Нагадування увімкнено.");

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
      await ctx.answerCbQuery?.("Підключіть Telegram у профілі.");
      return true;
    }

    if (!reminders) {
      await ctx.answerCbQuery?.("Нагадування тимчасово недоступні.");
      return true;
    }

    if (action === "cancel_delete") {
      await ctx.answerCbQuery?.("Не видаляю.");
      await ctx.reply("Добре, нагадування залишилось.");
      return true;
    }

    const reminder = reminders.getUserReminders?.(user)?.find((item) => item.id === reminderId);

    if ((action === "delete" || action === "edit") && !reminder) {
      await ctx.answerCbQuery?.("Нагадування не знайдено.");
      return true;
    }

    if (action === "delete") {
      await ctx.answerCbQuery?.("Потрібне підтвердження.");
      await ctx.reply(
        `Видалити нагадування "${reminder.title}"?`,
        buildDeleteConfirmationKeyboard(reminder)
      );
      return true;
    }

    if (action === "edit") {
      const sessionKey = getChatSessionKey(ctx);
      editSessions.set(sessionKey, {
        reminderId,
        createdAt: Date.now(),
      });
      await ctx.answerCbQuery?.("Напишіть новий час.");
      await ctx.reply(buildReminderEditPrompt(reminder));
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
      await ctx.answerCbQuery?.("Нагадування не знайдено.");
      return true;
    }

    const answerByAction = {
      taken: "Записано: прийнято.",
      done: "Записано: зроблено.",
      snooze: "Нагадаю пізніше.",
      snooze15: "Нагадаю через 15 хвилин.",
      skipped: "Записано: пропущено.",
      confirm_delete: "Нагадування видалено.",
      pause: "Нагадування на паузі.",
      resume: "Нагадування увімкнено.",
    };

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
    await ctx.answerCbQuery?.(answerByAction[action] ?? "Готово.");

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
          const result = await sendTelegramMessage(
            user.telegramChatId,
            isMedicationReminder(reminder)
              ? buildMedicationReminderNotificationMessage(reminder)
              : buildTaskReminderNotificationMessage(reminder),
            isMedicationReminder(reminder)
              ? buildMedicationReminderKeyboard(reminder)
              : buildTaskReminderKeyboard(reminder)
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
        await ctx.reply(buildMedicationReminderUsageMessage());
        return;
      }

      await createFromText(ctx, text);
    });

    bot.command("addtask", async (ctx) => {
      const text = getCommandArgument(ctx);

      if (!text) {
        await ctx.reply("Напишіть так: /addtask Подзвонити лікарю о 10:00");
        return;
      }

      await createFromText(ctx, text, { kind: "task" });
    });

    bot.command("addwater", async (ctx) => {
      const text = getCommandArgument(ctx);

      if (!text) {
        await ctx.reply("Напишіть так: /addwater Склянка води щодня о 09:00 і 13:00");
        return;
      }

      await createFromText(ctx, text, { kind: "water" });
    });

    bot.command("addhabit", async (ctx) => {
      const text = getCommandArgument(ctx);

      if (!text) {
        await ctx.reply("Напишіть так: /addhabit 10 хв прогулянки щодня о 19:00");
        return;
      }

      await createFromText(ctx, text, { kind: "habit" });
    });

    bot.command("addsupplement", async (ctx) => {
      const text = getCommandArgument(ctx);

      if (!text) {
        await ctx.reply("Напишіть так: /addsupplement Фолієва кислота 1 капсула щодня о 09:00");
        return;
      }

      await createFromText(ctx, text, { kind: "pregnancy_supplement" });
    });

    bot.command("add", async (ctx) => {
      const text = getCommandArgument(ctx);

      if (!text) {
        await ctx.reply(
          [
            "Напишіть текст нагадування після /add.",
            "",
            "Приклади:",
            "/addtask Подзвонити лікарю о 10:00",
            "/addmed Вітамін D 1 капсула щодня о 09:00",
          ].join("\n")
        );
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
        await ctx.reply(
          [
            "Напишіть так:",
            "/settime <id-нагадування> 22:00",
            "",
            "ID є у повідомленні після кнопки ✏️ Змінити.",
          ].join("\n")
        );
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
        task: Boolean(reminders?.createTaskReminderFromText),
      },
    }),
  };
};
