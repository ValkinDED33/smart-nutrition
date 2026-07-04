import { describe, expect, it, vi } from "vitest";
import { createAssistantAgentService } from "./agent.service.mjs";

const user = {
  id: "user-1",
  name: "Ihor",
};

const fixedNow = new Date("2026-06-21T09:00:00.000Z");
const chickenProduct = {
  id: "product-chicken",
  name: "Chicken breast",
  unit: "g",
  source: "OpenFoodFacts",
  nutrients: {
    calories: 165,
    protein: 31,
    fat: 3.6,
    carbs: 0,
  },
};

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

  it("returns visible failure when backend water save is unavailable", async () => {
    const stateService = {
      getWaterState: vi.fn(async () => ({
        dailyWaterGoal: 2000,
        consumedMl: 500,
        glassSizeMl: 250,
        lastLoggedOn: "2026-06-21",
        history: [],
      })),
      saveWaterState: vi.fn(async () => {
        throw new Error("database unavailable");
      }),
    };
    const logger = { warn: vi.fn() };
    const agent = createAssistantAgentService({
      stateService,
      logger,
      now: () => fixedNow,
    });

    const result = await agent.run({
      user,
      message: "добавь 250 мл воды",
    });

    expect(result).toMatchObject({
      handled: true,
      intent: { intent: "add_water" },
      actions: [{ id: "add_water", ok: false, code: "Error" }],
    });
    expect(result.text).toContain("не зміг підтвердити збереження");
    expect(result.text).toContain("бекенд");
    expect(stateService.saveWaterState).toHaveBeenCalledOnce();
    expect(logger.warn).toHaveBeenCalledWith(
      "[assistant-agent] action failed",
      expect.objectContaining({
        intent: "add_water",
        code: "Error",
      })
    );
  });

  it("shows water status through the same backend state", async () => {
    const stateService = {
      getWaterState: vi.fn(async () => ({
        dailyWaterGoal: 2200,
        consumedMl: 700,
        glassSizeMl: 250,
        lastLoggedOn: "2026-06-21",
        history: [],
      })),
    };
    const agent = createAssistantAgentService({
      stateService,
      now: () => fixedNow,
    });

    const result = await agent.run({
      user,
      message: "сколько воды сегодня",
    });

    expect(result).toMatchObject({
      handled: true,
      intent: { intent: "show_water_status" },
      actions: [{ id: "show_water_status", ok: true, resultType: "water_status" }],
    });
    expect(result.text).toContain("700 / 2200");
    expect(stateService.getWaterState).toHaveBeenCalledWith(user);
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

  it("creates medication reminders from natural 'at/in time' wording", async () => {
    const medicationReminderService = {
      createReminderFromText: vi.fn(async () => ({
        ok: true,
        reminder: {
          id: "med-2",
          title: "магний",
          times: ["22:00"],
        },
      })),
    };
    const agent = createAssistantAgentService({
      medicationReminderService,
      now: () => fixedNow,
    });

    const result = await agent.run({
      user,
      message: "Мне надо пить магний в 22:00",
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
    expect(medicationReminderService.createReminderFromText).toHaveBeenCalledWith(
      user,
      "Мне надо пить магний в 22:00",
      fixedNow
    );
  });

  it("creates ordinary task reminders through the reminder tool", async () => {
    const reminderService = {
      createTaskReminderFromText: vi.fn(async () => ({
        ok: true,
        reminder: {
          id: "task-1",
          type: "task",
          title: "позвонить врачу",
          times: ["10:00"],
          repeat: "once",
        },
      })),
    };
    const assistantMemoryRepository = {
      findByUserId: vi.fn(async () => ({ userId: user.id, habits: [] })),
      upsert: vi.fn(async (memory) => memory),
    };
    const agent = createAssistantAgentService({
      reminderService,
      assistantMemoryRepository,
      now: () => fixedNow,
    });

    const result = await agent.run({
      user,
      message: "Напомни позвонить врачу о 10:00",
    });

    expect(result).toMatchObject({
      handled: true,
      intent: { intent: "create_task_reminder" },
      actions: [
        {
          id: "create_task_reminder",
          ok: true,
          resultType: "task_reminder_created",
        },
      ],
      memoryUpdated: true,
    });
    expect(result.text).toContain("Нагадування створено");
    expect(result.text).toContain("позвонить врачу");
    expect(reminderService.createTaskReminderFromText).toHaveBeenCalledWith(
      user,
      "Напомни позвонить врачу о 10:00",
      fixedNow
    );
    expect(assistantMemoryRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        habits: expect.arrayContaining(["uses assistant task reminders"]),
      })
    );
  });

  it("creates typed water reminders through the canonical reminder tool", async () => {
    const reminderService = {
      createReminderFromUserText: vi.fn(async () => ({
        ok: true,
        reminder: {
          id: "water-1",
          type: "water",
          title: "Пити воду",
          dose: "250 мл",
          times: ["09:00"],
          repeat: "daily",
        },
      })),
    };
    const assistantMemoryRepository = {
      findByUserId: vi.fn(async () => ({ userId: user.id, habits: [] })),
      upsert: vi.fn(async (memory) => memory),
    };
    const agent = createAssistantAgentService({
      reminderService,
      assistantMemoryRepository,
      now: () => fixedNow,
    });

    const result = await agent.run({
      user,
      message: "Напоминай пить воду каждый день о 09:00",
    });

    expect(result).toMatchObject({
      handled: true,
      intent: { intent: "create_water_reminder" },
      actions: [
        {
          id: "create_water_reminder",
          ok: true,
          resultType: "reminder_created",
        },
      ],
      memoryUpdated: true,
    });
    expect(reminderService.createReminderFromUserText).toHaveBeenCalledWith(
      user,
      {
        type: "water",
        text: "Напоминай пить воду каждый день о 09:00",
      },
      fixedNow
    );
    expect(result.text).toContain("нагадування про воду");
    expect(assistantMemoryRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        habits: expect.arrayContaining(["uses hydration reminders"]),
      })
    );
  });

  it("creates typed water reminders through legacy typed reminder tools when the canonical wrapper is absent", async () => {
    const reminderService = {
      createWaterReminderFromText: vi.fn(async () => ({
        ok: true,
        reminder: {
          id: "water-legacy",
          type: "water",
          title: "Пити воду",
          dose: "250 мл",
          times: ["09:00"],
          repeat: "daily",
        },
      })),
    };
    const assistantMemoryRepository = {
      findByUserId: vi.fn(async () => ({ userId: user.id, habits: [] })),
      upsert: vi.fn(async (memory) => memory),
    };
    const agent = createAssistantAgentService({
      reminderService,
      assistantMemoryRepository,
      now: () => fixedNow,
    });

    const result = await agent.run({
      user,
      message: "Напоминай пить воду каждый день о 09:00",
    });

    expect(result).toMatchObject({
      handled: true,
      intent: { intent: "create_water_reminder" },
      actions: [
        {
          id: "create_water_reminder",
          ok: true,
          resultType: "reminder_created",
        },
      ],
    });
    expect(reminderService.createWaterReminderFromText).toHaveBeenCalledWith(
      user,
      "Напоминай пить воду каждый день о 09:00",
      fixedNow
    );
    expect(result.text).toContain("нагадування про воду");
  });

  it("adds meals through online catalog search and state tool", async () => {
    const stateService = {
      addMealEntries: vi.fn(async () => undefined),
    };
    const platformService = {
      listVisibleCatalogProducts: vi.fn(async () => [chickenProduct]),
    };
    const assistantMemoryRepository = {
      findByUserId: vi.fn(async () => ({ userId: user.id, habits: [] })),
      upsert: vi.fn(async (memory) => memory),
    };
    const agent = createAssistantAgentService({
      stateService,
      platformService,
      assistantMemoryRepository,
      now: () => fixedNow,
    });

    const result = await agent.run({
      user,
      message: "добавь chicken breast 150 г на обед",
    });

    expect(result).toMatchObject({
      handled: true,
      intent: { intent: "add_meal" },
      actions: [{ id: "add_meal", ok: true, resultType: "meal_added" }],
      memoryUpdated: true,
    });
    expect(result.text).toContain("Chicken breast");
    expect(result.text).toContain("150");
    expect(platformService.listVisibleCatalogProducts).toHaveBeenCalledWith(user, {
      search: "chicken breast",
      limit: 4,
    });
    expect(stateService.addMealEntries).toHaveBeenCalledWith(
      user,
      {
        entries: [
          expect.objectContaining({
            product: chickenProduct,
            quantity: 150,
            mealType: "lunch",
            eatenAt: fixedNow.toISOString(),
            origin: "manual",
          }),
        ],
      },
      { source: "assistant-agent" }
    );
    expect(assistantMemoryRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        habits: expect.arrayContaining(["logs meals through assistant"]),
      })
    );
  });

  it("does not add a meal when the product is not found", async () => {
    const stateService = {
      addMealEntries: vi.fn(async () => undefined),
    };
    const platformService = {
      listVisibleCatalogProducts: vi.fn(async () => []),
    };
    const agent = createAssistantAgentService({
      stateService,
      platformService,
      now: () => fixedNow,
    });

    const result = await agent.run({
      user,
      message: "добавь unknown product 150 г",
    });

    expect(result).toMatchObject({
      handled: true,
      intent: { intent: "add_meal" },
      actions: [{ id: "add_meal", ok: false, code: "PRODUCT_NOT_FOUND" }],
    });
    expect(result.text).toContain("не знайшов");
    expect(stateService.addMealEntries).not.toHaveBeenCalled();
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
