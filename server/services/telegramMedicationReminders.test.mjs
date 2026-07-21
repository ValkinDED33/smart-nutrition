import { describe, expect, it, vi } from "vitest";
import {
  buildMedicationReminderCreatedMessage,
  buildMedicationReminderListMessage,
  buildReminderListMessage,
  buildTaskReminderCreatedMessage,
  createTelegramMedicationReminderRuntime,
} from "./telegramMedicationReminders.mjs";

const createReminder = (overrides = {}) => ({
  id: "med-test",
  title: "Вітамін D",
  dose: "1 капсула",
  times: ["09:00"],
  durationDays: null,
  active: true,
  nextRunAt: "2026-06-21T07:00:00.000Z",
  ...overrides,
});

const createBotHarness = () => {
  const commands = {};
  const events = {};
  const bot = {
    command: vi.fn((name, handler) => {
      commands[name] = handler;
    }),
    on: vi.fn((event, handler) => {
      events[event] = handler;
    }),
  };

  return { bot, commands, events };
};

describe("telegramMedicationReminders", () => {
  it("renders active medication reminder lists", () => {
    const message = buildMedicationReminderListMessage([createReminder()]);

    expect(message).toContain("Вітамін D");
    expect(message).toContain("09:00");
    expect(message).toContain("1 капсула");
  });

  it("keeps medication list focused and renders ordinary reminders in the full list", () => {
    const taskReminder = createReminder({
      id: "task-call",
      type: "task",
      title: "Подзвонити лікарю",
      dose: "",
    });

    expect(buildMedicationReminderListMessage([taskReminder])).not.toContain(
      "Подзвонити лікарю"
    );
    expect(buildReminderListMessage([createReminder(), taskReminder])).toContain(
      "Задача: Подзвонити лікарю"
    );
  });

  it("localizes medication reminder lists", () => {
    const message = buildMedicationReminderListMessage([createReminder()], "en");

    expect(message).toContain("Active reminders");
    expect(message).toContain("Dose: 1 капсула");
    expect(message).toContain("Medical safety");
    expect(message).not.toContain("Активні нагадування");
  });

  it("renders after-meal reminders as a trigger instead of a missing time", () => {
    const reminder = createReminder({
      times: [],
      nextRunAt: null,
      trigger: {
        kind: "after_meal",
        mealType: "lunch",
        offsetMinutes: 0,
        windowStart: "12:00",
        windowEnd: "16:30",
      },
    });
    const message = buildMedicationReminderCreatedMessage(reminder);

    expect(message).toContain("Умова: після обіду");
    expect(message).not.toContain("Час: час не задан");
  });

  it("formats next reminder time in the reminder timezone instead of server UTC", () => {
    const reminder = createReminder({
      times: ["10:00"],
      timezone: "Europe/Warsaw",
      nextRunAt: "2026-06-23T08:00:00.000Z",
    });

    expect(buildMedicationReminderCreatedMessage(reminder)).toContain(
      "Найближче нагадування: 23.06.2026, 10:00:00"
    );
    expect(
      buildTaskReminderCreatedMessage({
        ...reminder,
        type: "task",
        title: "Подзвонити лікарю",
        dose: "",
        repeat: "once",
      })
    ).toContain("Найближче нагадування: 23.06.2026, 10:00:00");
  });

  it("creates a reminder through /addmed and writes an audit log", async () => {
    const { bot, commands } = createBotHarness();
    const user = { id: "user-1", telegramChatId: "123" };
    const reminder = createReminder();
    const medicationReminderService = {
      createReminderFromText: vi.fn(async () => ({ ok: true, reminder, user })),
      getUserReminders: vi.fn(() => [reminder]),
    };
    const writeAuditLog = vi.fn(async () => {});
    const runtime = createTelegramMedicationReminderRuntime({
      configured: true,
      authRepository: { listUsers: vi.fn() },
      medicationReminderService,
      getConnectedUser: vi.fn(async () => user),
      writeAuditLog,
      sendTelegramMessage: vi.fn(),
      logger: { warn: vi.fn() },
    });
    const ctx = {
      message: { text: "/addmed Вітамін D 1 капсула щодня о 09:00" },
      reply: vi.fn(async () => {}),
    };

    runtime.registerHandlers(bot);
    await commands.addmed(ctx);

    expect(medicationReminderService.createReminderFromText).toHaveBeenCalledWith(
      user,
      "Вітамін D 1 капсула щодня о 09:00"
    );
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "telegram.medication_reminder.created",
      })
    );
    expect(ctx.reply.mock.calls[0][0]).toContain("нагадування створено");
  });

  it("uses the profile language for empty reminder command hints", async () => {
    const { bot, commands } = createBotHarness();
    const user = { id: "user-1", telegramChatId: "123", languagePreference: "pl" };
    const runtime = createTelegramMedicationReminderRuntime({
      configured: true,
      authRepository: { listUsers: vi.fn() },
      medicationReminderService: {
        createReminderFromText: vi.fn(),
        getUserReminders: vi.fn(() => []),
      },
      getConnectedUser: vi.fn(async () => user),
      writeAuditLog: vi.fn(),
      sendTelegramMessage: vi.fn(),
      logger: { warn: vi.fn() },
    });
    const ctx = {
      from: { language_code: "en" },
      message: { text: "/addmed" },
      reply: vi.fn(async () => {}),
    };

    runtime.registerHandlers(bot);
    await commands.addmed(ctx);

    expect(ctx.reply.mock.calls[0][0]).toContain("Napisz przypomnienie o lekach");
    expect(ctx.reply.mock.calls[0][0]).toContain("/addmed <tekst>");
    expect(ctx.reply.mock.calls[0][0]).not.toContain("Write a medication reminder");
  });

  it("creates an ordinary task reminder through /addtask", async () => {
    const { bot, commands } = createBotHarness();
    const user = { id: "user-1", telegramChatId: "123" };
    const reminder = createReminder({
      id: "task-call",
      type: "task",
      title: "Подзвонити лікарю",
      dose: "",
      repeat: "once",
    });
    const medicationReminderService = {
      createTaskReminderFromText: vi.fn(async () => ({ ok: true, reminder, user })),
      getUserReminders: vi.fn(() => [reminder]),
    };
    const writeAuditLog = vi.fn(async () => {});
    const runtime = createTelegramMedicationReminderRuntime({
      configured: true,
      authRepository: { listUsers: vi.fn() },
      medicationReminderService,
      getConnectedUser: vi.fn(async () => user),
      writeAuditLog,
      sendTelegramMessage: vi.fn(),
      logger: { warn: vi.fn() },
    });
    const ctx = {
      message: { text: "/addtask Подзвонити лікарю о 10:00" },
      reply: vi.fn(async () => {}),
    };

    runtime.registerHandlers(bot);
    await commands.addtask(ctx);

    expect(medicationReminderService.createTaskReminderFromText).toHaveBeenCalledWith(
      user,
      "Подзвонити лікарю о 10:00"
    );
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "telegram.task_reminder.created",
      })
    );
    expect(ctx.reply.mock.calls[0][0]).toContain("Задача: Подзвонити лікарю");
  });

  it("creates typed water reminders through /addwater", async () => {
    const { bot, commands } = createBotHarness();
    const user = { id: "user-1", telegramChatId: "123" };
    const reminder = createReminder({
      id: "water-1",
      type: "water",
      title: "Пити воду",
      dose: "250 мл",
      repeat: "daily",
    });
    const reminderService = {
      createReminderFromUserText: vi.fn(async () => ({ ok: true, reminder, user })),
      getUserReminders: vi.fn(() => [reminder]),
    };
    const runtime = createTelegramMedicationReminderRuntime({
      configured: true,
      authRepository: { listUsers: vi.fn() },
      reminderService,
      getConnectedUser: vi.fn(async () => user),
      writeAuditLog: vi.fn(async () => {}),
      sendTelegramMessage: vi.fn(),
      logger: { warn: vi.fn() },
    });
    const ctx = {
      message: { text: "/addwater Склянка води щодня о 09:00" },
      reply: vi.fn(async () => {}),
    };

    runtime.registerHandlers(bot);
    await commands.addwater(ctx);

    expect(reminderService.createReminderFromUserText).toHaveBeenCalledWith(user, {
      type: "water",
      text: "Склянка води щодня о 09:00",
    });
    expect(ctx.reply.mock.calls[0][0]).toContain("Вода: Пити воду");
  });

  it("routes /addwater to the legacy water creator instead of medication fallback", async () => {
    const { bot, commands } = createBotHarness();
    const user = { id: "user-1", telegramChatId: "123" };
    const reminder = createReminder({
      id: "water-legacy",
      type: "water",
      title: "Пити воду",
      dose: "250 мл",
      repeat: "daily",
    });
    const medicationReminderService = {
      createReminderFromText: vi.fn(async () => ({
        ok: true,
        reminder: createReminder({ title: "Wrong medication fallback" }),
        user,
      })),
      createWaterReminderFromText: vi.fn(async () => ({ ok: true, reminder, user })),
      getUserReminders: vi.fn(() => [reminder]),
    };
    const runtime = createTelegramMedicationReminderRuntime({
      configured: true,
      authRepository: { listUsers: vi.fn() },
      medicationReminderService,
      getConnectedUser: vi.fn(async () => user),
      writeAuditLog: vi.fn(async () => {}),
      sendTelegramMessage: vi.fn(),
      logger: { warn: vi.fn() },
    });
    const ctx = {
      message: { text: "/addwater Склянка води щодня о 09:00" },
      reply: vi.fn(async () => {}),
    };

    runtime.registerHandlers(bot);
    await commands.addwater(ctx);

    expect(medicationReminderService.createWaterReminderFromText).toHaveBeenCalledWith(
      user,
      "Склянка води щодня о 09:00"
    );
    expect(medicationReminderService.createReminderFromText).not.toHaveBeenCalled();
    expect(ctx.reply.mock.calls[0][0]).toContain("Вода: Пити воду");
  });

  it("does not create typed reminders through the medication parser when the typed creator is missing", async () => {
    const { bot, commands } = createBotHarness();
    const user = { id: "user-1", telegramChatId: "123" };
    const medicationReminderService = {
      createReminderFromText: vi.fn(async () => ({ ok: true, reminder: createReminder(), user })),
      getUserReminders: vi.fn(() => []),
    };
    const runtime = createTelegramMedicationReminderRuntime({
      configured: true,
      authRepository: { listUsers: vi.fn() },
      medicationReminderService,
      getConnectedUser: vi.fn(async () => user),
      writeAuditLog: vi.fn(async () => {}),
      sendTelegramMessage: vi.fn(),
      logger: { warn: vi.fn() },
    });
    const ctx = {
      message: { text: "/addwater Склянка води щодня о 09:00" },
      reply: vi.fn(async () => {}),
    };

    runtime.registerHandlers(bot);
    await commands.addwater(ctx);

    expect(medicationReminderService.createReminderFromText).not.toHaveBeenCalled();
    expect(ctx.reply.mock.calls[0][0]).toContain("тимчасово недоступні");
  });

  it("passes non-medication free text to the next Telegram handler", async () => {
    const { bot, events } = createBotHarness();
    const runtime = createTelegramMedicationReminderRuntime({
      configured: true,
      authRepository: { listUsers: vi.fn() },
      medicationReminderService: {
        createReminderFromText: vi.fn(),
      },
      getConnectedUser: vi.fn(),
      writeAuditLog: vi.fn(),
      sendTelegramMessage: vi.fn(),
      logger: { warn: vi.fn() },
    });
    const next = vi.fn(async () => {});

    runtime.registerHandlers(bot);
    await events.text(
      {
        message: { text: "Я выпил 300 мл воды" },
      },
      next
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("handles medication-looking free text without passing it to the generic agent", async () => {
    const { bot, events } = createBotHarness();
    const user = { id: "user-1", telegramChatId: "123" };
    const reminder = createReminder();
    const medicationReminderService = {
      createReminderFromText: vi.fn(async () => ({ ok: true, reminder, user })),
    };
    const runtime = createTelegramMedicationReminderRuntime({
      configured: true,
      authRepository: { listUsers: vi.fn() },
      medicationReminderService,
      getConnectedUser: vi.fn(async () => user),
      writeAuditLog: vi.fn(),
      sendTelegramMessage: vi.fn(),
      logger: { warn: vi.fn() },
    });
    const next = vi.fn(async () => {});

    runtime.registerHandlers(bot);
    await events.text(
      {
        message: { text: "Вітамін D 1 капсула щодня о 09:00" },
        reply: vi.fn(async () => {}),
      },
      next
    );

    expect(medicationReminderService.createReminderFromText).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("updates the latest reminder schedule when the user sends a short correction", async () => {
    const { bot, events } = createBotHarness();
    const user = { id: "user-1", telegramChatId: "123" };
    const reminder = createReminder({
      id: "med-magnesium",
      title: "Магний",
      times: ["23:00"],
    });
    const reminderService = {
      updateLatestReminderSchedule: vi.fn(async () => ({
        ok: true,
        reminder,
        user,
      })),
    };
    const runtime = createTelegramMedicationReminderRuntime({
      configured: true,
      authRepository: { listUsers: vi.fn() },
      reminderService,
      getConnectedUser: vi.fn(async () => user),
      writeAuditLog: vi.fn(async () => {}),
      sendTelegramMessage: vi.fn(),
      logger: { warn: vi.fn() },
    });
    const next = vi.fn(async () => {});
    const ctx = {
      message: { text: "Ой в 23" },
      reply: vi.fn(async () => {}),
    };

    runtime.registerHandlers(bot);
    await events.text(ctx, next);

    expect(reminderService.updateLatestReminderSchedule).toHaveBeenCalledWith(
      user,
      "Ой в 23"
    );
    expect(ctx.reply.mock.calls[0][0]).toContain("оновив час");
    expect(ctx.reply.mock.calls[0][0]).toContain("23:00");
    expect(next).not.toHaveBeenCalled();
  });

  it("records callback actions for sent reminders", async () => {
    const { bot, events } = createBotHarness();
    const user = { id: "user-1", telegramChatId: "123" };
    const medicationReminderService = {
      recordDoseAction: vi.fn(async () => ({ ok: true, user, reminder: createReminder() })),
    };
    const runtime = createTelegramMedicationReminderRuntime({
      configured: true,
      authRepository: { listUsers: vi.fn() },
      medicationReminderService,
      getConnectedUser: vi.fn(async () => user),
      writeAuditLog: vi.fn(async () => {}),
      sendTelegramMessage: vi.fn(),
      logger: { warn: vi.fn() },
    });
    const ctx = {
      callbackQuery: { data: "med:taken:med-test" },
      answerCbQuery: vi.fn(async () => {}),
    };

    runtime.registerHandlers(bot);
    await events.callback_query(ctx);

    expect(medicationReminderService.recordDoseAction).toHaveBeenCalledWith(
      user,
      "med-test",
      "taken",
      expect.any(Date)
    );
    expect(ctx.answerCbQuery).toHaveBeenCalledWith("Записано: прийнято.");
  });

  it("records task callback actions without using medication labels", async () => {
    const { bot, events } = createBotHarness();
    const user = { id: "user-1", telegramChatId: "123" };
    const medicationReminderService = {
      recordReminderAction: vi.fn(async () => ({
        ok: true,
        user,
        reminder: createReminder({ type: "task" }),
      })),
    };
    const writeAuditLog = vi.fn(async () => {});
    const runtime = createTelegramMedicationReminderRuntime({
      configured: true,
      authRepository: { listUsers: vi.fn() },
      medicationReminderService,
      getConnectedUser: vi.fn(async () => user),
      writeAuditLog,
      sendTelegramMessage: vi.fn(),
      logger: { warn: vi.fn() },
    });
    const ctx = {
      callbackQuery: { data: "rem:done:task-call" },
      answerCbQuery: vi.fn(async () => {}),
    };

    runtime.registerHandlers(bot);
    await events.callback_query(ctx);

    expect(medicationReminderService.recordReminderAction).toHaveBeenCalledWith(
      user,
      "task-call",
      "done",
      expect.any(Date)
    );
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "telegram.task_reminder.done",
      })
    );
    expect(ctx.answerCbQuery).toHaveBeenCalledWith("Записано: зроблено.");
  });

  it("uses the profile language for reminder management buttons and callbacks", async () => {
    const { bot, events } = createBotHarness();
    const user = { id: "user-1", telegramChatId: "123", languagePreference: "en" };
    const reminder = createReminder({
      id: "task-call",
      type: "task",
      title: "Call doctor",
      dose: "",
      repeat: "once",
      timezone: "Europe/Warsaw",
    });
    const reminderService = {
      getUserReminders: vi.fn(() => [reminder]),
      recordReminderAction: vi.fn(async () => ({ ok: true, user, reminder })),
    };
    const runtime = createTelegramMedicationReminderRuntime({
      configured: true,
      authRepository: { listUsers: vi.fn() },
      reminderService,
      getConnectedUser: vi.fn(async () => user),
      writeAuditLog: vi.fn(async () => {}),
      sendTelegramMessage: vi.fn(),
      logger: { warn: vi.fn() },
    });
    const listCtx = {
      message: { text: "show reminders" },
      reply: vi.fn(async () => {}),
    };
    const callbackCtx = {
      callbackQuery: { data: "rem:done:task-call" },
      answerCbQuery: vi.fn(async () => {}),
    };

    runtime.registerHandlers(bot);
    await events.text(listCtx, vi.fn(async () => {}));
    await events.callback_query(callbackCtx);

    expect(listCtx.reply.mock.calls[0][0]).toContain("Active reminders");
    expect(listCtx.reply.mock.calls[1][1].reply_markup.inline_keyboard.flat()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ text: "✅ Done" }),
        expect.objectContaining({ text: "⏰ In 15 min" }),
        expect.objectContaining({ text: "✏️ Edit" }),
        expect.objectContaining({ text: "⏸ Pause" }),
        expect.objectContaining({ text: "🗑 Delete" }),
      ])
    );
    expect(callbackCtx.answerCbQuery).toHaveBeenCalledWith("Saved: done.");
  });

  it("shows reminder list with management buttons from natural text", async () => {
    const { bot, events } = createBotHarness();
    const user = { id: "user-1", telegramChatId: "123" };
    const reminder = createReminder({
      id: "task-call",
      type: "task",
      title: "Подзвонити лікарю",
      dose: "",
      repeat: "once",
      timezone: "Europe/Warsaw",
    });
    const reminderService = {
      getUserReminders: vi.fn(() => [reminder]),
    };
    const runtime = createTelegramMedicationReminderRuntime({
      configured: true,
      authRepository: { listUsers: vi.fn() },
      reminderService,
      getConnectedUser: vi.fn(async () => user),
      writeAuditLog: vi.fn(async () => {}),
      sendTelegramMessage: vi.fn(),
      logger: { warn: vi.fn() },
    });
    const ctx = {
      message: { text: "что у меня по напоминаниям" },
      reply: vi.fn(async () => {}),
    };

    runtime.registerHandlers(bot);
    await events.text(ctx, vi.fn(async () => {}));

    expect(ctx.reply.mock.calls[0][0]).toContain("Активні нагадування");
    expect(ctx.reply.mock.calls[1][0]).toContain("Подзвонити лікарю");
    expect(ctx.reply.mock.calls[1][1].reply_markup.inline_keyboard.flat()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ callback_data: "rem:done:task-call" }),
        expect.objectContaining({ callback_data: "rem:snooze15:task-call" }),
        expect.objectContaining({ callback_data: "rem:edit:task-call" }),
        expect.objectContaining({ callback_data: "rem:pause:task-call" }),
        expect.objectContaining({ callback_data: "rem:delete:task-call" }),
      ])
    );
  });

  it("runs a stateful edit flow from inline buttons", async () => {
    const { bot, events } = createBotHarness();
    const user = { id: "user-1", telegramChatId: "123" };
    const reminder = createReminder({ id: "med-magnesium", title: "Магній" });
    const updatedReminder = createReminder({
      id: "med-magnesium",
      title: "Магній",
      times: ["22:00"],
    });
    const reminderService = {
      getUserReminders: vi.fn(() => [reminder]),
      updateReminderSchedule: vi.fn(async () => ({
        ok: true,
        reminder: updatedReminder,
        user,
      })),
    };
    const runtime = createTelegramMedicationReminderRuntime({
      configured: true,
      authRepository: { listUsers: vi.fn() },
      reminderService,
      getConnectedUser: vi.fn(async () => user),
      writeAuditLog: vi.fn(async () => {}),
      sendTelegramMessage: vi.fn(),
      logger: { warn: vi.fn() },
    });
    const callbackCtx = {
      chat: { id: 123 },
      callbackQuery: { data: "rem:edit:med-magnesium" },
      answerCbQuery: vi.fn(async () => {}),
      reply: vi.fn(async () => {}),
    };
    const textCtx = {
      chat: { id: 123 },
      message: { text: "22:00" },
      reply: vi.fn(async () => {}),
    };

    runtime.registerHandlers(bot);
    await events.callback_query(callbackCtx);
    await events.text(textCtx, vi.fn(async () => {}));

    expect(callbackCtx.reply.mock.calls[0][0]).toContain("Що змінити");
    expect(callbackCtx.reply.mock.calls[0][0]).toContain("/settime med-magnesium 22:00");
    expect(reminderService.updateReminderSchedule).toHaveBeenCalledWith(
      user,
      "med-magnesium",
      "22:00"
    );
    expect(textCtx.reply.mock.calls[0][0]).toContain("оновив час");
    expect(textCtx.reply.mock.calls[0][0]).toContain("22:00");
  });

  it("pauses and resumes reminders through inline buttons", async () => {
    const { bot, events } = createBotHarness();
    const user = { id: "user-1", telegramChatId: "123" };
    const reminder = createReminder({ id: "med-magnesium", title: "Магній" });
    const reminderService = {
      getUserReminders: vi.fn(() => [reminder]),
      pauseReminder: vi.fn(async () => ({ ok: true, reminder, user })),
      resumeReminder: vi.fn(async () => ({ ok: true, reminder, user })),
    };
    const runtime = createTelegramMedicationReminderRuntime({
      configured: true,
      authRepository: { listUsers: vi.fn() },
      reminderService,
      getConnectedUser: vi.fn(async () => user),
      writeAuditLog: vi.fn(async () => {}),
      sendTelegramMessage: vi.fn(),
      logger: { warn: vi.fn() },
    });

    runtime.registerHandlers(bot);
    await events.callback_query({
      callbackQuery: { data: "rem:pause:med-magnesium" },
      answerCbQuery: vi.fn(async () => {}),
    });
    await events.callback_query({
      callbackQuery: { data: "rem:resume:med-magnesium" },
      answerCbQuery: vi.fn(async () => {}),
    });

    expect(reminderService.pauseReminder).toHaveBeenCalledWith(
      user,
      "med-magnesium",
      expect.any(Date)
    );
    expect(reminderService.resumeReminder).toHaveBeenCalledWith(
      user,
      "med-magnesium",
      expect.any(Date)
    );
  });

  it("asks for confirmation before deleting and then deletes from storage", async () => {
    const { bot, events } = createBotHarness();
    const user = { id: "user-1", telegramChatId: "123" };
    const reminder = createReminder({ id: "med-vitamin-d", title: "Вітамін D" });
    const reminderService = {
      getUserReminders: vi.fn(() => [reminder]),
      deleteReminder: vi.fn(async () => ({ ok: true, reminder, user })),
    };
    const runtime = createTelegramMedicationReminderRuntime({
      configured: true,
      authRepository: { listUsers: vi.fn() },
      reminderService,
      getConnectedUser: vi.fn(async () => user),
      writeAuditLog: vi.fn(async () => {}),
      sendTelegramMessage: vi.fn(),
      logger: { warn: vi.fn() },
    });
    const deleteCtx = {
      callbackQuery: { data: "rem:delete:med-vitamin-d" },
      answerCbQuery: vi.fn(async () => {}),
      reply: vi.fn(async () => {}),
    };
    const confirmCtx = {
      callbackQuery: { data: "rem:confirm_delete:med-vitamin-d" },
      answerCbQuery: vi.fn(async () => {}),
      editMessageReplyMarkup: vi.fn(async () => {}),
    };

    runtime.registerHandlers(bot);
    await events.callback_query(deleteCtx);
    await events.callback_query(confirmCtx);

    expect(deleteCtx.reply.mock.calls[0][0]).toContain("Видалити нагадування");
    expect(reminderService.deleteReminder).toHaveBeenCalledWith(
      user,
      "med-vitamin-d",
      expect.any(Date)
    );
    expect(confirmCtx.answerCbQuery).toHaveBeenCalledWith("Нагадування видалено.");
  });

  it("snoozes reminders for 15 minutes from Telegram buttons", async () => {
    const { bot, events } = createBotHarness();
    const user = { id: "user-1", telegramChatId: "123" };
    const reminder = createReminder({ id: "task-call", type: "task" });
    const reminderService = {
      snoozeReminder: vi.fn(async () => ({ ok: true, reminder, user })),
    };
    const runtime = createTelegramMedicationReminderRuntime({
      configured: true,
      authRepository: { listUsers: vi.fn() },
      reminderService,
      getConnectedUser: vi.fn(async () => user),
      writeAuditLog: vi.fn(async () => {}),
      sendTelegramMessage: vi.fn(),
      logger: { warn: vi.fn() },
    });
    const ctx = {
      callbackQuery: { data: "rem:snooze15:task-call" },
      answerCbQuery: vi.fn(async () => {}),
    };

    runtime.registerHandlers(bot);
    await events.callback_query(ctx);

    expect(reminderService.snoozeReminder).toHaveBeenCalledWith(
      user,
      "task-call",
      15,
      expect.any(Date)
    );
    expect(ctx.answerCbQuery).toHaveBeenCalledWith("Нагадаю через 15 хвилин.");
  });

  it("updates a named reminder from natural text", async () => {
    const { bot, events } = createBotHarness();
    const user = { id: "user-1", telegramChatId: "123" };
    const reminder = createReminder({ id: "med-magnesium", title: "Магній" });
    const reminderService = {
      getUserReminders: vi.fn(() => [reminder]),
      updateReminderSchedule: vi.fn(async () => ({
        ok: true,
        reminder: createReminder({ ...reminder, times: ["22:00"] }),
        user,
      })),
    };
    const runtime = createTelegramMedicationReminderRuntime({
      configured: true,
      authRepository: { listUsers: vi.fn() },
      reminderService,
      getConnectedUser: vi.fn(async () => user),
      writeAuditLog: vi.fn(async () => {}),
      sendTelegramMessage: vi.fn(),
      logger: { warn: vi.fn() },
    });
    const ctx = {
      message: { text: "измени магній на 22:00" },
      reply: vi.fn(async () => {}),
    };

    runtime.registerHandlers(bot);
    await events.text(ctx, vi.fn(async () => {}));

    expect(reminderService.updateReminderSchedule).toHaveBeenCalledWith(
      user,
      "med-magnesium",
      "измени магній на 22:00"
    );
  });

  it("updates a reminder through restart-safe /settime command without edit session memory", async () => {
    const { bot, commands } = createBotHarness();
    const user = { id: "user-1", telegramChatId: "123" };
    const reminder = createReminder({
      id: "med-magnesium",
      title: "Магній",
      times: ["22:00"],
    });
    const reminderService = {
      updateReminderSchedule: vi.fn(async () => ({
        ok: true,
        reminder,
        user,
      })),
    };
    const runtime = createTelegramMedicationReminderRuntime({
      configured: true,
      authRepository: { listUsers: vi.fn() },
      reminderService,
      getConnectedUser: vi.fn(async () => user),
      writeAuditLog: vi.fn(async () => {}),
      sendTelegramMessage: vi.fn(),
      logger: { warn: vi.fn() },
    });
    const ctx = {
      message: { text: "/settime med-magnesium 22:00" },
      reply: vi.fn(async () => {}),
    };

    runtime.registerHandlers(bot);
    await commands.settime(ctx);

    expect(reminderService.updateReminderSchedule).toHaveBeenCalledWith(
      user,
      "med-magnesium",
      "22:00"
    );
    expect(ctx.reply.mock.calls[0][0]).toContain("оновив час");
  });
});
