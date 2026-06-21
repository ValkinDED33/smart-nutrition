import { describe, expect, it, vi } from "vitest";
import { createAssistantAgentService } from "./agent.service.mjs";

const user = {
  id: "user-1",
  name: "Ihor",
};

const fixedNow = new Date("2026-06-21T09:00:00.000Z");

describe("createAssistantAgentService", () => {
  it("adds water through the state tool and updates memory", async () => {
    const stateService = {
      getWaterState: vi.fn(async () => ({
        dailyWaterGoal: 2000,
        consumedMl: 500,
        glassSizeMl: 250,
        lastLoggedOn: "2026-06-21",
        history: [],
      })),
      saveWaterState: vi.fn(async () => undefined),
    };
    const assistantMemoryRepository = {
      findByUserId: vi.fn(async () => ({ userId: user.id, habits: [] })),
      upsert: vi.fn(async (memory) => memory),
    };
    const agent = createAssistantAgentService({
      stateService,
      assistantMemoryRepository,
      now: () => fixedNow,
    });

    const result = await agent.run({
      user,
      message: "Я выпил 300 мл воды",
    });

    expect(result).toMatchObject({
      handled: true,
      mode: "agent-action",
      providerId: "assistant-agent",
      intent: { intent: "add_water" },
      actions: [{ id: "add_water", ok: true, resultType: "water_added" }],
      memoryUpdated: true,
    });
    expect(result.text).toContain("300");
    expect(result.text).toContain("800 / 2000");
    expect(stateService.saveWaterState).toHaveBeenCalledWith(
      user,
      expect.objectContaining({
        consumedMl: 800,
        lastLoggedOn: "2026-06-21",
      }),
      { source: "assistant-agent" }
    );
    expect(assistantMemoryRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        habits: expect.arrayContaining(["logs water through assistant"]),
      })
    );
  });

  it("creates medication reminders through the medication tool", async () => {
    const medicationReminderService = {
      createReminderFromText: vi.fn(async () => ({
        ok: true,
        reminder: {
          id: "med-1",
          title: "Вітамін D",
          times: ["09:00"],
        },
      })),
    };
    const agent = createAssistantAgentService({
      medicationReminderService,
      now: () => fixedNow,
    });

    const result = await agent.run({
      user,
      message: "Напомни пить Вітамін D щодня о 09:00",
    });

    expect(result).toMatchObject({
      handled: true,
      intent: { intent: "create_medication_reminder" },
      actions: [
        {
          id: "create_medication_reminder",
          ok: true,
          resultType: "medication_reminder_created",
        },
      ],
    });
    expect(result.text).toContain("Нагадування створено");
    expect(medicationReminderService.createReminderFromText).toHaveBeenCalledWith(
      user,
      "Напомни пить Вітамін D щодня о 09:00",
      fixedNow
    );
  });

  it("does not handle unsafe unknown messages", async () => {
    const agent = createAssistantAgentService();

    await expect(
      agent.run({
        user,
        message: "расскажи что-нибудь",
      })
    ).resolves.toMatchObject({
      handled: false,
      intent: { intent: "unknown" },
    });
  });
});
