const MEDICATION_REMINDER_SCAN_INTERVAL_MS = 60_000;

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

const MEDICATION_LIKE_REMINDER_TYPES = new Set([
  "medication",
  "medication_course",
  "pregnancy_supplement",
]);

const isMedicationReminder = (reminder) =>
  MEDICATION_LIKE_REMINDER_TYPES.has(String(reminder?.type ?? "medication"));

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
    `Ліки: ${reminder.title}`,
    `Час: ${formatMedicationReminderTimes(reminder)}`,
    reminder.dose ? `Доза: ${reminder.dose}` : null,
    reminder.durationDays ? `Тривалість: ${reminder.durationDays} дн.` : null,
    reminder.nextRunAt
      ? `Найближче нагадування: ${new Date(reminder.nextRunAt).toLocaleString("uk-UA")}`
      : null,
    "",
    "Коли прийде нагадування, можна натиснути: прийняла, через 10 хвилин або пропустити.",
  ]
    .filter(Boolean)
    .join("\n");

export const buildMedicationReminderNotificationMessage = (reminder) =>
  [
    "Пора прийняти ліки.",
    "",
    `Ліки: ${reminder.title}`,
    `Час: ${formatMedicationReminderTimes(reminder)}`,
    formatMedicationReminderDose(reminder).trim() || null,
    "",
    "Позначте дію кнопкою нижче, щоб я вів журнал.",
  ]
    .filter(Boolean)
    .join("\n");

export const buildMedicationReminderListMessage = (reminders) => {
  const activeReminders = reminders.filter(
    (reminder) => reminder.active && isMedicationReminder(reminder)
  );

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
        reminder.dose ? `   Доза: ${reminder.dose}` : null,
        reminder.durationDays ? `   Тривалість: ${reminder.durationDays} дн.` : null,
      ]
        .filter(Boolean)
        .join("\n")
    ),
    "",
    "Щоб видалити конкретне нагадування, дочекайтесь повідомлення або створіть нове з правильним графіком.",
  ].join("\n");
};

export const buildReminderListMessage = (reminders) => {
  const activeReminders = reminders.filter((reminder) => reminder.active);

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
        reminder.dose ? `   Доза: ${reminder.dose}` : null,
        reminder.repeat === "once" ? "   Повтор: один раз" : null,
        reminder.durationDays ? `   Тривалість: ${reminder.durationDays} дн.` : null,
      ]
        .filter(Boolean)
        .join("\n")
    ),
  ].join("\n");
};

const buildMedicationReminderKeyboard = (reminder) => ({
  reply_markup: {
    inline_keyboard: [
      [
        { text: "Прийняла", callback_data: `med:taken:${reminder.id}` },
        { text: "Через 10 хв", callback_data: `med:snooze:${reminder.id}` },
      ],
      [
        { text: "Пропустити", callback_data: `med:skipped:${reminder.id}` },
        { text: "Видалити", callback_data: `med:delete:${reminder.id}` },
      ],
    ],
  },
});

const buildTaskReminderKeyboard = (reminder) => ({
  reply_markup: {
    inline_keyboard: [
      [
        { text: "Зроблено", callback_data: `rem:done:${reminder.id}` },
        { text: "Через 10 хв", callback_data: `rem:snooze:${reminder.id}` },
      ],
      [
        { text: "Пропустити", callback_data: `rem:skipped:${reminder.id}` },
        { text: "Видалити", callback_data: `rem:delete:${reminder.id}` },
      ],
    ],
  },
});

export const buildTaskReminderCreatedMessage = (reminder) =>
  [
    "Готово, нагадування створено.",
    "",
    `${formatReminderKindTitle(reminder)}: ${reminder.title}`,
    `Час: ${formatMedicationReminderTimes(reminder)}`,
    reminder.repeat === "once" ? "Повтор: один раз" : "Повтор: щодня",
    reminder.durationDays ? `Тривалість: ${reminder.durationDays} дн.` : null,
    reminder.nextRunAt
      ? `Найближче нагадування: ${new Date(reminder.nextRunAt).toLocaleString("uk-UA")}`
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

  const replyWithList = async (ctx, { medicationsOnly = false } = {}) => {
    const user = await getConnectedUser(ctx);

    if (!user) {
      return;
    }

    if (!reminders?.getUserReminders) {
      await ctx.reply("Нагадування тимчасово недоступні.");
      return;
    }

    await ctx.reply(
      medicationsOnly
        ? buildMedicationReminderListMessage(reminders.getUserReminders(user))
        : buildReminderListMessage(reminders.getUserReminders(user))
    );
  };

  const createFromText = async (ctx, text, { kind = "medication" } = {}) => {
    const user = await getConnectedUser(ctx);

    if (!user) {
      return;
    }

    const createReminder = reminders?.createReminderFromUserText
      ? (connectedUser, reminderText) =>
          reminders.createReminderFromUserText(connectedUser, {
            type: kind,
            text: reminderText,
          })
      : kind === "task"
        ? reminders?.createTaskReminderFromText
        : reminders?.createMedicationReminderFromText ?? reminders?.createReminderFromText;

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

  const handleCallback = async (ctx) => {
    const data = String(ctx.callbackQuery?.data ?? "");
    const match = data.match(/^(med|rem):(taken|done|snooze|skipped|delete):(.+)$/u);

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

    const now = new Date();
    const recordAction =
      reminders.recordReminderAction ??
      reminders.recordMedicationAction ??
      reminders.recordDoseAction;
    const result =
      action === "delete"
        ? await reminders.deactivateReminder(user, reminderId, now)
        : await recordAction(
            user,
            reminderId,
            action === "snooze" ? "snoozed" : action,
            now
          );

    if (!result.ok) {
      await ctx.answerCbQuery?.("Нагадування не знайдено.");
      return true;
    }

    const answerByAction = {
      taken: "Записано: прийнято.",
      done: "Записано: зроблено.",
      snooze: "Нагадаю через 10 хвилин.",
      skipped: "Записано: пропущено.",
      delete: "Нагадування вимкнено.",
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

    if (action === "delete") {
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

    bot.on("callback_query", async (ctx) => {
      await handleCallback(ctx);
    });

    bot.on("text", async (ctx, next) => {
      const text = String(ctx.message?.text ?? "").trim();

      if (!text || text.startsWith("/")) {
        await next?.();
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
