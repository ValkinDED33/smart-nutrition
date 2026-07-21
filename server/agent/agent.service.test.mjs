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

  it("answers deterministic tool actions in the runtime context language", async () => {
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
    const agent = createAssistantAgentService({
      stateService,
      now: () => fixedNow,
    });

    const result = await agent.run({
      user,
      message: "I drank 300 ml water",
      context: {
        language: "en",
        interactionChannel: "telegram",
      },
    });

    expect(result).toMatchObject({
      handled: true,
      intent: { intent: "add_water" },
      actions: [{ id: "add_water", ok: true, resultType: "water_added" }],
    });
    expect(result.text).toContain("Done");
    expect(result.text).toContain("Added 300 ml of water");
    expect(result.text).not.toContain("Додав");
  });

  it("returns visible failure when cloud-confirmed water save is unavailable", async () => {
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
    expect(result.text).toContain("хмара Smart Nutrition");
    expect(result.text).not.toContain("бекенд");
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

  it("logs weight through backend-confirmed profile state and updates memory", async () => {
    const currentProfileState = {
      dailyCalories: 2100,
      weightHistory: [{ date: "2026-06-20T09:00:00.000Z", weight: 97.2 }],
    };
    const confirmedProfileState = {
      ...currentProfileState,
      weightHistory: [
        ...currentProfileState.weightHistory,
        { date: fixedNow.toISOString(), weight: 98.4 },
      ],
    };
    const stateService = {
      getProfileState: vi
        .fn()
        .mockResolvedValueOnce(currentProfileState)
        .mockResolvedValueOnce(confirmedProfileState),
      saveProfileState: vi.fn(async () => undefined),
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
      message: "запиши вес 98.4 кг",
    });

    expect(result).toMatchObject({
      handled: true,
      intent: { intent: "log_weight", entities: { weightKg: 98.4 } },
      actions: [{ id: "log_weight", ok: true, resultType: "weight_logged" }],
      memoryUpdated: true,
    });
    expect(result.text).toContain("98.4 кг");
    expect(result.text).toContain("+1.2 кг");
    expect(stateService.saveProfileState).toHaveBeenCalledWith(
      user,
      expect.objectContaining({
        weightHistory: [
          { date: "2026-06-20T09:00:00.000Z", weight: 97.2 },
          { date: fixedNow.toISOString(), weight: 98.4 },
        ],
      }),
      { source: "assistant-agent" }
    );
    expect(assistantMemoryRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        habits: expect.arrayContaining(["logs weight through assistant"]),
      })
    );
  });

  it("does not claim weight success without confirmed backend profile restore", async () => {
    const stateService = {
      getProfileState: vi
        .fn()
        .mockResolvedValueOnce({ weightHistory: [] })
        .mockResolvedValueOnce({ weightHistory: [] }),
      saveProfileState: vi.fn(async () => undefined),
    };
    const logger = { warn: vi.fn() };
    const agent = createAssistantAgentService({
      stateService,
      logger,
      now: () => fixedNow,
    });

    const result = await agent.run({
      user,
      message: "мой вес 82 кг",
    });

    expect(result).toMatchObject({
      handled: true,
      intent: { intent: "log_weight" },
      actions: [{ id: "log_weight", ok: false, code: "WEIGHT_NOT_CONFIRMED" }],
    });
    expect(result.text).toContain("не зміг підтвердити збереження");
    expect(result.text).not.toContain("Записав вагу");
  });

  it("logs symptoms through backend-confirmed women health profile state", async () => {
    const currentProfileState = {
      womenHealth: {
        mode: "pregnant",
        symptomHistory: [],
      },
    };
    const stateService = {
      getProfileState: vi
        .fn()
        .mockResolvedValueOnce(currentProfileState)
        .mockImplementation(async () => {
          const saved = stateService.saveProfileState.mock.calls.at(-1)?.[1];
          return saved;
        }),
      saveProfileState: vi.fn(async () => undefined),
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
      message: "запиши симптом болит голова 6/10",
    });

    expect(result).toMatchObject({
      handled: true,
      intent: { intent: "log_symptom", entities: { severity: 6 } },
      actions: [{ id: "log_symptom", ok: true, resultType: "symptom_logged" }],
      memoryUpdated: true,
    });
    expect(result.text).toContain("6/10");
    expect(result.text).toContain("контекст");
    expect(stateService.saveProfileState).toHaveBeenCalledWith(
      user,
      expect.objectContaining({
        womenHealth: expect.objectContaining({
          symptomHistory: [
            expect.objectContaining({
              label: expect.stringContaining("болит голова"),
              severity: 6,
              recordedAt: fixedNow.toISOString(),
              source: "assistant",
            }),
          ],
        }),
      }),
      { source: "assistant-agent" }
    );
    expect(assistantMemoryRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        habits: expect.arrayContaining(["logs symptoms through assistant"]),
      })
    );
  });

  it("does not claim symptom success without confirmed backend profile restore", async () => {
    const stateService = {
      getProfileState: vi
        .fn()
        .mockResolvedValueOnce({ womenHealth: { symptomHistory: [] } })
        .mockResolvedValueOnce({ womenHealth: { symptomHistory: [] } }),
      saveProfileState: vi.fn(async () => undefined),
    };
    const agent = createAssistantAgentService({
      stateService,
      now: () => fixedNow,
    });

    const result = await agent.run({
      user,
      message: "тошнота 5/10",
    });

    expect(result).toMatchObject({
      handled: true,
      intent: { intent: "log_symptom" },
      actions: [{ id: "log_symptom", ok: false, code: "SYMPTOM_NOT_CONFIRMED" }],
    });
    expect(result.text).toContain("не зміг підтвердити запис");
    expect(result.text).not.toContain("Записав симптом");
  });

  it("generates a day summary from backend snapshot and canonical reminders", async () => {
    const stateService = {
      getSnapshot: vi.fn(async () => ({
        meal: {
          items: [
            {
              id: "meal-1",
              quantity: 200,
              mealType: "lunch",
              eatenAt: "2026-06-21T12:30:00.000Z",
              product: {
                name: "Greek yogurt",
                unit: "g",
                nutrients: {
                  calories: 59,
                  protein: 10,
                  fat: 0.4,
                  carbs: 3.6,
                  fiber: 0,
                },
              },
            },
          ],
        },
        water: {
          dailyWaterGoal: 2000,
          consumedMl: 900,
          glassSizeMl: 250,
          lastLoggedOn: "2026-06-21",
          history: [],
        },
        profile: {
          dailyCalories: 2100,
          weightHistory: [
            { date: "2026-06-20T09:00:00.000Z", weight: 97.2 },
            { date: "2026-06-21T08:00:00.000Z", weight: 96.9 },
          ],
          womenHealth: {
            mode: "pregnant",
            symptomHistory: [
              {
                id: "symptom-1",
                recordedAt: "2026-06-21T07:00:00.000Z",
                label: "нудота",
                severity: 4,
                source: "assistant",
              },
            ],
          },
        },
      })),
    };
    const reminderService = {
      getUserReminders: vi.fn(() => [
        { id: "reminder-1", active: true, title: "Вода", type: "water" },
        { id: "reminder-2", active: false, title: "Old", type: "task" },
      ]),
    };
    const assistantMemoryRepository = {
      findByUserId: vi.fn(async () => ({ userId: user.id, habits: [] })),
      upsert: vi.fn(async (memory) => memory),
    };
    const agent = createAssistantAgentService({
      stateService,
      reminderService,
      assistantMemoryRepository,
      now: () => fixedNow,
    });

    const result = await agent.run({
      user,
      message: "сделай итог дня сегодня",
    });

    expect(result).toMatchObject({
      handled: true,
      intent: { intent: "generate_day_summary" },
      actions: [{ id: "generate_day_summary", ok: true, resultType: "day_summary" }],
      memoryUpdated: true,
      followUpQuestionIds: ["protein_help", "water_help", "coach_focus"],
    });
    expect(result.text).toContain("Підсумок дня Smart Nutrition");
    expect(result.text).toContain("Їжа: 1");
    expect(result.text).toContain("118 / 2100");
    expect(result.text).toContain("900 / 2000");
    expect(result.text).toContain("Активні нагадування: 1");
    expect(result.text).toContain("Остання вага: 96.9 кг");
    expect(result.text).toContain("нудота 4/10");
    expect(stateService.getSnapshot).toHaveBeenCalledWith(user);
    expect(reminderService.getUserReminders).toHaveBeenCalledWith(user);
    expect(assistantMemoryRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        habits: expect.arrayContaining(["asks assistant for daily summaries"]),
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

  it("prefers the canonical typed reminder contract for medication reminders", async () => {
    const reminderService = {
      createReminderFromUserText: vi.fn(async () => ({
        ok: true,
        reminder: {
          id: "med-canonical",
          type: "medication",
          title: "Вітамін D",
          times: ["09:00"],
        },
      })),
      createReminderFromText: vi.fn(),
      createMedicationReminderFromText: vi.fn(),
    };
    const agent = createAssistantAgentService({
      reminderService,
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
    expect(reminderService.createReminderFromUserText).toHaveBeenCalledWith(
      user,
      {
        type: "medication",
        text: "Напомни пить Вітамін D щодня о 09:00",
      },
      fixedNow
    );
    expect(reminderService.createReminderFromText).not.toHaveBeenCalled();
    expect(reminderService.createMedicationReminderFromText).not.toHaveBeenCalled();
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

  it("prefers the canonical typed reminder contract for ordinary task reminders", async () => {
    const reminderService = {
      createReminderFromUserText: vi.fn(async () => ({
        ok: true,
        reminder: {
          id: "task-canonical",
          type: "task",
          title: "позвонить врачу",
          times: ["10:00"],
          repeat: "once",
        },
      })),
      createTaskReminderFromText: vi.fn(),
    };
    const agent = createAssistantAgentService({
      reminderService,
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
    });
    expect(reminderService.createReminderFromUserText).toHaveBeenCalledWith(
      user,
      {
        type: "task",
        text: "Напомни позвонить врачу о 10:00",
      },
      fixedNow
    );
    expect(reminderService.createTaskReminderFromText).not.toHaveBeenCalled();
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

  it("adds meals through online catalog search and canonical product intake", async () => {
    const stateService = {
      addProductIntake: vi.fn(async (_user, request) => ({
        ok: true,
        product: request.product,
        entry: {
          id: "meal-intake-assistant-meal-1",
          product: request.product,
          quantity: request.quantity,
          mealType: request.mealType,
          eatenAt: request.eatenAt,
          origin: "manual",
        },
        outcomes: {
          mealAdded: true,
        },
      })),
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
    expect(stateService.addProductIntake).toHaveBeenCalledWith(
      user,
      {
        source: "recommendation",
        product: chickenProduct,
        quantity: 150,
        mealType: "lunch",
        eatenAt: fixedNow.toISOString(),
        idempotencyKey: expect.stringMatching(/^assistant-meal-/),
        options: {
          saveToLibrary: false,
          submitToCatalog: false,
        },
      },
      undefined,
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
      addProductIntake: vi.fn(async () => undefined),
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
    expect(stateService.addProductIntake).not.toHaveBeenCalled();
  });

  it("does not claim meal success when canonical intake is not confirmed", async () => {
    const stateService = {
      addProductIntake: vi.fn(async (_user, request) => ({
        ok: true,
        product: request.product,
        entry: {
          id: "meal-intake-unconfirmed",
          product: request.product,
          quantity: request.quantity,
          mealType: request.mealType,
          eatenAt: request.eatenAt,
          origin: "manual",
        },
        outcomes: {
          mealAdded: false,
        },
      })),
    };
    const platformService = {
      listVisibleCatalogProducts: vi.fn(async () => [chickenProduct]),
    };
    const agent = createAssistantAgentService({
      stateService,
      platformService,
      now: () => fixedNow,
    });

    const result = await agent.run({
      user,
      message: "добавь chicken breast 150 г на обед",
    });

    expect(result).toMatchObject({
      handled: true,
      intent: { intent: "add_meal" },
      actions: [{ id: "add_meal", ok: false, code: "MEAL_NOT_CONFIRMED" }],
    });
    expect(result.text).not.toContain("Додав Chicken breast");
    expect(result.text).toContain("не зміг безпечно виконати");
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
