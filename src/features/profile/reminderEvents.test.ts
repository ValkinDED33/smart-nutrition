import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReminderItem } from "@shared/api/reminders";
import {
  dispatchReminderUpserted,
  REMINDER_UPSERTED_EVENT,
  subscribeToReminderUpserts,
} from "./reminderEvents";

const originalWindow = globalThis.window;

const createReminder = (overrides: Partial<ReminderItem> = {}): ReminderItem => ({
  id: "reminder-1",
  type: "task",
  title: "Call doctor",
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

const installWindowEventTarget = () => {
  const eventTarget = new EventTarget();
  const windowLike = {
    addEventListener: eventTarget.addEventListener.bind(eventTarget),
    removeEventListener: eventTarget.removeEventListener.bind(eventTarget),
    dispatchEvent: eventTarget.dispatchEvent.bind(eventTarget),
  };

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: windowLike,
  });

  return windowLike;
};

describe("reminder events", () => {
  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  });

  it("notifies subscribers with backend-confirmed reminder items", () => {
    installWindowEventTarget();
    const onReminder = vi.fn();
    const reminder = createReminder({ id: "created-reminder" });
    const unsubscribe = subscribeToReminderUpserts(onReminder);

    dispatchReminderUpserted(reminder);

    expect(onReminder).toHaveBeenCalledWith(reminder);

    unsubscribe();
    dispatchReminderUpserted(createReminder({ id: "ignored-reminder" }));
    expect(onReminder).toHaveBeenCalledTimes(1);
  });

  it("ignores malformed reminder events", () => {
    const windowLike = installWindowEventTarget();
    const onReminder = vi.fn();

    subscribeToReminderUpserts(onReminder);
    windowLike.dispatchEvent(
      new CustomEvent(REMINDER_UPSERTED_EVENT, {
        detail: { item: { title: "Missing id" } },
      })
    );

    expect(onReminder).not.toHaveBeenCalled();
  });
});
