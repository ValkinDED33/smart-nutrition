import { AssistantApiError } from "../../../lib/domain.mjs";
import {
  DEFAULT_PROVIDER_MAX_TOKENS,
  buildGoogleNativeContents,
  buildGoogleSystemInstruction,
  createProviderError,
  extractAssistantText,
  normalizeText,
} from "../ai.shared.mjs";

const isGoogleHostedProvider = (provider) =>
  String(provider?.baseUrl ?? "").includes("generativelanguage.googleapis.com");

export const shouldRetryWithGoogleNative = (provider, error) =>
  isGoogleHostedProvider(provider) &&
  error instanceof AssistantApiError &&
  error.details?.status === 400 &&
  /multiple authentication credentials received|missing or invalid authorization header/i.test(
    error.details?.providerMessage ?? ""
  );

const getGoogleNativeGenerateContentUrl = (provider) => {
  const assistantUrl = new URL(provider.baseUrl);
  let apiPrefix = assistantUrl.pathname.replace(/\/+$/, "");

  if (apiPrefix.endsWith("/openai")) {
    apiPrefix = apiPrefix.slice(0, -"/openai".length);
  }

  if (apiPrefix.endsWith("/models")) {
    apiPrefix = apiPrefix.slice(0, -"/models".length);
  }

  return `${assistantUrl.origin}${apiPrefix}/models/${encodeURIComponent(
    provider.model
  )}:generateContent`;
};

export const callGoogleNativeProvider = async ({
  question,
  quickQuestionId,
  context,
  history,
  provider,
  signal,
}) => {
  const response = await fetch(getGoogleNativeGenerateContentUrl(provider), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-goog-api-key": provider.apiKey,
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [
          {
            text: buildGoogleSystemInstruction(context),
          },
        ],
      },
      contents: buildGoogleNativeContents({
        history,
        question,
        quickQuestionId,
      }),
      generationConfig: {
        temperature: provider.temperature,
        maxOutputTokens: provider.maxTokens ?? DEFAULT_PROVIDER_MAX_TOKENS,
      },
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
