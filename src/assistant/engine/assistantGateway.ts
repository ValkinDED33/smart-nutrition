import { askAssistantQuestion } from "@shared/api/assistant";
import type {
  AssistantQuestionInput,
  AssistantRuntimeResponse,
} from "@domain/assistant/types";

export interface AssistantRuntimeGateway {
  askQuestion: (
    input: AssistantQuestionInput
  ) => Promise<AssistantRuntimeResponse>;
}

export const createAssistantRuntimeGateway = (
  askQuestion: AssistantRuntimeGateway["askQuestion"] = askAssistantQuestion
): AssistantRuntimeGateway => ({
  askQuestion,
});

export const assistantRuntimeGateway = createAssistantRuntimeGateway();

export const askAssistantRuntimeQuestion = (
  input: AssistantQuestionInput
) => assistantRuntimeGateway.askQuestion(input);
