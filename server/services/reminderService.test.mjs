import { describe, expect, it, vi } from "vitest";
import { createReminderService } from "./reminderService.mjs";

const createUser = (overrides = {}) => ({
  id: "user-1",
  name: "Test User",
  telegramChatId: "123",
  medicationReminders: [],
  ...overrides,
});

describe("reminderService", () => {
  it("exposes a canonical reminder contract while preserving legacy storage", async () => {
    const repository = {
      updateUserMedicationReminders: vi.fn(async (userId, reminders) => ({
        ...createUser({ id: userId }),
        medicationReminders: reminders,
      })),
    };
    const service = createReminderService({ authRepository: repository });

    const taskResult = await service.createTaskReminderFromText(
      createUser(),
      "Напомни позвонить врачу о 10:00",
      new Date("2026-06-20T05:00:00.000Z")
    );

    expect(taskResult).toMatchObject({
      ok: true,
      reminder: {
        type: "task",
        title: "позвонить врачу",
      },
    });
    expect(repository.updateUserMedicationReminders).toHaveBeenCalledWith(
      "user-1",
      expect.arrayContaining([expect.objectContaining({ type: "task" })])
    );
    expect(service.getStatus()).toEqual({
      enabled: true,
      storageKey: "medicationReminders",
      backwardCompatibleStorage: true,
      supportedTypes: [
        "medication",
        "medication_course",
        "pregnancy_supplement",
        "water",
        "habit",
        "task",
      ],
    });
  });

  it("keeps medication aliases for backward-compatible callers", () => {
    const service = createReminderService({
      authRepository: {
        updateUserMedicationReminders: vi.fn(),
      },
    });

    expect(service.createMedicationReminderFromText).toBe(service.createReminderFromText);
    expect(service.recordMedicationAction).toBe(service.recordDoseAction);
  });

  it("creates typed water and habit reminders through the canonical contract", async () => {
    const repository = {
      updateUserMedicationReminders: vi.fn(async (userId, reminders) => ({
        ...createUser({ id: userId }),
        medicationReminders: reminders,
      })),
    };
    const service = createReminderService({ authRepository: repository });
    const now = new Date("2026-06-20T05:00:00.000Z");

    const waterResult = await service.createReminderFromUserText(
      createUser(),
      {
        type: "water",
        text: "Склянка води щодня о 09:00 і 13:00",
      },
      now
    );
    const habitResult = await service.createReminderFromUserText(
      createUser({ medicationReminders: [waterResult.reminder] }),
      {
        type: "habit",
        text: "10 хв прогулянки щодня о 19:00",
      },
      now
    );

    expect(waterResult).toMatchObject({
      ok: true,
      reminder: {
        type: "water",
        title: "Пити воду",
        dose: "250 мл",
        times: ["09:00", "13:00"],
      },
    });
    expect(habitResult).toMatchObject({
      ok: true,
      reminder: {
        type: "habit",
        title: "10 хв прогулянки",
        repeat: "daily",
      },
    });
  });

  it("creates pregnancy supplement and medication course reminders without losing type", async () => {
    const repository = {
      updateUserMedicationReminders: vi.fn(async (userId, reminders) => ({
        ...createUser({ id: userId }),
        medicationReminders: reminders,
      })),
    };
    const service = createReminderService({ authRepository: repository });
    const now = new Date("2026-06-20T05:00:00.000Z");

    const supplementResult = await service.createReminderFromUserText(
      createUser(),
      {
        type: "pregnancy_supplement",
        text: "Фолієва кислота 1 капсула щодня о 09:00",
      },
      now
    );
    const courseResult = await service.createReminderFromUserText(
      createUser(),
      {
        type: "medication_course",
        text: "Амоксиклав 875 мг, 08:00 і 20:00, 7 днів",
      },
      now
    );

    expect(supplementResult).toMatchObject({
      ok: true,
      reminder: {
        type: "pregnancy_supplement",
        safetyMode: "doctor_plan_only",
        dose: "1 капсула",
      },
    });
    expect(courseResult).toMatchObject({
      ok: true,
      reminder: {
        type: "medication_course",
        durationDays: 7,
        dose: "875 мг",
      },
    });
  });
});
