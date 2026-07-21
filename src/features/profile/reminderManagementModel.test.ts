import { describe, expect, it } from "vitest";
import type { ReminderItem } from "@shared/api/reminders";
import {
  formatReminderDateTime,
  formatReminderScheduleLabel,
  getReminderAdherenceRangeSummary,
  getReminderAdherenceSummary,
  getReminderPrimaryAction,
  getReminderPrimaryActionLabelKey,
  getReminderQuantityLabelKey,
  sortReminders,
  toReminderType,
  upsertReminderItem,
} from "./reminderManagementModel";

const testTimestamp = "2026-06-23T08:00:00.000Z";
const firstReminderRunAt = "2026-06-23T09:00:00.000Z";
const secondReminderRunAt = "2026-06-23T10:00:00.000Z";

const createReminder = (overrides: Partial<ReminderItem>): ReminderItem => ({
  id: "reminder-1",
  type: "task",
  title: "Task",
  dose: "",
  times: ["10:00"],
  timezone: "Europe/Warsaw",
  durationDays: null,
  repeat: "once",
  trigger: null,
  active: true,
  nextRunAt: null,
  lastSentAt: null,
  createdAt: testTimestamp,
  updatedAt: testTimestamp,
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
      createReminder({ id: "second", nextRunAt: secondReminderRunAt }),
      createReminder({ id: "first", nextRunAt: firstReminderRunAt }),
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["first", "second", "no-next"]);
  });

  it("keeps paused reminders visible but after active reminders", () => {
    const sorted = sortReminders([
      createReminder({
        id: "paused",
        active: false,
        nextRunAt: testTimestamp,
      }),
      createReminder({
        id: "active",
        active: true,
        nextRunAt: firstReminderRunAt,
      }),
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["active", "paused"]);
  });

  it("upserts a backend-confirmed reminder without duplicating it", () => {
    const first = createReminder({
      id: "first",
      title: "Old title",
      nextRunAt: firstReminderRunAt,
    });
    const second = createReminder({
      id: "second",
      title: "Second",
      nextRunAt: secondReminderRunAt,
    });
    const updatedFirst = createReminder({
      id: "first",
      title: "Updated title",
      nextRunAt: "2026-06-23T08:30:00.000Z",
    });

    const upserted = upsertReminderItem([first, second], updatedFirst);

    expect(upserted.map((item) => item.id)).toEqual(["first", "second"]);
    expect(upserted[0]?.title).toBe("Updated title");
  });

  it("sorts newly upserted reminders with the same production ordering", () => {
    const current = [
      createReminder({ id: "later", nextRunAt: "2026-06-23T11:00:00.000Z" }),
      createReminder({ id: "paused", active: false, nextRunAt: testTimestamp }),
    ];
    const created = createReminder({
      id: "created",
      nextRunAt: firstReminderRunAt,
    });

    expect(upsertReminderItem(current, created).map((item) => item.id)).toEqual([
      "created",
      "later",
      "paused",
    ]);
  });

  it("formats next run in the reminder timezone", () => {
    const reminder = createReminder({
      timezone: "Europe/Warsaw",
      nextRunAt: testTimestamp,
    });

    expect(formatReminderDateTime(reminder, "uk-UA")).toContain("10:00");
  });

  it("summarizes backend-confirmed reminder adherence events", () => {
    const summary = getReminderAdherenceSummary(
      createReminder({
        events: [
          {
            id: "event-1",
            action: "taken",
            scheduledFor: "2026-06-23T08:00:00.000Z",
            createdAt: "2026-06-23T08:02:00.000Z",
          },
          {
            id: "event-2",
            action: "skipped",
            scheduledFor: "2026-06-24T08:00:00.000Z",
            createdAt: "2026-06-24T08:05:00.000Z",
          },
          {
            id: "event-3",
            action: "snoozed",
            scheduledFor: "2026-06-24T08:00:00.000Z",
            createdAt: "2026-06-24T08:04:00.000Z",
          },
          {
            id: "event-4",
            action: "schedule_updated",
            scheduledFor: null,
            createdAt: "2026-06-25T08:00:00.000Z",
          },
        ],
      })
    );

    expect(summary).toMatchObject({
      total: 3,
      completed: 1,
      skipped: 1,
      snoozed: 1,
      completionRate: 50,
      lastEvent: {
        id: "event-2",
        action: "skipped",
      },
    });
  });

  it("builds a period adherence report from backend-confirmed reminder events", () => {
    const report = getReminderAdherenceRangeSummary(
      [
        createReminder({
          id: "medication",
          active: true,
          events: [
            {
              id: "event-1",
              action: "taken",
              scheduledFor: "2026-07-19T08:00:00.000Z",
              createdAt: "2026-07-19T08:01:00.000Z",
            },
            {
              id: "event-2",
              action: "skipped",
              scheduledFor: "2026-07-20T08:00:00.000Z",
              createdAt: "2026-07-20T08:01:00.000Z",
            },
            {
              id: "event-3",
              action: "schedule_updated",
              scheduledFor: null,
              createdAt: "2026-07-20T09:00:00.000Z",
            },
            {
              id: "event-4",
              action: "taken",
              scheduledFor: "2026-07-01T08:00:00.000Z",
              createdAt: "2026-07-01T08:01:00.000Z",
            },
          ],
        }),
        createReminder({
          id: "paused",
          active: false,
          events: [
            {
              id: "event-5",
              action: "snoozed",
              scheduledFor: "2026-07-20T12:00:00.000Z",
              createdAt: "2026-07-20T12:05:00.000Z",
            },
          ],
        }),
      ],
      7,
      new Date("2026-07-21T12:00:00.000Z")
    );

    expect(report).toMatchObject({
      total: 3,
      completed: 1,
      skipped: 1,
      snoozed: 1,
      completionRate: 50,
      reminderCount: 2,
      activeReminderCount: 1,
      riskLevel: "watch",
      lastEvent: {
        id: "event-5",
        action: "snoozed",
      },
    });
  });

  it("marks empty period adherence reports as missing instead of successful", () => {
    const report = getReminderAdherenceRangeSummary(
      [createReminder({ events: [] })],
      30,
      new Date("2026-07-21T12:00:00.000Z")
    );

    expect(report).toMatchObject({
      total: 0,
      completionRate: null,
      reminderCount: 1,
      activeReminderCount: 1,
      riskLevel: "missing",
    });
  });

  it("formats after-meal reminder triggers as visible schedule labels", () => {
    const label = formatReminderScheduleLabel({
      reminder: {
        times: [],
        trigger: {
          kind: "after_meal",
          mealType: "lunch",
          offsetMinutes: 20,
          windowStart: "12:00",
          windowEnd: "16:30",
        },
      },
      mealLabels: {
        breakfast: "breakfast",
        lunch: "lunch",
        dinner: "dinner",
        snack: "snack",
      },
      afterMealLabel: (mealType) => `After meal: ${mealType}`,
      windowLabel: (from, to) => `window ${from}-${to}`,
      offsetLabel: (minutes) => `after ${minutes} min`,
      noScheduleLabel: "Waiting for event",
    });

    expect(label).toBe("After meal: lunch · window 12:00-16:30 · after 20 min");
  });
});
