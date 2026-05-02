import { describe, expect, it, vi, afterEach } from "vitest";
import { AssistantApiError } from "../../lib/domain.mjs";
import { createAiService } from "./ai.service.mjs";

const currentUser = {
  id: "user-1",
  name: "Ira",
  goal: "cut",
};

const createAiServiceFixture = ({
  configured = true,
  history = [],
  configOverrides = {},
} = {}) => {
  const aiRepository = {
    listConversationMessages: vi.fn(() => history),
    insertConversationMessage: vi.fn(),
    clearConversationMessages: vi.fn(),
    pruneConversationMessages: vi.fn(),
  };

  const config = {
    assistantRuntimeConfigured: configured,
    assistantApiKey: "secret",
    assistantModel: "gpt-4.1-mini",
    assistantBaseUrl: "https://api.openai.com/v1",
    assistantApiPath: "/chat/completions",
    assistantTemperature: 0.4,
    assistantMemoryMessageLimit: 16,
    assistantTimeoutMs: 15_000,
    assistantRetryCooldownMs: 60_000,
    ...configOverrides,
  };

  return {
    aiRepository,
    service: createAiService({
      aiRepository,
      config,
    }),
  };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ai.service", () => {
  it("returns remote assistant replies and persists the turn", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: "Keep dinner light and add one more protein serving.",
            },
          },
        ],
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const { aiRepository, service } = createAiServiceFixture({
      history: [
        {
          id: "assistant-msg-1",
          userId: currentUser.id,
          role: "assistant",
          text: "Previous reply",
          createdAt: "2026-04-12T08:00:00.000Z",
        },
      ],
    });

    const result = await service.askQuestion(currentUser, {
      question: "What should I do next today?",
      quickQuestionId: "day_status",
      context: {
        language: "pl",
        userName: "Ira",
        goal: "cut",
        dailyCalories: 2000,
        caloriesConsumed: 1600,
        caloriesRemaining: 400,
        proteinConsumed: 80,
        proteinTarget: 120,
        fatConsumed: 50,
        carbsConsumed: 160,
        mealEntriesToday: 3,
        waterConsumedMl: 1000,
        waterTargetMl: 2200,
        latestWeight: 78,
        weightChangeKg: -0.4,
        weeklyCheckInDue: false,
        assistantName: "Nova",
        assistantRole: "assistant",
        assistantTone: "gentle",
        humorEnabled: true,
        coachPrimaryInsight: "protein_low",
        coach: {
          score: 72,
          status: "steady",
          daysLogged: 5,
          averageCalories: 1900,
          averageProtein: 95,
          averageWater: 1500,
          averageFiber: 18,
          averageMeals: 2.8,
          breakfastSkippedDays: 1,
          calorieTarget: 2000,
          proteinTarget: 120,
          waterTarget: 2200,
          fiberTarget: 25,
          weightChange: -0.4,
        },
        motivation: {
          points: 80,
          level: 2,
          completedTasks: 3,
          activeTasks: [{ id: "task-1", completedAt: null, skippedWithDayOffAt: null }],
        },
      },
    });

    expect(result.mode).toBe("remote-cloud");
    expect(result.text).toContain("protein");
    expect(result.providerLabel).toBe("OpenAI");
    expect(result.followUpQuestionIds).toEqual(["protein_help", "water_help"]);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).max_tokens).toBe(512);
    expect(aiRepository.insertConversationMessage).toHaveBeenCalledTimes(2);
    expect(aiRepository.pruneConversationMessages).toHaveBeenCalledWith(currentUser.id, 16);
  });

  it("rejects requests when the remote runtime is not configured", async () => {
    const { service } = createAiServiceFixture({ configured: false });

    await expect(
      service.askQuestion(currentUser, {
        question: "Hello",
        context: {},
      })
    ).rejects.toBeInstanceOf(AssistantApiError);
  });

  it("returns stored conversation history and clears it on request", () => {
    const history = [
      {
        id: "assistant-msg-1",
        userId: currentUser.id,
        role: "user",
        text: "Hi",
        createdAt: "2026-04-12T08:00:00.000Z",
      },
    ];
    const { aiRepository, service } = createAiServiceFixture({ history });

    const result = service.getConversationHistory(currentUser);
    service.clearConversationHistory(currentUser);

    expect(result).toEqual(history);
    expect(aiRepository.clearConversationMessages).toHaveBeenCalledWith(currentUser.id);
  });

  it("falls back to the next configured provider when the primary provider fails", async () => {
    const fetchMock = vi.fn(async (url) => {
      if (String(url).includes("openrouter.ai")) {
        return {
          ok: false,
          status: 401,
          json: async () => ({
            error: {
              message: "Missing Authentication header",
            },
          }),
        };
      }

      return {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "OK from Groq fallback.",
              },
            },
          ],
        }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    const { service } = createAiServiceFixture({
      configOverrides: {
        assistantProviders: [
          {
            id: "openrouter",
            label: "OpenRouter",
            apiKey: "router-key",
            model: "openai/gpt-5.4-mini",
            baseUrl: "https://openrouter.ai/api/v1",
            apiPath: "/chat/completions",
            timeoutMs: 15_000,
            temperature: 0.4,
            httpReferer: "http://localhost",
            title: "Smart Nutrition",
          },
          {
            id: "groq",
            label: "Groq",
            apiKey: "groq-key",
            model: "llama-3.3-70b-versatile",
            baseUrl: "https://api.groq.com/openai/v1",
            apiPath: "/chat/completions",
            timeoutMs: 15_000,
            temperature: 0.4,
          },
        ],
      },
    });

    const result = await service.askQuestion(currentUser, {
      question: "Reply with OK",
      context: {},
    });

    const runtimeStatus = service.getRuntimeStatus();

    expect(result.text).toContain("Groq fallback");
    expect(result.providerId).toBe("groq");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1].headers["HTTP-Referer"]).toBe("http://localhost");
    expect(fetchMock.mock.calls[0][1].headers["X-Title"]).toBe("Smart Nutrition");
    expect(runtimeStatus.providers[0].lastFailureAt).not.toBeNull();
    expect(runtimeStatus.providers[0].coolingDown).toBe(true);
    expect(runtimeStatus.providers[1].lastSuccessAt).not.toBeNull();
  });

  it("falls back to native Gemini when Google OpenAI-compatible auth fails", async () => {
    const fetchMock = vi.fn(async () => {
      if (fetchMock.mock.calls.length === 1) {
        return {
          ok: false,
          status: 400,
          json: async () => [
            {
              error: {
                message: "Multiple authentication credentials received. Please pass only one.",
              },
            },
          ],
        };
      }

      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: "Add a lean protein dinner and keep carbs moderate." }],
              },
            },
          ],
        }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    const { service } = createAiServiceFixture({
      configOverrides: {
        assistantApiKey: "google-key",
        assistantModel: "gemini-2.5-flash",
        assistantBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      },
    });

    const result = await service.askQuestion(currentUser, {
      question: "What should I eat for dinner?",
      context: {
        proteinConsumed: 70,
        proteinTarget: 120,
      },
    });

    expect(result.text).toContain("protein");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
    );
    expect(fetchMock.mock.calls[1][1].headers["x-goog-api-key"]).toBe("google-key");
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBeUndefined();
  });
});
