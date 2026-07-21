import { describe, expect, it } from "vitest";
import { createAiController } from "./ai.controller.mjs";

class MemoryResponse {
  statusCode = 200;
  headers = {};
  body = "";

  writeHead(statusCode, headers = {}) {
    this.statusCode = statusCode;
    this.headers = { ...this.headers, ...headers };
  }

  end(body = "") {
    this.body = String(body);
  }
}

const diagnosticStatus = {
  configured: true,
  providerCount: 2,
  fallbackEnabled: true,
  model: "openai/gpt-5.4-mini",
  baseUrl: "https://openrouter.ai/api/v1",
  primaryProviderId: "openrouter",
  primaryProviderLabel: "OpenRouter",
  memoryMessageLimit: 12,
  retryCooldownMs: 30_000,
  abuseProtection: {
    dailyRequestLimit: 100,
  },
  providers: [
    {
      id: "openrouter",
      label: "OpenRouter",
      model: "openai/gpt-5.4-mini",
      baseUrl: "https://openrouter.ai/api/v1",
      priority: 1,
      primary: true,
      coolingDown: true,
      coolingDownUntil: "2026-07-22T10:05:00.000Z",
      lastAttemptedAt: "2026-07-22T10:00:00.000Z",
      lastSuccessAt: null,
      lastFailureAt: "2026-07-22T10:00:01.000Z",
      consecutiveFailures: 2,
      lastError: "upstream provider stack trace",
      lastErrorCode: "ASSISTANT_RUNTIME_FAILED",
      lastErrorStatus: 502,
    },
  ],
};

const createController = () =>
  createAiController({
    bodyLimitBytes: 1024,
    aiService: {
      getRuntimeStatus: () => diagnosticStatus,
    },
  });

const readStatusForRole = (role) => {
  const response = new MemoryResponse();

  createController().getRuntimeStatus({
    response,
    auth: { user: { id: `user-${role}`, role } },
  });

  return {
    response,
    payload: JSON.parse(response.body),
  };
};

describe("ai controller runtime status", () => {
  it("returns readiness without provider diagnostics for regular users", () => {
    const { response, payload } = readStatusForRole("VERIFIED_USER");

    expect(response.statusCode).toBe(200);
    expect(payload).toMatchObject({
      configured: true,
      providerCount: 2,
      fallbackEnabled: true,
      model: null,
      baseUrl: null,
      primaryProviderId: null,
      primaryProviderLabel: null,
      memoryMessageLimit: 12,
      retryCooldownMs: 30_000,
      providers: [],
    });
    expect(JSON.stringify(payload)).not.toMatch(
      /openrouter|gpt-5|api\/v1|stack trace|ASSISTANT_RUNTIME_FAILED/i
    );
  });

  it("keeps full assistant diagnostics available to moderator roles", () => {
    const { payload } = readStatusForRole("MODERATOR");

    expect(payload.baseUrl).toBe("https://openrouter.ai/api/v1");
    expect(payload.primaryProviderId).toBe("openrouter");
    expect(payload.providers[0]).toMatchObject({
      id: "openrouter",
      model: "openai/gpt-5.4-mini",
      lastError: "upstream provider stack trace",
    });
  });
});
