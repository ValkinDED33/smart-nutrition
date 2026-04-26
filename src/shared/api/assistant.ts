import type {
  AssistantQuestionInput,
  AssistantConversationMessage,
  AssistantRuntimeResponse,
  AssistantRuntimeStatus,
  AssistantRuntimeStatusProvider,
} from "../types/assistant";
import { buildLocalAssistantReply } from "../lib/assistant/assistantRules";
import {
  assistantQuickQuestionIds,
  isAssistantQuickQuestionId,
} from "../types/assistant";
import {
  getRemoteAuthBaseUrl,
  isCloudSyncActive,
} from "./auth";

const AI_PATH = "/ai";
const AI_STATUS_PATH = "/ai/status";

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

  if (!baseUrl) {
    return buildFallback();
  }

  try {
    const response = await fetch(`${baseUrl}${AI_PATH}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
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

  if (!baseUrl) {
    return [];
  }

  const response = await fetch(`${baseUrl}${AI_PATH}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
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

  if (!baseUrl) {
    return true;
  }

  const response = await fetch(`${baseUrl}${AI_PATH}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("AI history clear failed.");
  }

  return true;
};

const parseAiRuntimeStatus = async (
  response: Response
): Promise<AssistantRuntimeStatus> => {
  const payload = (await response.json()) as Partial<AssistantRuntimeStatus>;
  const providers = Array.isArray(payload.providers)
    ? payload.providers.map((provider, index) => {
        const item = provider as Partial<AssistantRuntimeStatusProvider>;

        return {
          id: typeof item.id === "string" ? item.id : `provider-${index + 1}`,
          label: typeof item.label === "string" ? item.label : `Provider ${index + 1}`,
          model: typeof item.model === "string" ? item.model : null,
          baseUrl: typeof item.baseUrl === "string" ? item.baseUrl : null,
          priority:
            typeof item.priority === "number" && Number.isFinite(item.priority)
              ? item.priority
              : index + 1,
          primary: Boolean(item.primary),
          coolingDown: Boolean(item.coolingDown),
          coolingDownUntil:
            typeof item.coolingDownUntil === "string" ? item.coolingDownUntil : null,
          lastAttemptedAt:
            typeof item.lastAttemptedAt === "string" ? item.lastAttemptedAt : null,
          lastSuccessAt: typeof item.lastSuccessAt === "string" ? item.lastSuccessAt : null,
          lastFailureAt: typeof item.lastFailureAt === "string" ? item.lastFailureAt : null,
          consecutiveFailures:
            typeof item.consecutiveFailures === "number" &&
            Number.isFinite(item.consecutiveFailures)
              ? item.consecutiveFailures
              : 0,
          lastError: typeof item.lastError === "string" ? item.lastError : null,
          lastErrorCode: typeof item.lastErrorCode === "string" ? item.lastErrorCode : null,
          lastErrorStatus:
            typeof item.lastErrorStatus === "number" && Number.isFinite(item.lastErrorStatus)
              ? item.lastErrorStatus
              : null,
        };
      })
    : [];

  return {
    configured: Boolean(payload.configured),
    providerCount:
      typeof payload.providerCount === "number" && Number.isFinite(payload.providerCount)
        ? payload.providerCount
        : providers.length,
    fallbackEnabled: Boolean(payload.fallbackEnabled),
    model: typeof payload.model === "string" ? payload.model : null,
    baseUrl: typeof payload.baseUrl === "string" ? payload.baseUrl : null,
    primaryProviderId:
      typeof payload.primaryProviderId === "string" ? payload.primaryProviderId : null,
    primaryProviderLabel:
      typeof payload.primaryProviderLabel === "string" ? payload.primaryProviderLabel : null,
    memoryMessageLimit:
      typeof payload.memoryMessageLimit === "number" &&
      Number.isFinite(payload.memoryMessageLimit)
        ? payload.memoryMessageLimit
        : 0,
    retryCooldownMs:
      typeof payload.retryCooldownMs === "number" && Number.isFinite(payload.retryCooldownMs)
        ? payload.retryCooldownMs
        : 0,
    providers,
  };
};

export const getAssistantRuntimeStatus = async (): Promise<AssistantRuntimeStatus | null> => {
  if (!isCloudSyncActive()) {
    return null;
  }

  const baseUrl = getRemoteAuthBaseUrl();

  if (!baseUrl) {
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}${AI_STATUS_PATH}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    return await parseAiRuntimeStatus(response);
  } catch {
    return null;
  }
};
