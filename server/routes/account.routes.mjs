import { sendJson, sendNoContent } from "../lib/http.mjs";

const matchPath = (pattern) => (pathname) => {
  const match = pathname.match(pattern);

  if (!match) {
    return null;
  }

  return match.groups ?? {};
};

const toAttachmentFilename = (value, fallback = "smart-nutrition-backup.json") => {
  const filename = String(value ?? "")
    .replace(/[\r\n\\/:"*?<>|]+/g, "_")
    .replace(/[^\w. -]+/g, "_")
    .trim()
    .slice(0, 120);

  return filename || fallback;
};

export const createAccountRoutes = ({ accountController } = {}) =>
  accountController
    ? [
        {
          method: "DELETE",
          pathname: "/api/account",
          handler: accountController.deleteAccount,
        },
        {
          method: "GET",
          pathname: "/api/account/export",
          handler: accountController.exportAccount,
        },
        {
          method: "GET",
          pathname: "/api/account/backups",
          handler: accountController.listBackups,
        },
        {
          method: "GET",
          match: matchPath(/^\/api\/account\/backups\/(?<backupId>[^/]+)$/),
          handler: accountController.downloadBackup,
        },
      ]
    : [];

export const createAccountController = ({ authService, clearAuthCookies }) => ({
  deleteAccount: async ({ response, auth }) => {
    await authService.deleteAccount(auth.user);
    clearAuthCookies(response);
    sendNoContent(response);
  },

  exportAccount: async ({ response, auth }) => {
    sendJson(response, 200, await authService.exportAccountData(auth.user));
  },

  listBackups: async ({ response, auth }) => {
    sendJson(response, 200, {
      items: await authService.listAccountBackups(auth.user),
    });
  },

  downloadBackup: async ({ response, auth, params }) => {
    const backupId = decodeURIComponent(params.backupId);
    const backupPayload = await authService.readAccountBackup(auth.user, backupId);

    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${toAttachmentFilename(backupId)}"`
    );
    sendJson(response, 200, backupPayload);
  },
});
