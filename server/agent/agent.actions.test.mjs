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
});
