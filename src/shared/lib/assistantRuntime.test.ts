import { describe, expect, it } from "vitest";
import {
  buildAssistantWelcomeMessage,
  buildLocalAssistantReply,
} from "./assistantRuntime";
import type { AssistantRuntimeContext } from "../types/assistant";

const createContext = (): AssistantRuntimeContext => ({
  language: "pl",
  userName: "Ira",
  goal: "cut",
  dietStyle: "balanced",
  dailyCalories: 2000,
  caloriesConsumed: 1460,
  caloriesRemaining: 540,
  proteinConsumed: 72,
  proteinTarget: 128,
  fatConsumed: 48,
  carbsConsumed: 152,
  mealEntriesToday: 3,
  assistantName: "Nova",
  assistantRole: "assistant",
  assistantTone: "gentle",
  humorEnabled: true,
  motivation: {
    points: 65,
    level: 1,
    completedTasks: 2,
    activeTasks: [
      {
        id: "2026-04-12-check-in",
        title: "Check in",
        description: "Check in",
        points: 15,
        category: "consistency",
        createdAt: "2026-04-12T06:00:00.000Z",
        completedAt: "2026-04-12T06:30:00.000Z",
        skippedWithDayOffAt: null,
      },
      {
        id: "2026-04-12-nutrition",
        title: "Nutrition",
        description: "Nutrition",
        points: 25,
        category: "nutrition",
        createdAt: "2026-04-12T06:05:00.000Z",
        completedAt: null,
        skippedWithDayOffAt: null,
      },
    ],
    history: [],
    achievements: [],
    lastTaskRefreshDate: "2026-04-12",
    freeDayLastUsedAt: null,
    paidDayLastUsedAt: null,
    paidDayLastUsedMonth: null,
  },
  coach: {
    score: 68,
    status: "steady",
    daysLogged: 5,
    averageCalories: 1920,
    averageProtein: 91,
    averageFiber: 18,
    averageMeals: 2.8,
    calorieTarget: 2000,
    proteinTarget: 128,
    fiberTarget: 25,
    weightChange: -0.4,
    insights: [{ code: "protein_low", severity: "warning", priority: 95 }],
  },
  coachPrimaryInsight: "protein_low",
});

describe("assistantRuntime", () => {
  it("builds a localized welcome message", () => {
    const message = buildAssistantWelcomeMessage(createContext());

    expect(message.mode).toBe("local-preview");
    expect(message.text).toContain("Nova");
    expect(message.text).toContain("540");
  });

  it("answers protein questions from current context", () => {
    const response = buildLocalAssistantReply({
      question: "How is my protein today?",
      context: createContext(),
      quickQuestionId: "protein_help",
    });

    expect(response.text).toContain("56");
    expect(response.followUpQuestionIds).toContain("day_status");
  });

  it("routes motivation questions to motivation context", () => {
    const response = buildLocalAssistantReply({
      question: "How are my points and tasks?",
      context: createContext(),
    });

    expect(response.text).toContain("punkt");
    expect(response.followUpQuestionIds).toContain("coach_focus");
  });
});
