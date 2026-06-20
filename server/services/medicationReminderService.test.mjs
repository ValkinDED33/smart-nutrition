import { describe, expect, it, vi } from "vitest";
import {
  calculateNextMedicationRunAt,
  createMedicationReminderService,
  parseMedicationReminderText,
} from "./medicationReminderService.mjs";

const createUser = (overrides = {}) => ({
  id: "user-1",
  name: "Test User",
  telegramChatId: "123",
  medicationReminders: [],
  ...overrides,
});

describe("medicationReminderService", () => {
  it("parses explicit medication times, dose and duration from natural text", () => {
    const reminder = parseMedicationReminderText(
      "Амоксиклав 875 мг, 2 раза в день, 08:00 и 20:00, 7 дней",
      { now: new Date("2026-06-20T05:00:00.000Z") }
    );

    expect(reminder).toMatchObject({
      title: "Амоксиклав",
      dose: "875 мг",
      times: ["08:00", "20:00"],
      durationDays: 7,
      active: true,
    });
    expect(reminder.nextRunAt).toBeTruthy();
  });

  it("parses plain reminder language with morning phrase", () => {
    const reminder = parseMedicationReminderText(
      "Напоминай пить витамин D по 1 капсуле каждый день в 9 утра",
      { now: new Date("2026-06-20T05:00:00.000Z") }
    );

    expect(reminder).toMatchObject({
      title: "витамин D",
      dose: "1 капсуле",
      times: ["09:00"],
    });
  });

  it("parses Ukrainian daily wording used in Telegram smoke tests", () => {
    const reminder = parseMedicationReminderText("Вітамін D 1 капсула щодня о 09:00", {
      now: new Date("2026-06-20T05:00:00.000Z"),
    });

    expect(reminder).toMatchObject({
      title: "Вітамін D",
      dose: "1 капсула",
      times: ["09:00"],
    });
  });

  it("does not create a reminder without a usable schedule", () => {
    expect(parseMedicationReminderText("Магний")).toBeNull();
  });

  it("calculates next run from local reminder times", () => {
    const nextRunAt = calculateNextMedicationRunAt(
      {
        times: ["08:00", "20:00"],
        timezone: "Europe/Warsaw",
      },
      { from: new Date("2026-06-20T07:00:00.000Z") }
    );

    expect(nextRunAt).toBe("2026-06-20T18:00:00.000Z");
  });

  it("creates reminders and persists them on the user record", async () => {
    const repository = {
      updateUserMedicationReminders: vi.fn(async (userId, reminders) => ({
        ...createUser({ id: userId }),
        medicationReminders: reminders,
      })),
    };
    const service = createMedicationReminderService({ authRepository: repository });
    const result = await service.createReminderFromText(
      createUser(),
      "Магний 1 капсула в 21:00",
      new Date("2026-06-20T10:00:00.000Z")
    );

    expect(result.ok).toBe(true);
    expect(result.reminder.title).toBe("Магний");
    expect(repository.updateUserMedicationReminders).toHaveBeenCalledWith(
      "user-1",
      expect.arrayContaining([expect.objectContaining({ title: "Магний" })])
    );
  });

  it("records dose actions without duplicating reminders", async () => {
    const initialReminder = parseMedicationReminderText("Магний 1 капсула в 21:00", {
      now: new Date("2026-06-20T10:00:00.000Z"),
    });
    const user = createUser({ medicationReminders: [initialReminder] });
    const repository = {
      updateUserMedicationReminders: vi.fn(async (userId, reminders) => ({
        ...user,
        id: userId,
        medicationReminders: reminders,
      })),
    };
    const service = createMedicationReminderService({ authRepository: repository });
    const result = await service.recordDoseAction(
      user,
      initialReminder.id,
      "taken",
      new Date("2026-06-20T19:05:00.000Z")
    );

    expect(result.ok).toBe(true);
    expect(result.reminder.events).toHaveLength(1);
    expect(result.reminder.events[0]).toMatchObject({ action: "taken" });
    expect(repository.updateUserMedicationReminders.mock.calls[0][1]).toHaveLength(1);
  });

  it("sends due reminders and advances the next run only after a successful send", async () => {
    const initialReminder = {
      ...parseMedicationReminderText("Магний 1 капсула в 21:00", {
        now: new Date("2026-06-19T10:00:00.000Z"),
      }),
      nextRunAt: "2026-06-20T19:00:00.000Z",
    };
    const user = createUser({ medicationReminders: [initialReminder] });
    const repository = {
      updateUserMedicationReminders: vi.fn(async (userId, reminders) => ({
        ...user,
        id: userId,
        medicationReminders: reminders,
      })),
    };
    const service = createMedicationReminderService({ authRepository: repository });
    const sendReminder = vi.fn(async () => {});

    await service.sendDueReminders({
      users: [user],
      sendReminder,
      now: new Date("2026-06-20T19:01:00.000Z"),
    });

    expect(sendReminder).toHaveBeenCalledWith(
      user,
      expect.objectContaining({ id: initialReminder.id })
    );
    const persistedReminder = repository.updateUserMedicationReminders.mock.calls[0][1][0];
    expect(persistedReminder.lastSentAt).toBe("2026-06-20T19:01:00.000Z");
    expect(persistedReminder.nextRunAt).toBe("2026-06-21T19:00:00.000Z");
  });
});
