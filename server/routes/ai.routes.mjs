const AI_PATH = "/api/ai";

export const createAiRoutes = ({ aiController }) => [
  {
    method: "POST",
    pathname: AI_PATH,
    handler: aiController.askQuestion,
  },
  {
    method: "GET",
    pathname: AI_PATH,
    handler: aiController.getConversationHistory,
  },
  {
    method: "DELETE",
    pathname: AI_PATH,
    handler: aiController.clearConversationHistory,
  },
];
