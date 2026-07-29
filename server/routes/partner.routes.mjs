import { readJsonBody, sendJson } from "../lib/http.mjs";

export const createPartnerRoutes = ({ partnerController } = {}) =>
  partnerController
    ? [
        { method: "POST", pathname: "/api/partner/invites", handler: partnerController.createInvite },
        {
          method: "POST",
          pathname: "/api/partner/invites/accept",
          handler: partnerController.acceptInvite,
        },
        {
          method: "GET",
          pathname: "/api/partner/pregnancy",
          handler: partnerController.listPregnancyShares,
        },
      ]
    : [];

export const createPartnerController = ({ partnerService, bodyLimitBytes }) => ({
  createInvite: async ({ request, response, auth }) => {
    const body = await readJsonBody(request, bodyLimitBytes);
    sendJson(
      response,
      201,
      await partnerService.createInvite(auth.user, {
        partnerEmail: body?.partnerEmail,
      })
    );
  },

  acceptInvite: async ({ request, response, auth }) => {
    const body = await readJsonBody(request, bodyLimitBytes);
    sendJson(response, 200, await partnerService.acceptInvite(auth.user, body?.code));
  },

  listPregnancyShares: async ({ response, auth }) => {
    sendJson(response, 200, await partnerService.listPregnancyShares(auth.user));
  },
});
