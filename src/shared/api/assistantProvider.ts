import type {
  AssistantQuestionInput,
  AssistantRuntimeResponse,
} from "../types/assistant";

export interface AssistantProvider {
  askQuestion: (
    input: AssistantQuestionInput
  ) => Promise<AssistantRuntimeResponse | null>;
}
