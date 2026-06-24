import { describe, expect, it } from "vitest";
import type { ReminderItem } from "@shared/api/reminders";
import {
  getReminderPrimaryAction,
  getReminderPrimaryActionLabelKey,
  getReminderQuantityLabelKey,
  sortReminders,
  toReminderType,
} from "./reminderManagementModel";

const createReminder = (overrides: Partial<ReminderItem>): ReminderItem => ({
  id: "reminder-1",
  type: "task",
  title: "Task",
  dose: "",
  times: ["10:00"],
  timezone: "Europe/Warsaw",
  durationDays: null,
  repeat: "once",
  active: true,
  nextRunAt: null,
  lastSentAt: null,
  createdAt: "2026-06-23T08:00:00.000Z",
  updatedAt: "2026-06-23T08:00:00.000Z",
  events: [],
  ...overrides,
});

describe("reminderManagementModel", () => {
  it("normalizes unknown reminder types to ordinary task", () => {
    expect(toReminderType("water")).toBe("water");
    expect(toReminderType("unexpected")).toBe("task");
  });

  it("keeps medication actions separate from ordinary reminders", () => {
    expect(getReminderPrimaryAction("medication")).toBe("taken");
    expect(getReminderPrimaryAction("medication_course")).toBe("taken");
    expect(getReminderPrimaryAction("pregnancy_supplement")).toBe("taken");
    expect(getReminderPrimaryAction("task")).toBe("done");
    expect(getReminderPrimaryAction("habit")).toBe("done");
    expect(getReminderPrimaryAction("water")).toBe("done");
  });

  it("uses non-medication UI labels for water reminders", () => {
    expect(getReminderPrimaryActionLabelKey("water")).toBe("waterLogged");
    expect(getReminderQuantityLabelKey("water")).toBe("portion");
    expect(getReminderPrimaryActionLabelKey("habit")).toBe("done");
    expect(getReminderQuantityLabelKey("habit")).toBeNull();
    expect(getReminderPrimaryActionLabelKey("medication")).toBe("taken");
    expect(getReminderQuantityLabelKey("medication")).toBe("dose");
  });

  it("sorts reminders by next run and keeps unscheduled items last", () => {
    const sorted = sortReminders([
      createReminder({ id: "no-next", nextRunAt: null }),
      createReminder({ id: "second", nextRunAt: "2026-06-23T10:00:00.000Z" }),
      createReminder({ id: "first", nextRunAt: "2026-06-23T09:00:00.000Z" }),
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["first", "second", "no-next"]);
  });
});
