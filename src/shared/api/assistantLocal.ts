import { buildLocalAssistantReply } from "../lib/assistant/assistantRules";
import type { AssistantProvider } from "./assistantProvider";

export const localAssistantProvider: AssistantProvider = {
  askQuestion: async (input) => buildLocalAssistantReply(input),
};
