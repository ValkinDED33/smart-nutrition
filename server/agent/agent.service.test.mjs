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
const riceProduct = {
  id: "product-rice",
  name: "Rice",
  unit: "g",
  source: "OpenFoodFacts",
  nutrients: {
    calories: 130,
    protein: 2.7,
    fat: 0.3,
    carbs: 28,
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

  it("hands scanner requests to the canonical meal scanner route without fake scan success", async () => {
    const assistantMemoryRepository = {
      findByUserId: vi.fn(async () => ({ userId: user.id, habits: [] })),
      upsert: vi.fn(async (memory) => memory),
    };
    const agent = createAssistantAgentService({
      assistantMemoryRepository,
      now: () => fixedNow,
    });

    const result = await agent.run({
      user,
      message: "открой сканер",
      context: {
        language: "uk",
      },
    });

    expect(result).toMatchObject({
      handled: true,
      mode: "agent-action",
      providerId: "assistant-agent",
      intent: { intent: "open_scanner" },
      actions: [
        {
          id: "open_scanner",
          ok: true,
          resultType: "navigation_handoff",
          targetRoute: "/meals?mode=barcode",
          targetSurface: "scanner",
        },
      ],
      memoryUpdated: true,
      followUpQuestionIds: ["search_product", "day_status", "coach_focus"],
    });
    expect(result.text).toContain("Відкриваю сканер їжі");
    expect(result.text).toContain("після дозволу пристрою");
    expect(result.text).not.toContain("відсканував");
    expect(result.text).not.toContain("додав");
    expect(assistantMemoryRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        habits: expect.arrayContaining(["opens scanner through assistant"]),
      })
    );
  });

  it("hands photo meal requests to the canonical photo capture route without fake recognition", async () => {
    const assistantMemoryRepository = {
      findByUserId: vi.fn(async () => ({ userId: user.id, habits: [] })),
      upsert: vi.fn(async (memory) => memory),
    };
    const agent = createAssistantAgentService({
      assistantMemoryRepository,
      now: () => fixedNow,
    });

    const result = await agent.run({
      user,
      message: "проанализируй фото еды",
      context: {
        language: "uk",
      },
    });

    expect(result).toMatchObject({
      handled: true,
      mode: "agent-action",
      providerId: "assistant-agent",
      intent: { intent: "request_photo_meal_analysis" },
      actions: [
        {
          id: "request_photo_meal_analysis",
          ok: true,
          resultType: "navigation_handoff",
          targetRoute: "/meals?mode=photo",
          targetSurface: "photo_meal",
        },
      ],
      memoryUpdated: true,
      followUpQuestionIds: ["search_product", "day_status", "coach_focus"],
    });
    expect(result.text).toContain("Відкриваю фото-аналіз їжі");
    expect(result.text).toContain("чернетку для перевірки");
    expect(result.text).not.toContain("розпізнав");
    expect(result.text).not.toContain("збережено");
    expect(assistantMemoryRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        habits: expect.arrayContaining(["opens photo meal analysis through assistant"]),
      })
    );
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

  it("generates a review-only daily plan draft from backend snapshot and reminders", async () => {
    const stateService = {
      getSnapshot: vi.fn(async () => ({
        meal: {
          items: [
            {
              id: "meal-1",
              quantity: 200,
              mealType: "breakfast",
              eatenAt: "2026-06-21T08:30:00.000Z",
              product: {
                name: "Greek yogurt",
                unit: "g",
                nutrients: {
                  calories: 59,
                  protein: 10,
                  fat: 0.4,
                  carbs: 3.6,
                },
              },
            },
          ],
        },
        water: {
          dailyWaterGoal: 2000,
          consumedMl: 750,
          glassSizeMl: 250,
          lastLoggedOn: "2026-06-21",
          history: [],
        },
        profile: {
          dailyCalories: 2100,
          macroTargets: {
            protein: 130,
          },
        },
      })),
      addProductIntake: vi.fn(),
      addMealTemplate: vi.fn(),
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
      message: "составь план питания на сегодня",
      context: {
        language: "uk",
      },
    });

    expect(result).toMatchObject({
      handled: true,
      intent: { intent: "generate_daily_plan" },
      actions: [{ id: "generate_daily_plan", ok: true, resultType: "daily_plan_draft" }],
      memoryUpdated: true,
      followUpQuestionIds: ["search_product", "water_help", "coach_focus"],
    });
    expect(result.text).toContain("Чернетка плану Smart Nutrition");
    expect(result.text).toContain("1982 ккал");
    expect(result.text).toContain("110 г");
    expect(result.text).toContain("1250 мл");
    expect(result.text).toContain("Білковий акцент");
    expect(result.text).toContain("Активні нагадування враховано: 1");
    expect(result.text).toContain("нічого не зберіг");
    expect(result.text).not.toContain("protein-led");
    expect(result.text).not.toContain("збережено");
    expect(stateService.getSnapshot).toHaveBeenCalledWith(user);
    expect(reminderService.getUserReminders).toHaveBeenCalledWith(user);
    expect(stateService.addProductIntake).not.toHaveBeenCalled();
    expect(stateService.addMealTemplate).not.toHaveBeenCalled();
    expect(assistantMemoryRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        habits: expect.arrayContaining(["asks assistant for reviewable daily plans"]),
      })
    );
  });

  it("applies a protein daily plan item by opening the canonical food flow without fake meal saving", async () => {
    const stateService = {
      addProductIntake: vi.fn(),
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
      message: "примени белковый пункт плана",
      context: {
        language: "uk",
      },
    });

    expect(result).toMatchObject({
      handled: true,
      intent: {
        intent: "apply_daily_plan_item",
        entities: {
          planItem: "protein",
        },
      },
      actions: [
        {
          id: "apply_daily_plan_item",
          ok: true,
          resultType: "navigation_handoff",
          targetRoute: "/meals?mode=search&focus=protein",
          targetSurface: "food",
        },
      ],
      memoryUpdated: true,
      followUpQuestionIds: ["day_status", "search_product", "water_help"],
    });
    expect(result.text).toContain("Відкриваю додавання їжі");
    expect(result.text).toContain("тільки після підтвердження");
    expect(result.text).not.toContain("Додав");
    expect(result.text).not.toContain("збережено");
    expect(stateService.addProductIntake).not.toHaveBeenCalled();
    expect(assistantMemoryRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        habits: expect.arrayContaining(["applies daily plan items through food flow"]),
      })
    );
  });

  it("applies a hydration daily plan item through the canonical typed reminder contract", async () => {
    const reminderService = {
      createReminderFromUserText: vi.fn(async (_user, payload) => ({
        ok: true,
        reminder: {
          id: "plan-water-1",
          type: payload.type,
          title: "Пити воду",
          dose: "250 мл",
          times: ["12:30"],
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
      message: "підтвердь воду з плану",
      context: {
        language: "uk",
      },
    });

    expect(result).toMatchObject({
      handled: true,
      intent: {
        intent: "apply_daily_plan_item",
        entities: {
          planItem: "water",
        },
      },
      actions: [
        {
          id: "apply_daily_plan_item",
          ok: true,
          resultType: "daily_plan_item_applied",
        },
      ],
      memoryUpdated: true,
    });
    expect(result.text).toContain("Пункт плану з водою");
    expect(result.text).toContain("Пити воду");
    expect(result.text).toContain("12:30");
    expect(reminderService.createReminderFromUserText).toHaveBeenCalledWith(
      user,
      {
        type: "water",
        text: "пити воду о 12:30",
      },
      fixedNow
    );
    expect(assistantMemoryRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        habits: expect.arrayContaining(["applies daily plan items through reminders"]),
      })
    );
  });

  it("generates a progress report from backend snapshot and canonical reminders", async () => {
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
            {
              id: "meal-2",
              quantity: 100,
              mealType: "breakfast",
              eatenAt: "2026-06-19T08:00:00.000Z",
              product: {
                name: "Oats",
                unit: "g",
                nutrients: {
                  calories: 389,
                  protein: 16.9,
                  fat: 6.9,
                  carbs: 66.3,
                  fiber: 10.6,
                },
              },
            },
            {
              id: "old-meal",
              quantity: 100,
              mealType: "snack",
              eatenAt: "2026-05-01T12:00:00.000Z",
              product: {
                name: "Old",
                nutrients: {
                  calories: 999,
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
          history: [
            { date: "2026-06-21", consumedMl: 2000, targetMl: 2000 },
            { date: "2026-06-20", consumedMl: 1500, targetMl: 2000 },
            { date: "2026-05-01", consumedMl: 3000, targetMl: 2000 },
          ],
        },
        profile: {
          dailyCalories: 2100,
          weightHistory: [
            { date: "2026-06-18T09:00:00.000Z", weight: 97.5 },
            { date: "2026-06-21T08:00:00.000Z", weight: 96.9 },
            { date: "2026-05-01T08:00:00.000Z", weight: 101 },
          ],
          womenHealth: {
            mode: "pregnant",
            symptomHistory: [
              {
                id: "symptom-1",
                recordedAt: "2026-06-20T07:00:00.000Z",
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
      message: "сделай отчет за неделю",
    });

    expect(result).toMatchObject({
      handled: true,
      intent: { intent: "generate_report", entities: { period: "week" } },
      actions: [{ id: "generate_report", ok: true, resultType: "progress_report" }],
      memoryUpdated: true,
      followUpQuestionIds: ["day_status", "protein_help", "coach_focus"],
    });
    expect(result.text).toContain("Звіт Smart Nutrition за 7 днів");
    expect(result.text).toContain("2026-06-15");
    expect(result.text).toContain("2026-06-21");
    expect(result.text).toContain("Їжа: 2");
    expect(result.text).toContain("Вода");
    expect(result.text).toContain("97.5");
    expect(result.text).toContain("96.9");
    expect(result.text).toContain("нудота 4/10");
    expect(result.text).toContain("Активні нагадування: 1");
    expect(stateService.getSnapshot).toHaveBeenCalledWith(user);
    expect(reminderService.getUserReminders).toHaveBeenCalledWith(user);
    expect(assistantMemoryRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        habits: expect.arrayContaining(["asks assistant for progress reports"]),
      })
    );
  });

  it("creates reusable recipes through confirmed meal templates", async () => {
    let savedTemplate = null;
    const stateService = {
      addMealTemplate: vi.fn(async (_user, template) => {
        savedTemplate = template;
        return {
          items: [],
          templates: [template],
          savedProducts: [],
          recentProducts: [],
        };
      }),
      getMealState: vi.fn(async () => ({
        items: [],
        templates: savedTemplate ? [savedTemplate] : [],
        savedProducts: [],
        recentProducts: [],
      })),
    };
    const platformService = {
      listVisibleCatalogProducts: vi
        .fn()
        .mockResolvedValueOnce([chickenProduct])
        .mockResolvedValueOnce([riceProduct]),
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
      message: "создай рецепт с chicken breast и rice на обед",
    });

    expect(result).toMatchObject({
      handled: true,
      intent: { intent: "create_recipe", entities: { mealType: "lunch" } },
      actions: [{ id: "create_recipe", ok: true, resultType: "recipe_created" }],
      memoryUpdated: true,
      followUpQuestionIds: ["day_status", "search_product", "coach_focus"],
    });
    expect(result.text).toContain("збережено у ваших рецептах");
    expect(result.text).toContain("Chicken breast");
    expect(result.text).toContain("Rice");
    expect(result.text).toContain("окремим підтвердженням");
    expect(platformService.listVisibleCatalogProducts).toHaveBeenCalledWith(user, {
      search: "chicken breast",
      limit: 3,
    });
    expect(platformService.listVisibleCatalogProducts).toHaveBeenCalledWith(user, {
      search: "rice",
      limit: 3,
    });
    expect(stateService.addMealTemplate).toHaveBeenCalledWith(
      user,
      expect.objectContaining({
        id: expect.stringMatching(/^assistant-recipe-/),
        name: expect.stringMatching(/^Recipe: Lunch recipe:/),
        mealType: "lunch",
        items: [
          expect.objectContaining({
            product: expect.objectContaining({ id: chickenProduct.id }),
          }),
          expect.objectContaining({
            product: expect.objectContaining({ id: riceProduct.id }),
          }),
        ],
      }),
      { source: "assistant-agent" }
    );
    expect(stateService.getMealState).toHaveBeenCalledWith(user);
    expect(assistantMemoryRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        habits: expect.arrayContaining(["creates reusable recipes through assistant"]),
      })
    );
  });

  it("does not claim recipe success without backend template restore confirmation", async () => {
    const stateService = {
      addMealTemplate: vi.fn(async () => ({
        items: [],
        templates: [],
        savedProducts: [],
        recentProducts: [],
      })),
      getMealState: vi.fn(async () => ({
        items: [],
        templates: [],
        savedProducts: [],
        recentProducts: [],
      })),
    };
    const platformService = {
      listVisibleCatalogProducts: vi
        .fn()
        .mockResolvedValueOnce([chickenProduct])
        .mockResolvedValueOnce([riceProduct]),
    };
    const agent = createAssistantAgentService({
      stateService,
      platformService,
      now: () => fixedNow,
    });

    const result = await agent.run({
      user,
      message: "создай рецепт с chicken breast и rice",
    });

    expect(result).toMatchObject({
      handled: true,
      intent: { intent: "create_recipe" },
      actions: [{ id: "create_recipe", ok: false, code: "RECIPE_NOT_CONFIRMED" }],
    });
    expect(result.text).toContain("не зміг підтвердити");
    expect(result.text).not.toContain("збережено у ваших рецептах");
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

  it("creates follow-ups through the canonical task reminder contract", async () => {
    const reminderService = {
      createReminderFromUserText: vi.fn(async (_user, payload) => ({
        ok: true,
        reminder: {
          id: "follow-up-1",
          type: payload.type,
          title: "проверить воду",
          times: ["11:30"],
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
      message: "напомни проверить воду через 30 минут",
    });

    expect(result).toMatchObject({
      handled: true,
      intent: { intent: "create_follow_up" },
      actions: [{ id: "create_follow_up", ok: true, resultType: "follow_up_created" }],
      memoryUpdated: true,
      followUpQuestionIds: ["day_status", "coach_focus"],
    });
    expect(result.text).toContain("Follow-up створено");
    expect(result.text).toContain("проверить воду");
    expect(result.text).toContain("11:30");
    expect(reminderService.createReminderFromUserText).toHaveBeenCalledWith(
      user,
      {
        type: "task",
        text: "напомни проверить воду о 11:30",
      },
      fixedNow
    );
    expect(assistantMemoryRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        habits: expect.arrayContaining(["uses assistant follow-ups"]),
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

  it("answers live weather through the backend live data tool", async () => {
    const liveFetch = vi.fn(async (url) => {
      const value = String(url);

      if (value.includes("geocoding-api.open-meteo.com")) {
        return {
          ok: true,
          json: async () => ({
            results: [
              {
                name: "Warsaw",
                country: "Poland",
                latitude: 52.22977,
                longitude: 21.01178,
                timezone: "Europe/Warsaw",
              },
            ],
          }),
        };
      }

      return {
        ok: true,
        json: async () => ({
          daily: {
            time: ["2026-06-21", "2026-06-22"],
            weather_code: [2, 61],
            temperature_2m_max: [22, 24],
            temperature_2m_min: [13, 15],
            precipitation_probability_max: [20, 70],
            wind_speed_10m_max: [18, 25],
          },
        }),
      };
    });
    const agent = createAssistantAgentService({
      liveFetch,
      now: () => fixedNow,
    });

    const result = await agent.run({
      user,
      message: "какая погода завтра в Warsaw",
      context: { language: "en" },
    });

    expect(result).toMatchObject({
      handled: true,
      intent: { intent: "get_weather_forecast" },
      actions: [{ id: "get_weather_forecast", ok: true, resultType: "weather_forecast" }],
    });
    expect(result.text).toContain("Weather for Warsaw, Poland on 2026-06-22");
    expect(result.text).toContain("15.0...24.0 °C");
    expect(result.text).toContain("Source: Open-Meteo");
  });

  it("answers exchange rates through the backend live data tool", async () => {
    const liveFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        result: "success",
        time_last_update_utc: "Sun, 21 Jun 2026 00:00:01 +0000",
        rates: {
          UAH: 44.5,
          PLN: 3.72,
          EUR: 0.86,
        },
      }),
    }));
    const agent = createAssistantAgentService({
      liveFetch,
      now: () => fixedNow,
    });

    const result = await agent.run({
      user,
      message: "какой актуальный курс доллара",
      context: { language: "uk" },
    });

    expect(result).toMatchObject({
      handled: true,
      intent: { intent: "get_exchange_rate" },
      actions: [{ id: "get_exchange_rate", ok: true, resultType: "exchange_rate" }],
    });
    expect(result.text).toContain("Актуальний курс USD");
    expect(result.text).toContain("1 USD = 44.5000 UAH");
    expect(result.text).toContain("Джерело: open.er-api.com");
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

  it("saves favorite products through canonical saved meal products", async () => {
    const stateService = {
      upsertMealProduct: vi.fn(async () => undefined),
      getMealState: vi.fn(async () => ({
        items: [],
        templates: [],
        recentProducts: [],
        savedProducts: [chickenProduct],
      })),
    };
    const platformService = {
      listVisibleCatalogProducts: vi.fn(async () => [chickenProduct]),
    };
    const assistantMemoryRepository = {
      findByUserId: vi.fn(async () => ({ userId: user.id, habits: [], favoriteFoods: [] })),
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
      message: "сохрани chicken breast в избранное",
    });

    expect(result).toMatchObject({
      handled: true,
      intent: { intent: "save_favorite" },
      actions: [{ id: "save_favorite", ok: true, resultType: "favorite_saved" }],
      memoryUpdated: true,
      followUpQuestionIds: ["search_product", "coach_focus"],
    });
    expect(result.text).toContain("Chicken breast");
    expect(result.text).toContain("швидких продуктах");
    expect(platformService.listVisibleCatalogProducts).toHaveBeenCalledWith(user, {
      search: "chicken breast",
      limit: 4,
    });
    expect(stateService.upsertMealProduct).toHaveBeenCalledWith(
      user,
      "saved",
      chickenProduct,
      { source: "assistant-agent" }
    );
    expect(assistantMemoryRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        habits: expect.arrayContaining(["saves quick products through assistant"]),
        favoriteFoods: expect.arrayContaining(["Chicken breast"]),
      })
    );
  });

  it("does not claim favorite save success without backend restore confirmation", async () => {
    const stateService = {
      upsertMealProduct: vi.fn(async () => undefined),
      getMealState: vi.fn(async () => ({
        items: [],
        templates: [],
        recentProducts: [],
        savedProducts: [],
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
      message: "сохрани chicken breast в избранное",
    });

    expect(result).toMatchObject({
      handled: true,
      intent: { intent: "save_favorite" },
      actions: [{ id: "save_favorite", ok: false, code: "FAVORITE_NOT_CONFIRMED" }],
    });
    expect(result.text).not.toContain("збережено у ваших швидких продуктах");
    expect(result.text).toContain("не зміг підтвердити");
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
