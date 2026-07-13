import { askAssistantQuestion } from "@shared/api/assistant";
import type {
  AssistantQuestionInput,
  AssistantRuntimeResponse,
} from "@domain/assistant/types";

interface AssistantRuntimeGateway {
  askQuestion: (
    input: AssistantQuestionInput
  ) => Promise<AssistantRuntimeResponse>;
}

const createAssistantRuntimeGateway = (
  askQuestion: AssistantRuntimeGateway["askQuestion"] = askAssistantQuestion
): AssistantRuntimeGateway => ({
  askQuestion,
});

const assistantRuntimeGateway = createAssistantRuntimeGateway();

export const askAssistantRuntimeQuestion = (
  input: AssistantQuestionInput
) => assistantRuntimeGateway.askQuestion(input);
