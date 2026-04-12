import type {
  AssistantQuestionInput,
  AssistantConversationMessage,
  AssistantRuntimeResponse,
} from "../types/assistant";
import { localAssistantProvider } from "./assistantLocal";
import {
  clearRemoteAssistantConversationHistory,
  fetchRemoteAssistantConversationHistory,
  remoteAssistantProvider,
} from "./assistantRemote";

export const askAssistantQuestion = async (
  input: AssistantQuestionInput
): Promise<AssistantRuntimeResponse> => {
  const remoteResponse = await remoteAssistantProvider.askQuestion(input);

  if (remoteResponse) {
    return remoteResponse;
  }

  const localResponse = await localAssistantProvider.askQuestion(input);

  return (
    localResponse ?? {
      text: "",
      mode: "local-preview",
      followUpQuestionIds: [],
    }
  );
};

export const getAssistantConversationHistory = async (): Promise<
  AssistantConversationMessage[]
> => (await fetchRemoteAssistantConversationHistory()) ?? [];

export const clearAssistantConversationHistory = async () =>
  clearRemoteAssistantConversationHistory();
