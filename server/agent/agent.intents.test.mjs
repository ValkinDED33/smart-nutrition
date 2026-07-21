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

  it("detects explicit Telegram water add wording", () => {
    expect(detectAgentIntent("добавь 250 мл воды")).toMatchObject({
      intent: "add_water",
      entities: { amountMl: 250 },
    });
  });

  it("does not treat water status questions as water logging", () => {
    expect(detectAgentIntent("шо с водой")).toMatchObject({
      intent: "show_water_status",
    });
    expect(detectAgentIntent("сколько воды сегодня")).toMatchObject({
      intent: "show_water_status",
    });
  });

  it("detects medication reminder requests", () => {
    expect(detectAgentIntent("Напомни пить витамин D каждый день о 09:00")).toMatchObject({
      intent: "create_medication_reminder",
      entities: {
        text: "Напомни пить витамин D каждый день о 09:00",
      },
    });
    expect(detectAgentIntent("Мне надо пить магний в 22:00")).toMatchObject({
      intent: "create_medication_reminder",
      entities: {
        text: "Мне надо пить магний в 22:00",
      },
    });
  });

  it("detects ordinary task reminders separately from medication", () => {
    expect(detectAgentIntent("Напомни позвонить врачу о 10:00")).toMatchObject({
      intent: "create_task_reminder",
      entities: {
        text: "Напомни позвонить врачу о 10:00",
      },
    });
  });

  it("detects follow-up requests before generic task reminders", () => {
    expect(detectAgentIntent("напомни проверить воду через 30 минут")).toMatchObject({
      intent: "create_follow_up",
      entities: {
        text: "напомни проверить воду через 30 минут",
      },
    });
    expect(detectAgentIntent("check back with me at 18:00")).toMatchObject({
      intent: "create_follow_up",
    });
  });

  it("detects saved favorite product requests before meal logging", () => {
    expect(detectAgentIntent("сохрани chicken breast в избранное")).toMatchObject({
      intent: "save_favorite",
      entities: {
        productQuery: "chicken breast",
      },
    });
    expect(detectAgentIntent("save skyr as favorite")).toMatchObject({
      intent: "save_favorite",
      entities: {
        productQuery: "skyr",
      },
    });
  });

  it("detects recipe creation requests before generic meal actions", () => {
    expect(detectAgentIntent("создай рецепт с chicken breast и rice на обед")).toMatchObject({
      intent: "create_recipe",
      entities: {
        text: "chicken breast и rice",
        mealType: "lunch",
        fromFridge: false,
      },
    });
    expect(detectAgentIntent("придумай рецепт из холодильника")).toMatchObject({
      intent: "create_recipe",
      entities: {
        text: "",
        fromFridge: true,
      },
    });
  });

  it("detects water reminder requests before treating the text as water logging", () => {
    expect(detectAgentIntent("Напоминай пить воду каждый день о 09:00")).toMatchObject({
      intent: "create_water_reminder",
      entities: {
        text: "Напоминай пить воду каждый день о 09:00",
      },
    });
  });

  it("detects pregnancy supplement reminders as a typed reminder", () => {
    expect(detectAgentIntent("Нагадуй фолієву кислоту щодня о 09:00")).toMatchObject({
      intent: "create_pregnancy_supplement_reminder",
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

  it("detects day summary requests separately from quick day status", () => {
    expect(detectAgentIntent("сделай итог дня сегодня")).toMatchObject({
      intent: "generate_day_summary",
      confidence: 0.84,
    });
    expect(detectAgentIntent("daily report today")).toMatchObject({
      intent: "generate_day_summary",
    });
  });

  it("detects weekly and monthly progress report requests", () => {
    expect(detectAgentIntent("сделай отчет за неделю")).toMatchObject({
      intent: "generate_report",
      confidence: 0.86,
      entities: {
        period: "week",
      },
    });
    expect(detectAgentIntent("monthly progress report")).toMatchObject({
      intent: "generate_report",
      entities: {
        period: "month",
      },
    });
  });
});
