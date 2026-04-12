import { describe, expect, it, vi, afterEach } from "vitest";
import { AssistantApiError } from "../lib/domain.mjs";
import { createAssistantService } from "./assistantService.mjs";

const currentUser = {
  id: "user-1",
  name: "Ira",
  goal: "cut",
};

const createAssistantServiceFixture = ({
  configured = true,
  history = [],
} = {}) => {
  const assistantRepository = {
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
  };

  return {
    assistantRepository,
    service: createAssistantService({
      assistantRepository,
      config,
    }),
  };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("assistantService", () => {
  it("returns remote assistant replies and persists the turn", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
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
      }))
    );

    const { assistantRepository, service } = createAssistantServiceFixture({
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
          averageFiber: 18,
          averageMeals: 2.8,
          calorieTarget: 2000,
          proteinTarget: 120,
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
    expect(result.followUpQuestionIds).toEqual(["protein_help", "coach_focus"]);
    expect(assistantRepository.insertConversationMessage).toHaveBeenCalledTimes(2);
    expect(assistantRepository.pruneConversationMessages).toHaveBeenCalledWith(
      currentUser.id,
      16
    );
  });

  it("rejects requests when the remote runtime is not configured", async () => {
    const { service } = createAssistantServiceFixture({ configured: false });

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
    const { assistantRepository, service } = createAssistantServiceFixture({ history });

    const result = service.getConversationHistory(currentUser);
    service.clearConversationHistory(currentUser);

    expect(result).toEqual(history);
    expect(assistantRepository.clearConversationMessages).toHaveBeenCalledWith(currentUser.id);
  });
});
