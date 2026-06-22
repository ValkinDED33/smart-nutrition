import { describe, expect, it } from "vitest";
import { detectAgentIntent } from "./agent.intents.mjs";

describe("detectAgentIntent", () => {
  it("detects water logging with explicit milliliters", () => {
    expect(detectAgentIntent("Я випив 300 мл води")).toMatchObject({
      intent: "add_water",
      confidence: 0.94,
      entities: { amountMl: 300 },
    });
  });

  it("detects one glass of water without explicit amount", () => {
    expect(detectAgentIntent("Выпил стакан воды")).toMatchObject({
      intent: "add_water",
      entities: { amountMl: 250 },
    });
  });

  it("detects medication reminder requests", () => {
    expect(detectAgentIntent("Напомни пить витамин D каждый день о 09:00")).toMatchObject({
      intent: "create_medication_reminder",
      entities: {
        text: "Напомни пить витамин D каждый день о 09:00",
      },
    });
  });

  it("detects meal logging with product and grams", () => {
    expect(detectAgentIntent("добавь chicken breast 150 г на обед")).toMatchObject({
      intent: "add_meal",
      confidence: 0.9,
      entities: {
        productQuery: "chicken breast",
        quantity: 150,
        mealType: "lunch",
      },
    });
  });

  it("detects product search requests without adding food", () => {
    expect(detectAgentIntent("найди Greek yogurt")).toMatchObject({
      intent: "search_product",
      entities: {
        productQuery: "Greek yogurt",
      },
    });
  });

  it("falls back to status intents for quick questions", () => {
    expect(detectAgentIntent("что по воде?", { quickQuestionId: "water_help" })).toMatchObject({
      intent: "show_water_status",
    });
  });
});
