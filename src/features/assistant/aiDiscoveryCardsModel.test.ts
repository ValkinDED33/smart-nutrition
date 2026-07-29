import { describe, expect, it } from "vitest";
import type { DailyContext } from "./dailyContext";
import type { AssistantHomeAction } from "./assistantHomeIntelligence";
import {
  buildAIDiscoveryCards,
  buildAIDiscoveryTimeline,
} from "./aiDiscoveryCardsModel";

const primaryAction: AssistantHomeAction = {
  kind: "meal_search",
  label: "Add protein",
  helper: "Choose a product",
  searchQuery: "chicken eggs",
};

const waterAction: AssistantHomeAction = {
  kind: "water",
  label: "Add water",
  helper: "Add one glass",
};

const context: DailyContext = {
  today: {
    dateKey: "2026-07-22",
    entries: 1,
    mealTypes: ["breakfast"],
    calories: 420,
    protein: 18,
    fat: 12,
    carbs: 48,
    fiber: 4,
  },
  yesterday: {
    dateKey: "2026-07-21",
    entries: 3,
    mealTypes: ["breakfast", "lunch", "dinner"],
    calories: 1780,
    protein: 82,
    fat: 54,
    carbs: 210,
    fiber: 18,
  },
  week: {
    daysLogged: 4,
    averageCalories: 1700,
    averageProtein: 82,
    averageFiber: 17,
    averageEntries: 3,
  },
  targets: {
    calories: 2200,
    protein: 130,
    fat: 72,
    carbs: 250,
    fiber: 25,
    waterMl: 2200,
  },
  gaps: {
    calories: 1780,
    protein: 112,
    fat: 60,
    carbs: 202,
    fiber: 21,
    waterMl: 1600,
  },
  progress: {
    calories: 19,
    protein: 14,
    fat: 17,
    carbs: 19,
    fiber: 16,
    water: 27,
  },
  primaryFocus: "protein",
  suggestedMealType: "lunch",
  patterns: ["low_protein_repeat", "water_low_repeat"],
  nudgeTone: "direct",
};

describe("buildAIDiscoveryCards", () => {
  it("turns canonical daily context into a focused discovery story", () => {
    const cards = buildAIDiscoveryCards({
      context,
      language: "en",
      primaryAction,
      secondaryActions: [waterAction],
    });

    expect(cards[0]).toMatchObject({
      id: "focus-protein",
      tone: "focus",
      metricLabel: "Protein",
      metricValue: "14%",
      action: primaryAction,
    });
    expect(cards[0]?.steps).toHaveLength(3);
    expect(cards[1]).toMatchObject({
      id: "support-water",
      metricLabel: "Water",
      metricValue: "27%",
      action: waterAction,
    });
  });

  it("keeps steady days celebratory without inventing saved actions", () => {
    const cards = buildAIDiscoveryCards({
      context: {
        ...context,
        primaryFocus: "steady",
        progress: { ...context.progress, water: 88, protein: 90 },
        patterns: ["steady_streak"],
      },
      language: "uk",
      primaryAction,
      secondaryActions: [waterAction],
    });

    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      id: "focus-steady",
      tone: "celebrate",
      metricLabel: "Ритм",
      action: primaryAction,
    });
  });

  it("builds an AI timeline story from canonical daily context and existing actions", () => {
    const timeline = buildAIDiscoveryTimeline({
      context,
      language: "en",
      primaryAction,
    });

    expect(timeline).toHaveLength(4);
    expect(timeline.map((item) => item.tone)).toEqual([
      "food",
      "ai",
      "water",
      "action",
    ]);
    expect(timeline[0]).toMatchObject({
      id: "timeline-food",
      metric: "1 entries",
    });
    expect(timeline[1]).toMatchObject({
      id: "timeline-ai-protein",
      metric: "Protein: 14%",
    });
    expect(timeline[2]).toMatchObject({
      id: "timeline-water",
      metric: "27% water",
    });
    expect(timeline[3]).toMatchObject({
      id: "timeline-action-meal_search",
      action: primaryAction,
    });
  });
});
