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
  const activeReminders = reminders.filter((reminder) => reminder.active);

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

export const createTelegramMedicationReminderRuntime = ({
  configured,
  authRepository,
  medicationReminderService,
  getConnectedUser,
  writeAuditLog,
  sendTelegramMessage,
  logger = console,
} = {}) => {
  let interval = null;
  let scanRunning = false;

  const replyWithList = async (ctx) => {
    const user = await getConnectedUser(ctx);

    if (!user) {
      return;
    }

    if (!medicationReminderService?.getUserReminders) {
      await ctx.reply("Нагадування про ліки тимчасово недоступні.");
      return;
    }

    await ctx.reply(
      buildMedicationReminderListMessage(medicationReminderService.getUserReminders(user))
    );
  };

  const createFromText = async (ctx, text) => {
    const user = await getConnectedUser(ctx);

    if (!user) {
      return;
    }

    if (!medicationReminderService?.createReminderFromText) {
      await ctx.reply("Нагадування про ліки тимчасово недоступні.");
      return;
    }

    const result = await medicationReminderService.createReminderFromText(user, text);

    if (!result.ok) {
      await ctx.reply(buildMedicationReminderUsageMessage());
      return;
    }

    await writeAuditLog?.({
      user: result.user ?? user,
      action: "telegram.medication_reminder.created",
      details: {
        provider: "telegram",
        reminderId: result.reminder.id,
        times: result.reminder.times,
      },
    });
    await ctx.reply(buildMedicationReminderCreatedMessage(result.reminder));
  };

  const handleCallback = async (ctx) => {
    const data = String(ctx.callbackQuery?.data ?? "");
    const match = data.match(/^med:(taken|snooze|skipped|delete):(.+)$/u);

    if (!match) {
      return false;
    }

    const [, action, reminderId] = match;
    const user = await getConnectedUser(ctx);

    if (!user) {
      await ctx.answerCbQuery?.("Підключіть Telegram у профілі.");
      return true;
    }

    if (!medicationReminderService) {
      await ctx.answerCbQuery?.("Нагадування тимчасово недоступні.");
      return true;
    }

    const now = new Date();
    const result =
      action === "delete"
        ? await medicationReminderService.deactivateReminder(user, reminderId, now)
        : await medicationReminderService.recordDoseAction(
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
      snooze: "Нагадаю через 10 хвилин.",
      skipped: "Записано: пропущено.",
      delete: "Нагадування вимкнено.",
    };

    await writeAuditLog?.({
      user: result.user ?? user,
      action: `telegram.medication_reminder.${action}`,
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
    if (!configured || !medicationReminderService?.sendDueReminders || scanRunning) {
      return;
    }

    scanRunning = true;

    try {
      const users = await authRepository.listUsers?.();
      const connectedUsers = Array.isArray(users)
        ? users.filter((user) => user?.telegramChatId)
        : [];

      await medicationReminderService.sendDueReminders({
        users: connectedUsers,
        sendReminder: async (user, reminder) => {
          const result = await sendTelegramMessage(
            user.telegramChatId,
            buildMedicationReminderNotificationMessage(reminder),
            buildMedicationReminderKeyboard(reminder)
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
    if (!configured || interval || !medicationReminderService?.sendDueReminders) {
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
      await replyWithList(ctx);
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

    bot.command("add", async (ctx) => {
      const text = getCommandArgument(ctx);

      if (!text) {
        await ctx.reply(buildMedicationReminderUsageMessage());
        return;
      }

      await createFromText(ctx, text);
    });

    bot.on("callback_query", async (ctx) => {
      await handleCallback(ctx);
    });

    bot.on("text", async (ctx) => {
      const text = String(ctx.message?.text ?? "").trim();

      if (!text || text.startsWith("/")) {
        return;
      }

      if (looksLikeMedicationReminderText(text)) {
        await createFromText(ctx, text);
      }
    });
  };

  return {
    registerHandlers,
    start,
    stop,
    getStatus: () => ({
      enabled: Boolean(medicationReminderService),
      polling: Boolean(interval),
      scanIntervalMs: MEDICATION_REMINDER_SCAN_INTERVAL_MS,
    }),
  };
};
