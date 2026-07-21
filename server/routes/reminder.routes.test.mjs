import { Readable } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import { createReminderController, createReminderRoutes } from "./reminder.routes.mjs";

class MemoryResponse {
  statusCode = 200;
  headers = {};
  body = "";

  writeHead(statusCode, headers = {}) {
    this.statusCode = statusCode;
    this.headers = { ...this.headers, ...headers };
  }

  setHeader(name, value) {
    this.headers[name] = value;
  }

  end(body = "") {
    this.body = String(body);
  }
}

const createJsonRequest = (body) => {
  const request = Readable.from([Buffer.from(JSON.stringify(body))]);
  request.headers = { "content-type": "application/json" };
  return request;
};

const parseResponse = (response) =>
  response.body ? JSON.parse(response.body) : null;

const auth = {
  user: {
    id: "user-1",
    name: "Ihor",
  },
};

const reminder = {
  id: "task-1",
  type: "task",
  title: "позвонить врачу",
  dose: "",
  times: ["10:00"],
  timezone: "Europe/Warsaw",
  durationDays: 1,
  repeat: "once",
  trigger: null,
  active: true,
  nextRunAt: "2026-06-22T08:00:00.000Z",
  createdAt: "2026-06-22T07:00:00.000Z",
  updatedAt: "2026-06-22T07:00:00.000Z",
  events: [],
};

