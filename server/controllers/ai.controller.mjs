import { readJsonBody, sendJson, sendNoContent } from "../lib/http.mjs";
import { hasRoleAtLeast } from "../lib/domain.mjs";

const canSeeAssistantDiagnostics = (user) =>
  user?.role === "HELPER" ||
  user?.role === "NUTRITIONIST" ||
  hasRoleAtLeast(user?.role, "MODERATOR");

const toPublicRuntimeStatus = (status) => ({
  configured: Boolean(status.configured),
  providerCount: Number.isFinite(Number(status.providerCount))
    ? Number(status.providerCount)
    : 0,
  fallbackEnabled: Boolean(status.fallbackEnabled),
  model: null,
  baseUrl: null,
  primaryProviderId: null,
  primaryProviderLabel: null,
  memoryMessageLimit: Number.isFinite(Number(status.memoryMessageLimit))
    ? Number(status.memoryMessageLimit)
    : 0,
  retryCooldownMs: Number.isFinite(Number(status.retryCooldownMs))
    ? Number(status.retryCooldownMs)
    : 0,
  providers: [],
});

export const createAiController = ({ aiService, bodyLimitBytes }) => ({
  getRuntimeStatus: ({ response, auth }) => {
    const status = aiService.getRuntimeStatus();
    sendJson(
      response,
      200,
      canSeeAssistantDiagnostics(auth?.user)
        ? status
        : toPublicRuntimeStatus(status)
    );
  },

  askQuestion: async ({ request, response, auth }) => {
    const body = await readJsonBody(request, bodyLimitBytes);
    sendJson(response, 200, await aiService.askQuestion(auth.user, body));
  },

  getConversationHistory: async ({ response, auth, url }) => {
    sendJson(response, 200, {
      items: await aiService.getConversationHistory(
        auth.user,
        url.searchParams.get("limit") ?? undefined
      ),
    });
  },

  clearConversationHistory: async ({ response, auth }) => {
    await aiService.clearConversationHistory(auth.user);
    sendNoContent(response);
  },
});
