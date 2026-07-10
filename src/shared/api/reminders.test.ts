import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  listRemoteReminders,
  updateRemoteReminderAction,
} from "./reminders";

const authRemoteMock = vi.hoisted(() => ({
  requestRemote: vi.fn(),
}));

vi.mock("./authRemote", () => authRemoteMock);

const REMINDER_NEXT_RUN_AT = "2026-06-22T08:00:00.000Z";
const REMINDER_CREATED_AT = "2026-06-22T07:00:00.000Z";

const createReminderItem = (overrides = {}) => ({
  id: "task-1",
  type: "task",
  title: "Call doctor",
  dose: "",
  times: ["10:00"],
  timezone: "Europe/Warsaw",
  durationDays: 1,
  repeat: "once",
  active: true,
  nextRunAt: REMINDER_NEXT_RUN_AT,
  lastSentAt: null,
  createdAt: REMINDER_CREATED_AT,
  updatedAt: REMINDER_CREATED_AT,
  events: [],
  ...overrides,
});

describe("reminders api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists inactive and active reminders when requested", async () => {
    authRemoteMock.requestRemote.mockResolvedValueOnce({
      data: {
        items: [
          createReminderItem(),
          createReminderItem({ id: "paused-1", active: false }),
        ],
      },
    });

    const reminders = await listRemoteReminders({ activeOnly: false });

    expect(authRemoteMock.requestRemote).toHaveBeenCalledWith(
      "/reminders",
      { method: "GET" },
      { requireAuth: true }
    );
    expect(reminders).toHaveLength(2);
    expect(reminders[1]).toMatchObject({ id: "paused-1", active: false });
  });

  it("passes snooze duration through the canonical reminder action endpoint", async () => {
    authRemoteMock.requestRemote.mockResolvedValueOnce({
      data: {
        item: createReminderItem({
          nextRunAt: "2026-06-22T08:15:00.000Z",
          events: [
            {
              id: "event-1",
              action: "snoozed",
              scheduledFor: REMINDER_NEXT_RUN_AT,
              createdAt: REMINDER_NEXT_RUN_AT,
            },
          ],
        }),
      },
    });

    const item = await updateRemoteReminderAction("task-1", "snoozed", {
      minutes: 15,
    });

    expect(authRemoteMock.requestRemote).toHaveBeenCalledWith(
      "/reminders/task-1",
      {
        method: "PATCH",
        body: JSON.stringify({ action: "snoozed", minutes: 15 }),
      },
      { requireAuth: true }
    );
    expect(item.nextRunAt).toBe("2026-06-22T08:15:00.000Z");
    expect(item.events[0]?.action).toBe("snoozed");
  });
});