describe("reminder routes", () => {
  it("registers protected reminder routes", () => {
    const routes = createReminderRoutes({ reminderController: {} });

    expect(routes.map((route) => route.method)).toEqual(["GET", "POST", "PATCH", "DELETE"]);
  });

  it("lists reminders for the authenticated user", async () => {
    const waterReminder = { ...reminder, id: "water-1", type: "water", title: "Пити воду" };
    const reminderService = {
      listReminders: vi.fn(() => [reminder, waterReminder]),
    };
    const controller = createReminderController({ reminderService, bodyLimitBytes: 4096 });
    const response = new MemoryResponse();

    await controller.listReminders({
      response,
      auth,
      url: new URL("https://api.example/api/reminders?active=true"),
    });

    expect(reminderService.listReminders).toHaveBeenCalledWith(auth.user, {
      activeOnly: true,
    });
    expect(response.statusCode).toBe(200);
    expect(parseResponse(response)).toMatchObject({
      items: [
        expect.objectContaining({ id: "task-1", type: "task" }),
        expect.objectContaining({ id: "water-1", type: "water" }),
      ],
    });
  });

  it("creates reminders through the reminder service", async () => {
    const reminderService = {
      createReminderFromUserText: vi.fn(async () => ({ ok: true, reminder })),
    };
    const controller = createReminderController({ reminderService, bodyLimitBytes: 4096 });
    const response = new MemoryResponse();

    await controller.createReminder({
      request: createJsonRequest({
        type: "task",
        text: "Напомни позвонить врачу о 10:00",
      }),
      response,
      auth,
    });

    expect(reminderService.createReminderFromUserText).toHaveBeenCalledWith(auth.user, {
      type: "task",
      text: "Напомни позвонить врачу о 10:00",
    });
    expect(response.statusCode).toBe(201);
    expect(parseResponse(response)).toMatchObject({
      item: {
        id: "task-1",
        title: "позвонить врачу",
      },
    });
  });

  it("returns after-meal trigger details for event-based reminders", async () => {
    const afterMealReminder = {
      ...reminder,
      id: "after-lunch-1",
      type: "medication",
      times: [],
      nextRunAt: null,
      trigger: {
        kind: "after_meal",
        mealType: "lunch",
        offsetMinutes: 15,
        windowStart: "12:00",
        windowEnd: "16:30",
      },
    };
    const reminderService = {
      listReminders: vi.fn(() => [afterMealReminder]),
    };
    const controller = createReminderController({ reminderService, bodyLimitBytes: 4096 });
    const response = new MemoryResponse();

    await controller.listReminders({
      response,
      auth,
      url: new URL("https://api.example/api/reminders"),
    });

    expect(response.statusCode).toBe(200);
    expect(parseResponse(response)).toMatchObject({
      items: [
        {
          id: "after-lunch-1",
          times: [],
          nextRunAt: null,
          trigger: {
            kind: "after_meal",
            mealType: "lunch",
            offsetMinutes: 15,
            windowStart: "12:00",
            windowEnd: "16:30",
          },
        },
      ],
    });
  });

  it("returns a clean validation error when creation fails", async () => {
    const reminderService = {
      createReminderFromUserText: vi.fn(async () => ({
        ok: false,
        code: "TASK_REMINDER_PARSE_FAILED",
      })),
    };
    const controller = createReminderController({ reminderService, bodyLimitBytes: 4096 });
    const response = new MemoryResponse();

    await controller.createReminder({
      request: createJsonRequest({ type: "task", text: "позвонить врачу" }),
      response,
      auth,
    });

    expect(response.statusCode).toBe(400);
    expect(parseResponse(response)).toMatchObject({
      code: "TASK_REMINDER_PARSE_FAILED",
    });
  });

  it("records reminder actions and deletes reminders", async () => {
    const reminderService = {
      recordReminderAction: vi.fn(async () => ({ ok: true, reminder })),
      deleteReminder: vi.fn(async () => ({ ok: true, reminder })),
    };
    const controller = createReminderController({ reminderService, bodyLimitBytes: 4096 });
    const actionResponse = new MemoryResponse();
    const deleteResponse = new MemoryResponse();

    await controller.recordReminderAction({
      request: createJsonRequest({ action: "done" }),
      response: actionResponse,
      auth,
      params: { reminderId: encodeURIComponent("task-1") },
    });
    await controller.deleteReminder({
      response: deleteResponse,
      auth,
      params: { reminderId: encodeURIComponent("task-1") },
    });

    expect(reminderService.recordReminderAction).toHaveBeenCalledWith(
      auth.user,
      "task-1",
      "done"
    );
    expect(reminderService.deleteReminder).toHaveBeenCalledWith(auth.user, "task-1");
    expect(actionResponse.statusCode).toBe(200);
    expect(deleteResponse.statusCode).toBe(204);
  });

  it("routes lifecycle actions to dedicated reminder service methods", async () => {
    const reminderService = {
      pauseReminder: vi.fn(async () => ({ ok: true, reminder: { ...reminder, active: false } })),
      resumeReminder: vi.fn(async () => ({ ok: true, reminder })),
      snoozeReminder: vi.fn(async () => ({ ok: true, reminder })),
      updateReminderSchedule: vi.fn(async () => ({
        ok: true,
        reminder: { ...reminder, times: ["22:00"] },
      })),
    };
    const controller = createReminderController({ reminderService, bodyLimitBytes: 4096 });

    const pauseResponse = new MemoryResponse();
    const resumeResponse = new MemoryResponse();
    const snoozeResponse = new MemoryResponse();
    const scheduleResponse = new MemoryResponse();

    await controller.recordReminderAction({
      request: createJsonRequest({ action: "pause" }),
      response: pauseResponse,
      auth,
      params: { reminderId: "task-1" },
    });
    await controller.recordReminderAction({
      request: createJsonRequest({ action: "resume" }),
      response: resumeResponse,
      auth,
      params: { reminderId: "task-1" },
    });
    await controller.recordReminderAction({
      request: createJsonRequest({ action: "snoozed", minutes: 15 }),
      response: snoozeResponse,
      auth,
      params: { reminderId: "task-1" },
    });
    await controller.recordReminderAction({
      request: createJsonRequest({ action: "schedule", text: "22:00" }),
      response: scheduleResponse,
      auth,
      params: { reminderId: "task-1" },
    });

    expect(reminderService.pauseReminder).toHaveBeenCalledWith(auth.user, "task-1");
    expect(reminderService.resumeReminder).toHaveBeenCalledWith(auth.user, "task-1");
    expect(reminderService.snoozeReminder).toHaveBeenCalledWith(auth.user, "task-1", 15);
    expect(reminderService.updateReminderSchedule).toHaveBeenCalledWith(
      auth.user,
      "task-1",
      "22:00"
    );
    expect(pauseResponse.statusCode).toBe(200);
    expect(resumeResponse.statusCode).toBe(200);
    expect(snoozeResponse.statusCode).toBe(200);
    expect(scheduleResponse.statusCode).toBe(200);
  });

  it("falls back to deactivation when physical delete is not available", async () => {
    const reminderService = {
      deactivateReminder: vi.fn(async () => ({ ok: true, reminder })),
    };
    const controller = createReminderController({ reminderService, bodyLimitBytes: 4096 });
    const response = new MemoryResponse();

    await controller.deleteReminder({
      response,
      auth,
      params: { reminderId: "task-1" },
    });

    expect(reminderService.deactivateReminder).toHaveBeenCalledWith(auth.user, "task-1");
    expect(response.statusCode).toBe(204);
  });
});
