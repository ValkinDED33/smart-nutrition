import { describe, expect, it } from "vitest";
import {
  buildAssistantWelcomeMessage,
  buildGuidedAssistantReply,
} from "./assistantRuntime";
import type { AssistantRuntimeContext } from "@domain/assistant/types";

const createContext = (): AssistantRuntimeContext => ({
  language: "pl",
  screen: "food",
  currentPath: "/meals",
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
  waterConsumedMl: 900,
  waterTargetMl: 2200,
  latestWeight: 81,
  weightChangeKg: -0.4,
  weeklyCheckInDue: false,
  assistantName: "Diana",
  assistantRole: "assistant",
  assistantTone: "gentle",
  humorEnabled: true,
  assistantPersonality: {
    warmth: 0.9,
    humor: 0.4,
    strictness: 0.2,
    motivation: 0.8,
  },
  communicationStyle: "supportive",
  personalDetails: {
    bloodGroup: "unknown",
    eyeColor: "unknown",
    relationshipStatus: "single",
    supportSystem: "self",
    petCompanion: "dog",
  },
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
    averageWater: 1400,
    averageFiber: 18,
    averageMeals: 2.8,
    breakfastSkippedDays: 1,
    calorieTarget: 2000,
    proteinTarget: 128,
    waterTarget: 2200,
    fiberTarget: 25,
    weightChange: -0.4,
    insights: [{ code: "protein_low", severity: "warning", priority: 95 }],
  },
  coachPrimaryInsight: "protein_low",
  dailyContext: {
    today: {
      dateKey: "2026-04-12",
      entries: 3,
      mealTypes: ["breakfast", "lunch", "dinner"],
      calories: 1460,
      protein: 72,
      fat: 48,
      carbs: 152,
      fiber: 16,
    },
    yesterday: {
      dateKey: "2026-04-11",
      entries: 2,
      mealTypes: ["lunch", "dinner"],
      calories: 1780,
      protein: 84,
      fat: 56,
      carbs: 190,
      fiber: 18,
    },
    week: {
      daysLogged: 5,
      averageCalories: 1920,
      averageProtein: 91,
      averageFiber: 18,
      averageEntries: 2.8,
    },
    targets: {
      calories: 2000,
      protein: 128,
      fat: 70,
      carbs: 220,
      fiber: 25,
      waterMl: 2200,
    },
    gaps: {
      calories: 540,
      protein: 56,
      fat: 22,
      carbs: 68,
      fiber: 9,
      waterMl: 1300,
    },
    progress: {
      calories: 73,
      protein: 56.25,
      fat: 68.57,
      carbs: 69.09,
      fiber: 64,
      water: 40.91,
    },
    primaryFocus: "protein",
    suggestedMealType: "snack",
    patterns: ["low_protein_repeat", "water_low_repeat"],
    nudgeTone: "direct",
  },
  profile: {
    goal: "cut",
    dietStyle: "balanced",
    latestWeight: 81,
    weeklyCheckInDue: false,
  },
  nutritionState: {
    dailyCalories: 2000,
    caloriesConsumed: 1460,
    caloriesRemaining: 540,
    proteinConsumed: 72,
    proteinTarget: 128,
    fatConsumed: 48,
    carbsConsumed: 152,
    waterConsumedMl: 900,
    waterTargetMl: 2200,
  },
  behavior: {
    mealEntriesToday: 3,
    waterLoggedToday: true,
    openMotivationTasks: 1,
    completedMotivationTasks: 2,
  },
  onboarding: {
    preferredName: "Ira",
    primaryGoalNote: "steady fat loss",
    mainFriction: "evening_snacking",
    motivationStyle: "gentle",
    supportNote: "prefers short check-ins",
    completedAt: "2026-04-01T00:00:00.000Z",
  },
  memory: {
    userId: "user-1",
    assistantName: "Diana",
    personality: {
      warmth: 0.9,
      humor: 0.4,
      strictness: 0.2,
      motivation: 0.8,
    },
    communicationStyle: "supportive",
    goals: ["steady fat loss"],
    struggles: ["evening snacking"],
    habits: ["prefers short check-ins"],
    motivationTriggers: ["gentle support"],
    lastMood: "focused",
    recentProblems: [],
  },
  promptContext: {
    area: "meals",
    screenName: "Meals",
    duties: ["suggest", "analyze", "warn"],
    tone: "focused",
    capabilities: [
      {
        id: "meal-helper",
        area: "meals",
        duties: ["suggest", "analyze", "warn"],
        description: "Helps add food and explain calories, macros, and mistakes.",
        entryRoute: "/meals",
      },
    ],
    defaultAction: {
      label: "Open meal helper",
      route: "/meals",
    },
    currentRoute: "/meals",
    summary:
      "Meals: area=meals; duties=suggest, analyze, warn; tone=focused; capabilities=meal-helper.",
  },
});

describe("assistantRuntime", () => {
  it("builds a localized welcome message", () => {
    const message = buildAssistantWelcomeMessage(createContext());

    expect(message.mode).toBe("guided");
    expect(message.text).toContain("Diana");
    expect(message.text).toContain("540");
    expect(message.text).toContain("Meals");
  });

  it("answers protein questions from current context", () => {
    const response = buildGuidedAssistantReply({
      question: "How is my protein today?",
      context: createContext(),
      quickQuestionId: "protein_help",
    });

    expect(response.text).toContain("56");
    expect(response.followUpQuestionIds).toContain("day_status");
  });

  it("routes motivation questions to motivation context", () => {
    const response = buildGuidedAssistantReply({
      question: "How are my points and tasks?",
      context: createContext(),
    });

    expect(response.text).toContain("punkt");
    expect(response.followUpQuestionIds).toContain("coach_focus");
  });

  it("answers hydration and next-meal questions from current context", () => {
    const water = buildGuidedAssistantReply({
      question: "Co z wodą?",
      context: createContext(),
      quickQuestionId: "water_help",
    });
    const nextMeal = buildGuidedAssistantReply({
      question: "Co zjeść teraz?",
      context: createContext(),
      quickQuestionId: "next_meal",
    });

    expect(water.text).toContain("900");
    expect(water.followUpQuestionIds).toContain("weight_help");
    expect(nextMeal.text).toContain("białka");
    expect(nextMeal.followUpQuestionIds).toContain("protein_help");
  });
});
