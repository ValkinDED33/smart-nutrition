import { describe, expect, it, vi } from "vitest";
import {
  buildMedicationReminderListMessage,
  buildReminderListMessage,
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
});
