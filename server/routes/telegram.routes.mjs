import { sendJson } from "../lib/http.mjs";

export const createTelegramRoutes = ({ telegramController } = {}) =>
  telegramController
    ? [
        {
          method: "GET",
          pathname: "/api/telegram/status",
          handler: telegramController.getStatus,
        },
        {
          method: "POST",
          pathname: "/api/telegram/connect",
          handler: telegramController.createConnectLink,
        },
        {
          method: "POST",
          pathname: "/api/telegram/disconnect",
          handler: telegramController.disconnect,
        },
      ]
    : [];

export const createTelegramController = ({ telegramService }) => ({
  getStatus: async ({ response, auth }) => {
    sendJson(response, 200, await telegramService.getConnectionStatus(auth.user));
  },

  createConnectLink: async ({ response, auth }) => {
    sendJson(response, 200, await telegramService.createConnectLink(auth.user));
  },

  disconnect: async ({ response, auth }) => {
    sendJson(response, 200, await telegramService.disconnectUser(auth.user));
  },
});
