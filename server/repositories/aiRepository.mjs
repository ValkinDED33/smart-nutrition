export const createAiRepository = (storage) => ({
  listConversationMessages: (userId, limit) =>
    storage.listAssistantMessagesByUserId(userId, limit),
  insertConversationMessage: (message) => storage.insertAssistantMessage(message),
  clearConversationMessages: (userId) => storage.deleteAssistantMessagesByUserId(userId),
  pruneConversationMessages: (userId, keepLast) =>
    storage.pruneAssistantMessagesByUserId(userId, keepLast),
});
