import { askAssistantQuestion } from "../../api/assistant";
import type {
  AssistantQuestionInput,
  AssistantRuntimeResponse,
} from "../../types/assistant";

export interface AssistantRuntimeProvider {
  askQuestion: (
    input: AssistantQuestionInput
  ) => Promise<AssistantRuntimeResponse>;
}

export const createAssistantRuntimeProvider = (
  askQuestion: AssistantRuntimeProvider["askQuestion"] = askAssistantQuestion
): AssistantRuntimeProvider => ({
  askQuestion,
});

export const assistantRuntimeProvider = createAssistantRuntimeProvider();

export const askAssistantRuntimeQuestion = (
  input: AssistantQuestionInput
) => assistantRuntimeProvider.askQuestion(input);
