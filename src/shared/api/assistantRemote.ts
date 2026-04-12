import type {
  AssistantConversationMessage,
  AssistantQuestionInput,
  AssistantRuntimeResponse,
} from "../types/assistant";
import {
  getRemoteAuthBaseUrl,
  getRemoteAuthToken,
  isCloudSyncActive,
} from "./auth";
import type { AssistantProvider } from "./assistantProvider";

const ASSISTANT_RUNTIME_PATH = "/assistant-runtime";
const ASSISTANT_HISTORY_PATH = "/assistant-runtime/history";

const readRemoteAssistantPayload = async (
  response: Response
): Promise<AssistantRuntimeResponse | null> => {
  try {
    const payload = (await response.json()) as Partial<AssistantRuntimeResponse>;

    if (typeof payload.text !== "string" || !payload.text.trim()) {
      return null;
    }

    return {
      text: payload.text.trim(),
      mode: payload.mode === "remote-cloud" ? "remote-cloud" : "local-preview",
      followUpQuestionIds: Array.isArray(payload.followUpQuestionIds)
        ? payload.followUpQuestionIds.filter(
            (value): value is AssistantRuntimeResponse["followUpQuestionIds"][number] =>
              value === "day_status" ||
              value === "protein_help" ||
              value === "coach_focus" ||
              value === "motivation_focus"
          )
        : [],
    };
  } catch {
    return null;
  }
};

export const remoteAssistantProvider: AssistantProvider = {
  askQuestion: async (input: AssistantQuestionInput) => {
    if (!isCloudSyncActive()) {
      return null;
    }

    const baseUrl = getRemoteAuthBaseUrl();
    const token = getRemoteAuthToken();

    if (!baseUrl || !token) {
      return null;
    }

    try {
      const response = await fetch(`${baseUrl}${ASSISTANT_RUNTIME_PATH}`, {
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
        return null;
      }

      return readRemoteAssistantPayload(response);
    } catch {
      return null;
    }
  },
};

const isAssistantMessageRole = (
  value: unknown
): value is AssistantConversationMessage["role"] =>
  value === "assistant" || value === "user";

const readRemoteAssistantHistoryPayload = async (
  response: Response
): Promise<AssistantConversationMessage[] | null> => {
  try {
    const payload = (await response.json()) as {
      items?: Array<Partial<AssistantConversationMessage>>;
    };

    if (!Array.isArray(payload.items)) {
      return null;
    }

    const items = payload.items
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
          mode: "remote-cloud" as const,
          createdAt:
            typeof item.createdAt === "string" && item.createdAt.trim()
              ? item.createdAt
              : undefined,
        };
      })
      .filter(Boolean) as AssistantConversationMessage[];

    return items;
  } catch {
    return null;
  }
};

export const fetchRemoteAssistantConversationHistory = async () => {
  if (!isCloudSyncActive()) {
    return null;
  }

  const baseUrl = getRemoteAuthBaseUrl();
  const token = getRemoteAuthToken();

  if (!baseUrl || !token) {
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}${ASSISTANT_HISTORY_PATH}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return readRemoteAssistantHistoryPayload(response);
  } catch {
    return null;
  }
};

export const clearRemoteAssistantConversationHistory = async () => {
  if (!isCloudSyncActive()) {
    return false;
  }

  const baseUrl = getRemoteAuthBaseUrl();
  const token = getRemoteAuthToken();

  if (!baseUrl || !token) {
    return false;
  }

  try {
    const response = await fetch(`${baseUrl}${ASSISTANT_HISTORY_PATH}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
};
