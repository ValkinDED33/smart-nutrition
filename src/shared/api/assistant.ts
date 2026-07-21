import type {
  AssistantQuestionInput,
  AssistantConversationMessage,
  AssistantRuntimeAction,
  AssistantRuntimeResponse,
  AssistantRuntimeStatus,
  AssistantRuntimeStatusProvider,
} from "@domain/assistant/types";
import {
  assistantQuickQuestionIds,
  isAssistantQuickQuestionId,
} from "@domain/assistant/types";
import {
  getRemoteAuthBaseUrl,
  isCloudSyncActive,
} from "./auth";

const AI_PATH = "/ai";
const AI_STATUS_PATH = "/ai/status";
const AGENT_ACTION_MODE = "agent-action";
const REMOTE_CLOUD_MODE = "remote-cloud";

export type AssistantApiErrorCode =
  | "ASSISTANT_AUTH_REQUIRED"
  | "ASSISTANT_UNAVAILABLE"
  | "ASSISTANT_REQUEST_FAILED"
  | "ASSISTANT_RESPONSE_INVALID";

const getAssistantSafeMessage = (code: AssistantApiErrorCode): string => {
  switch (code) {
    case "ASSISTANT_AUTH_REQUIRED":
      return "The assistant needs your protected Smart Nutrition session before it can answer.";
    case "ASSISTANT_UNAVAILABLE":
      return "The assistant is temporarily unavailable. Try again in a moment.";
    case "ASSISTANT_RESPONSE_INVALID":
      return "The assistant response could not be read safely. Try again in a moment.";
    case "ASSISTANT_REQUEST_FAILED":
    default:
      return "The assistant could not complete this request. Try again in a moment.";
  }
};

export class AssistantApiError extends Error {
  code: AssistantApiErrorCode;
  status?: number;

  constructor(code: AssistantApiErrorCode, status?: number) {
    super(getAssistantSafeMessage(code));
    this.name = "AssistantApiError";
    this.code = code;
    this.status = status;
  }
}

const isSafeInternalRoute = (value: unknown): value is string =>
  typeof value === "string" &&
  value.startsWith("/") &&
  !value.startsWith("//") &&
  !/[\r\n]/u.test(value) &&
  value.length <= 180;

const parseAssistantActions = (value: unknown): AssistantRuntimeAction[] =>
  Array.isArray(value)
    ? value
        .map((item): AssistantRuntimeAction | null => {
          if (!item || typeof item !== "object") {
            return null;
          }

          const action = item as Partial<AssistantRuntimeAction>;

          if (typeof action.id !== "string" || !action.id.trim()) {
            return null;
          }

          const targetRoute = isSafeInternalRoute(action.targetRoute)
            ? action.targetRoute
            : null;
          const targetSurface =
            action.targetSurface === "scanner" ||
            action.targetSurface === "photo_meal" ||
            action.targetSurface === "food"
              ? action.targetSurface
              : null;

          return {
            id: action.id.trim(),
            ok: action.ok === true,
            resultType:
              typeof action.resultType === "string" && action.resultType.trim()
                ? action.resultType.trim()
                : null,
            code:
              typeof action.code === "string" && action.code.trim()
                ? action.code.trim()
                : null,
            targetRoute,
            targetSurface,
          };
        })
        .filter((item): item is AssistantRuntimeAction => item !== null)
    : [];

const getRequiredAssistantBaseUrl = () => {
  if (!isCloudSyncActive()) {
    throw new AssistantApiError("ASSISTANT_AUTH_REQUIRED");
  }

  const baseUrl = getRemoteAuthBaseUrl();

  if (!baseUrl) {
    throw new AssistantApiError("ASSISTANT_UNAVAILABLE");
  }

  return baseUrl;
};

const parseAiResponse = async (
  response: Response
): Promise<AssistantRuntimeResponse> => {
  const payload = (await response.json()) as Partial<AssistantRuntimeResponse>;

  if (typeof payload.text !== "string" || !payload.text.trim()) {
    throw new AssistantApiError("ASSISTANT_RESPONSE_INVALID", response.status);
  }

  return {
    text: payload.text.trim(),
    mode: payload.mode === AGENT_ACTION_MODE ? AGENT_ACTION_MODE : REMOTE_CLOUD_MODE,
    actions: parseAssistantActions(payload.actions),
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
    throw new AssistantApiError("ASSISTANT_RESPONSE_INVALID", response.status);
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
        mode: item.mode === AGENT_ACTION_MODE ? AGENT_ACTION_MODE : REMOTE_CLOUD_MODE,
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
  const baseUrl = getRequiredAssistantBaseUrl();
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${AI_PATH}`, {
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
  } catch {
    throw new AssistantApiError("ASSISTANT_UNAVAILABLE");
  }

  if (!response.ok) {
    throw new AssistantApiError("ASSISTANT_REQUEST_FAILED", response.status);
  }

  return parseAiResponse(response);
};

export const getAssistantConversationHistory = async (): Promise<
  AssistantConversationMessage[]
> => {
  const baseUrl = getRequiredAssistantBaseUrl();

  let response: Response;

  try {
    response = await fetch(`${baseUrl}${AI_PATH}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    });
  } catch {
    throw new AssistantApiError("ASSISTANT_UNAVAILABLE");
  }

  if (!response.ok) {
    throw new AssistantApiError("ASSISTANT_REQUEST_FAILED", response.status);
  }

  return parseAiHistory(response);
};

export const clearAssistantConversationHistory = async () => {
  const baseUrl = getRequiredAssistantBaseUrl();

  let response: Response;

  try {
    response = await fetch(`${baseUrl}${AI_PATH}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    });
  } catch {
    throw new AssistantApiError("ASSISTANT_UNAVAILABLE");
  }

  if (!response.ok) {
    throw new AssistantApiError("ASSISTANT_REQUEST_FAILED", response.status);
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
