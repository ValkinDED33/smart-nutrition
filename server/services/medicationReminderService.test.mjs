import { describe, expect, it, vi } from "vitest";
import {
  calculateNextMedicationRunAt,
  createMedicationReminderService,
  parseMedicationReminderText,
  parseTaskReminderText,
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

  it("cleans natural Telegram medication wording into a useful title", () => {
    expect(
      parseMedicationReminderText("Мне надо пить витамины в 10:00", {
        now: new Date("2026-06-20T05:00:00.000Z"),
      })
    ).toMatchObject({
      title: "витамины",
      times: ["10:00"],
    });
    expect(
      parseMedicationReminderText("И в 22:00 выпить магний", {
        now: new Date("2026-06-20T05:00:00.000Z"),
      })
    ).toMatchObject({
      title: "магний",
      times: ["22:00"],
    });
  });

  it("does not create a reminder without a usable schedule", () => {
    expect(parseMedicationReminderText("Магний")).toBeNull();
  });

  it("parses ordinary task reminders without treating them as medication", () => {
    const reminder = parseTaskReminderText("Напомни позвонить врачу о 10:00", {
      now: new Date("2026-06-20T05:00:00.000Z"),
    });

    expect(reminder).toMatchObject({
      type: "task",
      title: "позвонить врачу",
      times: ["10:00"],
      repeat: "once",
      durationDays: 1,
    });
    expect(reminder.dose).toBe("");
    expect(reminder.nextRunAt).toBeTruthy();
  });

  it("removes dangling conjunctions after multiple times in family task reminders", () => {
    const reminder = parseTaskReminderText("Напомни маме измерить давление в 8:00 и 20:00", {
      now: new Date("2026-06-20T05:00:00.000Z"),
    });

    expect(reminder).toMatchObject({
      type: "task",
      title: "маме измерить давление",
      times: ["08:00", "20:00"],
    });
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

  it("stops course reminders after their fixed duration window", () => {
    const reminder = {
      times: ["08:00"],
      timezone: "Europe/Warsaw",
      durationDays: 1,
      createdAt: "2026-06-20T05:00:00.000Z",
      endsAt: "2026-06-21T05:00:00.000Z",
    };

    expect(
      calculateNextMedicationRunAt(reminder, {
        from: new Date("2026-06-20T05:30:00.000Z"),
      })
    ).toBe("2026-06-20T06:00:00.000Z");
    expect(
      calculateNextMedicationRunAt(reminder, {
        from: new Date("2026-06-20T06:01:00.000Z"),
      })
    ).toBeNull();
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

  it("creates task reminders and persists them with medication reminders", async () => {
    const repository = {
      updateUserMedicationReminders: vi.fn(async (userId, reminders) => ({
        ...createUser({ id: userId }),
        medicationReminders: reminders,
      })),
    };
    const service = createMedicationReminderService({ authRepository: repository });
    const result = await service.createTaskReminderFromText(
      createUser(),
      "Напомни позвонить врачу о 10:00",
      new Date("2026-06-20T05:00:00.000Z")
    );

    expect(result.ok).toBe(true);
    expect(result.reminder).toMatchObject({
      type: "task",
      title: "позвонить врачу",
      repeat: "once",
    });
    expect(repository.updateUserMedicationReminders).toHaveBeenCalledWith(
      "user-1",
      expect.arrayContaining([expect.objectContaining({ type: "task" })])
    );
  });

  it("marks one-time task reminders inactive after the first successful send", async () => {
    const initialReminder = parseTaskReminderText("Напомни позвонить врачу о 10:00", {
      now: new Date("2026-06-20T05:00:00.000Z"),
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
    const sendReminder = vi.fn(async () => {});

    await service.sendDueReminders({
      users: [user],
      sendReminder,
      now: new Date(initialReminder.nextRunAt),
    });

    const persistedReminder = repository.updateUserMedicationReminders.mock.calls[0][1][0];
    expect(persistedReminder.active).toBe(false);
    expect(persistedReminder.nextRunAt).toBeNull();
  });

  it("reactivates a sent one-time task reminder when it is snoozed", async () => {
    const sentReminder = {
      ...parseTaskReminderText("Напомни позвонить врачу о 10:00", {
        now: new Date("2026-06-20T05:00:00.000Z"),
      }),
      active: false,
      nextRunAt: null,
      lastSentAt: "2026-06-20T08:00:00.000Z",
    };
    const user = createUser({ medicationReminders: [sentReminder] });
    const repository = {
      updateUserMedicationReminders: vi.fn(async (userId, reminders) => ({
        ...user,
        id: userId,
        medicationReminders: reminders,
      })),
    };
    const service = createMedicationReminderService({ authRepository: repository });
    const result = await service.recordReminderAction(
      user,
      sentReminder.id,
      "snoozed",
      new Date("2026-06-20T08:01:00.000Z")
    );

    expect(result.ok).toBe(true);
    expect(result.reminder).toMatchObject({
      active: true,
      nextRunAt: "2026-06-20T08:11:00.000Z",
    });
    expect(repository.updateUserMedicationReminders.mock.calls[0][1][0]).toMatchObject({
      active: true,
      nextRunAt: "2026-06-20T08:11:00.000Z",
    });
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

  it("updates the latest reminder schedule from a short correction message", async () => {
    const firstReminder = parseMedicationReminderText("Магний 1 капсула в 22:00", {
      now: new Date("2026-06-20T10:00:00.000Z"),
    });
    const user = createUser({ medicationReminders: [firstReminder] });
    const repository = {
      updateUserMedicationReminders: vi.fn(async (userId, reminders) => ({
        ...user,
        id: userId,
        medicationReminders: reminders,
      })),
    };
    const service = createMedicationReminderService({ authRepository: repository });
    const result = await service.updateLatestReminderSchedule(
      user,
      "Ой в 23",
      new Date("2026-06-20T19:05:00.000Z")
    );

    expect(result).toMatchObject({
      ok: true,
      reminder: {
        title: "Магний",
        times: ["23:00"],
      },
    });
    expect(result.reminder.events.at(-1)).toMatchObject({ action: "schedule_updated" });
  });

  it("pauses and resumes reminders with recalculated next run", async () => {
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

    const paused = await service.pauseReminder(
      user,
      initialReminder.id,
      new Date("2026-06-20T12:00:00.000Z")
    );
    const resumed = await service.resumeReminder(
      { ...user, medicationReminders: [paused.reminder] },
      initialReminder.id,
      new Date("2026-06-20T12:05:00.000Z")
    );

    expect(paused.reminder).toMatchObject({
      active: false,
      nextRunAt: null,
    });
    expect(paused.reminder.events.at(-1)).toMatchObject({ action: "paused" });
    expect(resumed.reminder).toMatchObject({
      active: true,
      nextRunAt: "2026-06-20T19:00:00.000Z",
    });
    expect(resumed.reminder.events.at(-1)).toMatchObject({ action: "resumed" });
  });

  it("deletes reminders from persistent storage", async () => {
    const initialReminder = parseTaskReminderText("Напомни позвонить врачу о 10:00", {
      now: new Date("2026-06-20T05:00:00.000Z"),
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
    const result = await service.deleteReminder(user, initialReminder.id);

    expect(result.ok).toBe(true);
    expect(repository.updateUserMedicationReminders).toHaveBeenCalledWith("user-1", []);
  });

  it("snoozes reminders for an explicit number of minutes", async () => {
    const initialReminder = parseTaskReminderText("Напомни позвонить врачу о 10:00", {
      now: new Date("2026-06-20T05:00:00.000Z"),
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
    const result = await service.snoozeReminder(
      user,
      initialReminder.id,
      15,
      new Date("2026-06-20T08:00:00.000Z")
    );

    expect(result.ok).toBe(true);
    expect(result.reminder).toMatchObject({
      active: true,
      nextRunAt: "2026-06-20T08:15:00.000Z",
    });
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
