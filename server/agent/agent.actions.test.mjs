import { describe, expect, it } from "vitest";
import { buildAgentReply } from "./agent.actions.mjs";

const createIntent = (intent = "create_water_reminder") => ({
  intent,
  confidence: 0.9,
  entities: {},
  reason: "test",
});

const createReminder = (overrides = {}) => ({
  id: "reminder-1",
  type: "water",
  title: "Пити воду",
  dose: "250 мл",
  times: ["09:00"],
  repeat: "daily",
  ...overrides,
});

describe("agent.actions", () => {
  it("uses water-specific action wording for water reminders", () => {
    const reply = buildAgentReply({
      intent: createIntent(),
      toolResult: {
        ok: true,
        type: "reminder_created",
        reminderKind: "water",
        reminder: createReminder(),
      },
    });

    expect(reply).toContain("нагадування про воду");
    expect(reply).toContain("випито");
    expect(reply).not.toContain("прийнято");
  });

  it("keeps medication action wording for medication-like reminders", () => {
    const reply = buildAgentReply({
      intent: createIntent("create_medication_course_reminder"),
      toolResult: {
        ok: true,
        type: "reminder_created",
        reminderKind: "medication_course",
        reminder: createReminder({
          type: "medication_course",
          title: "Магній",
          dose: "1 капсула",
        }),
      },
    });

    expect(reply).toContain("курс ліків");
    expect(reply).toContain("прийнято");
  });

  it("localizes confirmed water actions for the runtime context language", () => {
    const reply = buildAgentReply({
      intent: createIntent("add_water"),
      language: "en",
      toolResult: {
        ok: true,
        type: "water_added",
        amountMl: 250,
        water: {
          consumedMl: 750,
          targetMl: 2000,
        },
      },
    });

    expect(reply).toContain("Done");
    expect(reply).toContain("Added 250 ml of water");
    expect(reply).toContain("Now: 750 / 2000 ml");
    expect(reply).not.toContain("Додав");
  });

  it("localizes water status units for non-Ukrainian replies", () => {
    const reply = buildAgentReply({
      intent: createIntent("show_water_status"),
      language: "en",
      toolResult: {
        ok: true,
        type: "water_status",
        water: {
          consumedMl: 750,
          targetMl: 2000,
        },
      },
    });

    expect(reply).toContain("Water today");
    expect(reply).toContain("750 / 2000 ml");
    expect(reply).not.toContain("мл");
  });

  it("localizes reminder worker confirmations without changing the backend action", () => {
    const reply = buildAgentReply({
      intent: createIntent("create_water_reminder"),
      language: "pl",
      toolResult: {
        ok: true,
        type: "reminder_created",
        reminderKind: "water",
        reminder: createReminder(),
      },
    });

    expect(reply).toContain("Utworzono przypomnienie o wodzie");
    expect(reply).toContain("Przypomnę w Telegramie");
    expect(reply).toContain("wypite");
    expect(reply).not.toContain("випито");
  });
});
