import { readJsonBody, sendJson, sendNoContent } from "../lib/http.mjs";

export const createAiController = ({ aiService, bodyLimitBytes }) => ({
  getRuntimeStatus: ({ response }) => {
    sendJson(response, 200, aiService.getRuntimeStatus());
  },

  askQuestion: async ({ request, response, auth }) => {
    const body = await readJsonBody(request, bodyLimitBytes);
    sendJson(response, 200, await aiService.askQuestion(auth.user, body));
  },

  getConversationHistory: ({ response, auth, url }) => {
    sendJson(response, 200, {
      items: aiService.getConversationHistory(
        auth.user,
        url.searchParams.get("limit") ?? undefined
      ),
    });
  },

  clearConversationHistory: ({ response, auth }) => {
    aiService.clearConversationHistory(auth.user);
    sendNoContent(response);
  },
});
