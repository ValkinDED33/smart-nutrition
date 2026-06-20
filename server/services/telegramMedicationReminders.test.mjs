import { describe, expect, it, vi } from "vitest";
import {
  buildMedicationReminderListMessage,
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
});
