import type {
  AssistantQuestionInput,
  AssistantConversationMessage,
  AssistantRuntimeResponse,
} from "../types/assistant";
import { buildLocalAssistantReply } from "../lib/assistant/assistantRules";
import {
  assistantQuickQuestionIds,
  isAssistantQuickQuestionId,
} from "../types/assistant";
import {
  getRemoteAuthBaseUrl,
  getRemoteAuthToken,
  isCloudSyncActive,
} from "./auth";

const AI_PATH = "/ai";

const parseAiResponse = async (
  response: Response
): Promise<AssistantRuntimeResponse> => {
  const payload = (await response.json()) as Partial<AssistantRuntimeResponse>;

  if (typeof payload.text !== "string" || !payload.text.trim()) {
    throw new Error("Invalid AI response payload.");
  }

  return {
    text: payload.text.trim(),
    mode: payload.mode === "remote-cloud" ? "remote-cloud" : "remote-cloud",
    followUpQuestionIds: Array.isArray(payload.followUpQuestionIds)
      ? payload.followUpQuestionIds.filter(isAssistantQuickQuestionId)
      : [],
  };
};

const isAssistantMessageRole = (
  value: unknown
): value is AssistantConversationMessage["role"] =>
  value === "assistant" || value === "user";

const parseAiHistory = async (
  response: Response
): Promise<AssistantConversationMessage[]> => {
  const payload = (await response.json()) as {
    items?: Array<Partial<AssistantConversationMessage>>;
  };

  if (!Array.isArray(payload.items)) {
    throw new Error("Invalid AI history payload.");
  }

  return payload.items
    .map((item) => {
      if (
        !item ||
        typeof item.id !== "string" ||
        !isAssistantMessageRole(item.role) ||
        typeof item.text !== "string"
      ) {
        return null;
      }

      const text = item.text.trim();

      if (!text) {
        return null;
      }

      return {
        id: item.id,
        role: item.role,
        text,
        mode: item.mode === "remote-cloud" ? "remote-cloud" : "remote-cloud",
        followUpQuestionIds: Array.isArray(item.followUpQuestionIds)
          ? item.followUpQuestionIds.filter((value): value is (typeof assistantQuickQuestionIds)[number] =>
              isAssistantQuickQuestionId(value)
            )
          : undefined,
        createdAt:
          typeof item.createdAt === "string" && item.createdAt.trim()
            ? item.createdAt
            : undefined,
      };
    })
    .filter(Boolean) as AssistantConversationMessage[];
};

export const askAssistantQuestion = async (
  input: AssistantQuestionInput
): Promise<AssistantRuntimeResponse> => {
  const buildFallback = () => buildLocalAssistantReply(input);

  if (!isCloudSyncActive()) {
    return buildFallback();
  }

  const baseUrl = getRemoteAuthBaseUrl();
  const token = getRemoteAuthToken();

  if (!baseUrl || !token) {
    return buildFallback();
  }

  try {
    const response = await fetch(`${baseUrl}${AI_PATH}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        question: input.question,
        quickQuestionId: input.quickQuestionId ?? null,
        context: input.context,
      }),
    });

    if (!response.ok) {
      return buildFallback();
    }

    return await parseAiResponse(response);
  } catch {
    return buildFallback();
  }
};

export const getAssistantConversationHistory = async (): Promise<
  AssistantConversationMessage[]
> => {
  if (!isCloudSyncActive()) {
    return [];
  }

  const baseUrl = getRemoteAuthBaseUrl();
  const token = getRemoteAuthToken();

  if (!baseUrl || !token) {
    return [];
  }

  const response = await fetch(`${baseUrl}${AI_PATH}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("AI history request failed.");
  }

  return parseAiHistory(response);
};

export const clearAssistantConversationHistory = async () => {
  if (!isCloudSyncActive()) {
    return true;
  }

  const baseUrl = getRemoteAuthBaseUrl();
  const token = getRemoteAuthToken();

  if (!baseUrl || !token) {
    return true;
  }

  const response = await fetch(`${baseUrl}${AI_PATH}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("AI history clear failed.");
  }

  return true;
};
