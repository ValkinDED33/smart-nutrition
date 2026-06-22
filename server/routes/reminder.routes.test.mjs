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
      deactivateReminder: vi.fn(async () => ({ ok: true, reminder })),
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
    expect(reminderService.deactivateReminder).toHaveBeenCalledWith(auth.user, "task-1");
    expect(actionResponse.statusCode).toBe(200);
    expect(deleteResponse.statusCode).toBe(204);
  });
});
