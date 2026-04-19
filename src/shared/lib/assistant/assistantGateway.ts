import { askAssistantQuestion } from "../../api/assistant";
import type {
  AssistantQuestionInput,
  AssistantRuntimeResponse,
} from "../../types/assistant";

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
