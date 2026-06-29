import { readJsonBody, sendError, sendJson, sendNoContent } from "../lib/http.mjs";

const matchPath = (pattern) => (pathname) => {
  const match = pathname.match(pattern);

  if (!match) {
    return null;
  }

  return match.groups ?? {};
};

const decodeRouteParam = (value) => decodeURIComponent(String(value ?? ""));

const toReminderResponse = (reminder) => ({
  id: reminder.id,
  type: reminder.type ?? "medication",
  title: reminder.title,
  dose: reminder.dose ?? "",
  times: Array.isArray(reminder.times) ? reminder.times : [],
  timezone: reminder.timezone,
  durationDays: reminder.durationDays ?? null,
  repeat: reminder.repeat === "once" ? "once" : "daily",
  active: reminder.active !== false,
  nextRunAt: reminder.nextRunAt ?? null,
  lastSentAt: reminder.lastSentAt ?? null,
  createdAt: reminder.createdAt,
  updatedAt: reminder.updatedAt,
  events: Array.isArray(reminder.events) ? reminder.events : [],
});

const sendReminderMutationFailure = (response, result) => {
  const code = result?.code ?? "REMINDER_REQUEST_FAILED";

  if (code === "REMINDER_TYPE_INVALID" || code.endsWith("_PARSE_FAILED")) {
    sendError(response, 400, code, "Could not create this reminder from the provided text.");
    return;
  }

  if (code === "REMINDER_ACTION_INVALID") {
    sendError(response, 400, code, "Reminder action is invalid.");
    return;
  }

  if (code === "REMINDER_SNOOZE_INVALID") {
    sendError(response, 400, code, "Reminder snooze duration is invalid.");
    return;
  }

  if (code === "MEDICATION_REMINDER_NOT_FOUND") {
    sendError(response, 404, code, "Reminder was not found.");
    return;
  }

  sendError(response, 500, code, "Reminder operation failed.");
};

const readSchedulePayload = (body) => {
  if (Array.isArray(body.times)) {
    return body.times;
  }

  if (typeof body.text === "string") {
    return body.text;
  }

  if (typeof body.timeText === "string") {
    return body.timeText;
  }

  return "";
};

const getSnoozeMinutes = (body) => {
  const minutes = Number(body.minutes);

  return Number.isFinite(minutes) ? minutes : undefined;
};

export const createReminderRoutes = ({ reminderController } = {}) =>
  reminderController
    ? [
        {
          method: "GET",
          pathname: "/api/reminders",
          handler: reminderController.listReminders,
        },
        {
          method: "POST",
          pathname: "/api/reminders",
          handler: reminderController.createReminder,
        },
        {
          method: "PATCH",
          match: matchPath(/^\/api\/reminders\/(?<reminderId>[^/]+)$/),
          handler: reminderController.recordReminderAction,
        },
        {
          method: "DELETE",
          match: matchPath(/^\/api\/reminders\/(?<reminderId>[^/]+)$/),
          handler: reminderController.deleteReminder,
        },
      ]
    : [];

export const createReminderController = ({ reminderService, bodyLimitBytes }) => ({
  listReminders: async ({ response, auth, url }) => {
    const activeOnly = url.searchParams.get("active") === "true";
    const reminders = reminderService.listReminders(auth.user, { activeOnly });

    sendJson(response, 200, {
      items: reminders.map(toReminderResponse),
    });
  },

  createReminder: async ({ request, response, auth }) => {
    const body = await readJsonBody(request, bodyLimitBytes);
    const result = await reminderService.createReminderFromUserText(auth.user, {
      type: body.type,
      text: body.text,
    });

    if (!result.ok) {
      sendReminderMutationFailure(response, result);
      return;
    }

    sendJson(response, 201, {
      item: toReminderResponse(result.reminder),
    });
  },

  recordReminderAction: async ({ request, response, auth, params }) => {
    const body = await readJsonBody(request, bodyLimitBytes);
    const reminderId = decodeRouteParam(params.reminderId);
    const action = String(body.action ?? "").trim();
    let result = null;

    if (action === "pause") {
      result = reminderService.pauseReminder
        ? await reminderService.pauseReminder(auth.user, reminderId)
        : { ok: false, code: "REMINDER_ACTION_INVALID" };
    } else if (action === "resume") {
      result = reminderService.resumeReminder
        ? await reminderService.resumeReminder(auth.user, reminderId)
        : { ok: false, code: "REMINDER_ACTION_INVALID" };
    } else if (action === "schedule") {
      result = reminderService.updateReminderSchedule
        ? await reminderService.updateReminderSchedule(
            auth.user,
            reminderId,
            readSchedulePayload(body)
          )
        : { ok: false, code: "REMINDER_ACTION_INVALID" };
    } else if (action === "snoozed" && reminderService.snoozeReminder) {
      result = await reminderService.snoozeReminder(
        auth.user,
        reminderId,
        getSnoozeMinutes(body)
      );
    } else {
      result = await reminderService.recordReminderAction(auth.user, reminderId, action);
    }

    if (!result.ok) {
      sendReminderMutationFailure(response, result);
      return;
    }

    sendJson(response, 200, {
      item: toReminderResponse(result.reminder),
    });
  },

  deleteReminder: async ({ response, auth, params }) => {
    const reminderId = decodeRouteParam(params.reminderId);
    const deleteReminder = reminderService.deleteReminder ?? reminderService.deactivateReminder;
    const result = await deleteReminder(auth.user, reminderId);

    if (!result.ok) {
      sendReminderMutationFailure(response, result);
      return;
    }

    sendNoContent(response);
  },
});
