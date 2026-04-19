import { AssistantApiError } from "../../../lib/domain.mjs";
import {
  DEFAULT_PROVIDER_MAX_TOKENS,
  buildOpenAiCompatibleMessages,
  createProviderError,
  extractAssistantText,
  normalizeText,
} from "../ai.shared.mjs";
import {
  callGoogleNativeProvider,
  shouldRetryWithGoogleNative,
} from "./googleNative.provider.mjs";

const buildOpenAiCompatibleHeaders = (provider) => {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${provider.apiKey}`,
  };

  if (provider.id === "openrouter") {
    if (provider.httpReferer) {
      headers["HTTP-Referer"] = provider.httpReferer;
    }

    if (provider.title) {
      headers["X-Title"] = provider.title;
    }
  }

  return headers;
};

const callOpenAiCompatibleProvider = async ({
  question,
  quickQuestionId,
  context,
  history,
  provider,
  signal,
}) => {
  const response = await fetch(`${provider.baseUrl}${provider.apiPath}`, {
    method: "POST",
    headers: buildOpenAiCompatibleHeaders(provider),
    body: JSON.stringify({
      model: provider.model,
      temperature: provider.temperature,
      max_tokens: provider.maxTokens ?? DEFAULT_PROVIDER_MAX_TOKENS,
      messages: buildOpenAiCompatibleMessages({
        context,
        history,
        question,
        quickQuestionId,
      }),
    }),
    signal,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw createProviderError(provider, response.status, payload);
  }

  const text = extractAssistantText(payload);

  if (!text) {
    throw new AssistantApiError(
      "ASSISTANT_RUNTIME_FAILED",
      "The remote assistant provider returned an empty response.",
      {
        providerId: provider.id,
        providerLabel: provider.label,
        providerModel: provider.model,
        providerBaseUrl: provider.baseUrl,
      }
    );
  }

  return normalizeText(text, { maxLength: 4_000 });
};

export const callAiProvider = async ({
  question,
  quickQuestionId,
  context,
  history,
  provider,
  signal,
}) => {
  try {
    return await callOpenAiCompatibleProvider({
      question,
      quickQuestionId,
      context,
      history,
      provider,
      signal,
    });
  } catch (error) {
    if (shouldRetryWithGoogleNative(provider, error)) {
      return callGoogleNativeProvider({
        question,
        quickQuestionId,
        context,
        history,
        provider,
        signal,
      });
    }

    throw error;
  }
};
