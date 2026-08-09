import { describe, expect, it, vi } from "vitest";
import {
  buildTelegramAssistantCapabilitiesMessage,
  buildTelegramDailySummary,
  buildTelegramMainMenuMessage,
  buildTelegramNutritionSummary,
  buildTelegramWaterSummary,
  createTelegramConnectToken,
  createTelegramService,
  verifyTelegramConnectToken,
} from "./telegramService.mjs";

const createConfig = (overrides = {}) => ({
  jwtSecret: "test-jwt-secret",
  telegramBotToken: "telegram-token",
  telegramBotUsername: "@SmartNutritionAssistBot",
  telegramConnectTokenTtlMs: 1_800_000,
  ...overrides,
});

const createAuthRepository = (overrides = {}) => ({
  findUserById: vi.fn(async (userId) => ({
    id: userId,
    name: "Test User",
    role: "USER",
    telegramChatId: null,
    telegramConnectedAt: null,
  })),
  updateUserTelegramConnection: vi.fn(),
  disconnectUserTelegram: vi.fn(async (userId) => ({
    id: userId,
    name: "Test User",
    role: "USER",
    telegramChatId: null,
    telegramConnectedAt: null,
  })),
  disconnectTelegramChat: vi.fn(),
  findUserByTelegramChatId: vi.fn(),
  createAuditLog: vi.fn(),
  ...overrides,
});

describe("telegramService", () => {
  const snapshot = {
    profile: {
      dailyCalories: 2200,
    },
    water: {
      consumedMl: 1000,
      dailyWaterGoal: 2500,
      glassSizeMl: 250,
    },
    meal: {
      items: [
        {
          eatenAt: "2026-06-20T08:00:00.000Z",
          quantity: 200,
          product: {
            nutrients: {
              calories: 100,
              protein: 10,
              fat: 2,
              carbs: 12,
              sugars: 4,
              fiber: 3,
              sodium: 30,
              calcium: 50,
              iron: 1.5,
            },
          },
        },
        {
          eatenAt: "2026-06-19T08:00:00.000Z",
          quantity: 100,
          product: {
            nutrients: {
              calories: 999,
              protein: 99,
            },
          },
        },
      ],
    },
  };

  it("describes real assistant capabilities for Telegram", () => {
    const message = buildTelegramAssistantCapabilitiesMessage();

    expect(message).toContain("Харчування");
    expect(message).toContain("Вода");
    expect(message).toContain("Нутрієнти");
    expect(message).toContain("дні народження");
    expect(message).toContain("контроль тиску");
    expect(message).toContain("Жіноче здоров'я");
    expect(message).toContain("/today");
  });

  it("localizes assistant capabilities for Telegram", () => {
    const message = buildTelegramAssistantCapabilitiesMessage("en");

    expect(message).toContain("Food");
    expect(message).toContain("Water");
    expect(message).toContain("Nutrients");
    expect(message).toContain("birthdays");
    expect(message).toContain("blood-pressure checks");
    expect(message).toContain("Women health");
    expect(message).toContain("/today");
    expect(message).not.toContain("Харчування");
  });

  it("builds a Telegram workspace menu around real commands", () => {
    const message = buildTelegramMainMenuMessage({ name: "Ihor" });

    expect(message).toContain("Smart Nutrition поруч, Ihor");
    expect(message).toContain("/today");
    expect(message).toContain("/reminders");
    expect(message).toContain("/addtask");
    expect(message).toContain("/addmed");
  });

  it("localizes the exported Telegram workspace menu text", () => {
    const message = buildTelegramMainMenuMessage({ name: "Ihor" }, "en");

    expect(message).toContain("Smart Nutrition is nearby, Ihor");
    expect(message).toContain("/today — quick day summary");
    expect(message).toContain("/water — water today");
    expect(message).not.toContain("поруч");
  });

  it("builds daily, water and nutrition summaries from the app snapshot", () => {
    const now = new Date("2026-06-20T12:00:00.000Z");

    expect(buildTelegramDailySummary(snapshot, now)).toContain(
      "Калорії: 200 / 2200 ккал"
    );
    expect(buildTelegramWaterSummary(snapshot)).toContain("Ще приблизно 1500 мл");
    expect(buildTelegramNutritionSummary(snapshot, now)).toContain("Білок: 20.0 г");
    expect(buildTelegramNutritionSummary(snapshot, now)).not.toContain("999");
  });

  it("localizes Telegram daily, water and nutrition summaries", () => {
    const now = new Date("2026-06-20T12:00:00.000Z");

    expect(buildTelegramDailySummary(snapshot, now, "en")).toContain(
      "Calories: 200 / 2200 kcal"
    );
    expect(buildTelegramDailySummary(snapshot, now, "en")).toContain(
      "I can see the day"
    );
    expect(buildTelegramWaterSummary(snapshot, "pl")).toContain("Woda dzisiaj");
    expect(buildTelegramWaterSummary(snapshot, "pl")).toContain("Jeszcze około 1500 ml");
    expect(buildTelegramNutritionSummary(snapshot, now, "en")).toContain(
      "Protein: 20.0 g"
    );
    expect(buildTelegramNutritionSummary(snapshot, now, "en")).not.toContain("Білок");
  });

  it("creates signed connect tokens and rejects expired tokens", () => {
    const now = Date.UTC(2026, 5, 20, 10, 0, 0);
    const { token, expiresAt } = createTelegramConnectToken({
      userId: "user-1",
      secret: "secret",
      ttlMs: 60_000,
      now,
    });

    expect(expiresAt).toBe(now + 60_000);
    expect(
      verifyTelegramConnectToken({
        token,
        secret: "secret",
        now: now + 59_000,
      })
    ).toEqual({
      userId: "user-1",
      expiresAt,
    });
    expect(
      verifyTelegramConnectToken({
        token,
        secret: "secret",
        now: expiresAt,
      })
    ).toBeNull();
  });

  it("creates Telegram-safe connect payloads that fit deep-link limits", () => {
    const now = Date.UTC(2026, 5, 20, 10, 0, 0);
    const { token } = createTelegramConnectToken({
      userId: "user-6d8c5a68-16ec-45a1-81ca-cc69c1f89f9c",
      secret: "secret",
      ttlMs: 60_000,
      now,
    });

    expect(token.length).toBeLessThanOrEqual(64);
    expect(token).toMatch(/^[\w-]{1,64}$/);
    expect(token).not.toContain(".");
    expect(
      verifyTelegramConnectToken({
        token,
        secret: "secret",
        now: now + 1_000,
      })
    ).toEqual({
      userId: "user-6d8c5a68-16ec-45a1-81ca-cc69c1f89f9c",
      expiresAt: now + 60_000,
    });
  });

  it("stays disabled without Telegram config and does not send", async () => {
    const service = createTelegramService({
      config: createConfig({ telegramBotToken: null }),
      authRepository: createAuthRepository(),
      logger: { info: vi.fn(), warn: vi.fn() },
    });

    expect(service.getStatus()).toMatchObject({
      configured: false,
      provider: "telegram",
      botUsername: null,
    });
    await expect(service.createConnectLink({ id: "user-1" })).rejects.toMatchObject({
      code: "TELEGRAM_NOT_CONFIGURED",
    });
    await expect(service.sendTelegramMessage("123", "hello")).resolves.toEqual({
      ok: false,
      code: "TELEGRAM_NOT_CONFIGURED",
    });
  });

  it("sends configured assistant reminder media before outbound Telegram messages", async () => {
    const instances = [];
    class TestBot {
      constructor() {
        this.telegram = {
          sendAnimation: vi.fn(async () => {}),
          sendMessage: vi.fn(async () => {}),
        };
        instances.push(this);
      }

      start = vi.fn();
      command = vi.fn();
      on = vi.fn();
      catch = vi.fn();
      stop = vi.fn();
    }

    const service = createTelegramService({
      config: createConfig({
        telegramAssistantMedia: {
          reminder: { type: "animation", value: "assistant-reminder-animation-id" },
        },
      }),
      authRepository: createAuthRepository(),
      logger: { info: vi.fn(), warn: vi.fn() },
      TelegrafClass: TestBot,
    });

    await expect(
      service.sendTelegramMessage("42", "Пора прийняти магній.", undefined, {
        assistantReactionMood: "reminder",
      })
    ).resolves.toEqual({ ok: true });

    expect(instances[0].telegram.sendAnimation).toHaveBeenCalledWith(
      "42",
      "assistant-reminder-animation-id"
    );
    expect(instances[0].telegram.sendMessage).toHaveBeenCalledWith(
      "42",
      "Пора прийняти магній.",
      undefined
    );
  });

  it("still sends outbound Telegram text when assistant reminder media fails", async () => {
    const logger = { info: vi.fn(), warn: vi.fn() };
    const instances = [];
    class TestBot {
      constructor() {
        this.telegram = {
          sendAnimation: vi.fn(async () => {
            throw new Error("telegram media rejected");
          }),
          sendMessage: vi.fn(async () => {}),
        };
        instances.push(this);
      }

      start = vi.fn();
      command = vi.fn();
      on = vi.fn();
      catch = vi.fn();
      stop = vi.fn();
    }

    const service = createTelegramService({
      config: createConfig({
        telegramAssistantMedia: {
          reminder: { type: "animation", value: "assistant-reminder-animation-id" },
        },
      }),
      authRepository: createAuthRepository(),
      logger,
      TelegrafClass: TestBot,
    });

    await expect(
      service.sendTelegramMessage("42", "Пора прийняти магній.", undefined, {
        assistantReactionMood: "reminder",
      })
    ).resolves.toEqual({ ok: true });

    expect(instances[0].telegram.sendMessage).toHaveBeenCalledWith(
      "42",
      "Пора прийняти магній.",
      undefined
    );
    expect(logger.warn).toHaveBeenCalledWith(
      "[telegram] assistant chat reaction failed",
      expect.objectContaining({
        mood: "reminder",
        type: "animation",
      })
    );
  });

  it("creates a Telegram start link for the configured bot", async () => {
    const repository = createAuthRepository({
      findUserById: vi.fn(async () => ({
        id: "user-1",
        name: "Test User",
        role: "USER",
        telegramChatId: "123",
        telegramConnectedAt: "2026-06-20T10:00:00.000Z",
      })),
    });
    const service = createTelegramService({
      config: createConfig(),
      authRepository: repository,
      logger: { info: vi.fn(), warn: vi.fn() },
    });

    const link = await service.createConnectLink({ id: "user-1" });

    expect(link).toMatchObject({
      configured: true,
      connected: true,
      connectedAt: "2026-06-20T10:00:00.000Z",
      botUsername: "SmartNutritionAssistBot",
    });
    expect(link.url).toMatch(/^https:\/\/t\.me\/SmartNutritionAssistBot\?start=/);
    const payload = new URL(link.url).searchParams.get("start");
    expect(payload).toMatch(/^[\w-]{1,64}$/);
    expect(link.url).not.toContain("telegram-token");
    expect(repository.findUserById).toHaveBeenCalledWith("user-1");
  });

  it("links Telegram account from start payload and confirms success", async () => {
    const instances = [];
    class TestBot {
      constructor() {
        this.telegram = { sendMessage: vi.fn() };
        instances.push(this);
      }

      start = vi.fn((handler) => {
        this.startHandler = handler;
      });
      command = vi.fn();
      on = vi.fn();
      catch = vi.fn();
      stop = vi.fn();
      launch = vi.fn((_options, onLaunch) => {
        onLaunch();
        return new Promise(() => {});
      });
    }

    const token = createTelegramConnectToken({
      userId: "user-6d8c5a68-16ec-45a1-81ca-cc69c1f89f9c",
      secret: "test-jwt-secret",
      ttlMs: 60_000,
      now: Date.now(),
    }).token;
    const repository = createAuthRepository({
      findUserById: vi.fn(async (userId) => ({
        id: userId,
        name: "Ihor",
        role: "USER",
        telegramChatId: null,
        telegramConnectedAt: null,
      })),
      updateUserTelegramConnection: vi.fn(async ({ userId, telegramChatId }) => ({
        id: userId,
        name: "Ihor",
        role: "USER",
        telegramChatId,
        telegramConnectedAt: "2026-06-20T10:01:00.000Z",
      })),
    });
    const logger = { info: vi.fn(), warn: vi.fn() };
    const service = createTelegramService({
      config: createConfig(),
      authRepository: repository,
      logger,
      TelegrafClass: TestBot,
    });

    await service.start();
    const reply = vi.fn();
    await instances[0].startHandler({
      payload: token,
      chat: { id: 123456789 },
      reply,
    });

    expect(repository.findUserById).toHaveBeenCalledWith(
      "user-6d8c5a68-16ec-45a1-81ca-cc69c1f89f9c"
    );
    expect(repository.updateUserTelegramConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-6d8c5a68-16ec-45a1-81ca-cc69c1f89f9c",
        telegramChatId: "123456789",
      })
    );
    expect(repository.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "telegram.connected",
        targetId: "user-6d8c5a68-16ec-45a1-81ca-cc69c1f89f9c",
      })
    );
    expect(reply).toHaveBeenCalledWith("Telegram підключено ✅");
    expect(logger.info).toHaveBeenCalledWith(
      "[telegram] connect payload verification result",
      expect.objectContaining({
        ok: true,
      })
    );
    expect(logger.info.mock.calls.map(([, details]) => details)).toContainEqual(
      expect.objectContaining({
        chatId: {
          present: true,
          length: 9,
          suffix: "6789",
        },
      })
    );
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain("123456789");

    service.stop("test shutdown");
  });

  it("does not confirm Telegram connection when database update is not persisted", async () => {
    const instances = [];
    class TestBot {
      constructor() {
        this.telegram = { sendMessage: vi.fn() };
        instances.push(this);
      }

      start = vi.fn((handler) => {
        this.startHandler = handler;
      });
      command = vi.fn();
      on = vi.fn();
      catch = vi.fn();
      stop = vi.fn();
      launch = vi.fn((_options, onLaunch) => {
        onLaunch();
        return new Promise(() => {});
      });
    }

    const token = createTelegramConnectToken({
      userId: "user-2b7f6f5c-5e74-4df4-91c7-56af99338f11",
      secret: "test-jwt-secret",
      ttlMs: 60_000,
      now: Date.now(),
    }).token;
    const repository = createAuthRepository({
      findUserById: vi.fn(async (userId) => ({
        id: userId,
        name: "Ihor",
        role: "USER",
        telegramChatId: null,
        telegramConnectedAt: null,
      })),
      updateUserTelegramConnection: vi.fn(async ({ userId }) => ({
        id: userId,
        name: "Ihor",
        role: "USER",
        telegramChatId: null,
        telegramConnectedAt: null,
      })),
    });
    const logger = { info: vi.fn(), warn: vi.fn() };
    const service = createTelegramService({
      config: createConfig(),
      authRepository: repository,
      logger,
      TelegrafClass: TestBot,
    });

    await service.start();
    const reply = vi.fn();
    await instances[0].startHandler({
      payload: token,
      chat: { id: 123456789 },
      reply,
    });

    expect(reply).not.toHaveBeenCalledWith("Telegram підключено ✅");
    expect(reply).toHaveBeenCalledWith(
      "Не вдалося зберегти підключення Telegram. Спробуйте створити нове посилання в профілі."
    );
    expect(repository.createAuditLog).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      "[telegram] connect database update failed",
      expect.objectContaining({
        provider: "telegram",
        updated: true,
        persisted: false,
        chatId: {
          present: true,
          length: 9,
          suffix: "6789",
        },
      })
    );
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain("123456789");
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain(token);

    service.stop("test shutdown");
  });

  it("disconnects the current user through the repository", async () => {
    const repository = createAuthRepository();
    const service = createTelegramService({
      config: createConfig(),
      authRepository: repository,
      logger: { info: vi.fn(), warn: vi.fn() },
    });

    await expect(service.disconnectUser({ id: "user-1" })).resolves.toEqual({
      configured: true,
      provider: "telegram",
      botUsername: "SmartNutritionAssistBot",
      connected: false,
      connectedAt: null,
    });

    expect(repository.disconnectUserTelegram).toHaveBeenCalledWith("user-1");
    expect(repository.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "telegram.disconnected",
        targetId: "user-1",
      })
    );
  });

  it("starts Telegram polling through the launch callback without waiting forever", async () => {
    const instances = [];
    class TestBot {
      constructor(token) {
        this.token = token;
        this.telegram = { sendMessage: vi.fn(), setMyCommands: vi.fn(async () => {}) };
        instances.push(this);
      }

      start = vi.fn();
      command = vi.fn();
      on = vi.fn();
      catch = vi.fn();
      stop = vi.fn();
      launch = vi.fn((options, onLaunch) => {
        this.launchOptions = options;
        onLaunch();
        return new Promise(() => {});
      });
    }

    const service = createTelegramService({
      config: createConfig(),
      authRepository: createAuthRepository(),
      medicationReminderService: {
        sendDueReminders: vi.fn(async () => []),
      },
      logger: { info: vi.fn(), warn: vi.fn() },
      TelegrafClass: TestBot,
    });

    await expect(service.start()).resolves.toMatchObject({
      ok: true,
      skipped: false,
      starting: true,
    });

    expect(instances).toHaveLength(1);
    expect(instances[0].telegram.setMyCommands).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          command: "reminders",
          description: "Нагадування / задачі",
        }),
        expect.objectContaining({
          command: "meds",
          description: "Активні нагадування про ліки",
        }),
        expect.objectContaining({
          command: "add",
          description: "Додати нагадування автоматично",
        }),
        expect.objectContaining({
          command: "addwater",
          description: "Додати нагадування про воду",
        }),
        expect.objectContaining({
          command: "addhabit",
          description: "Додати нагадування про звичку",
        }),
        expect.objectContaining({
          command: "addsupplement",
          description: "Додати нагадування про добавку",
        }),
      ])
    );
    expect(instances[0].telegram.setMyCommands).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          command: "water",
          description: "Woda dzisiaj",
        }),
        expect.objectContaining({
          command: "addmed",
          description: "Dodaj przypomnienie o lekach",
        }),
      ]),
      { language_code: "pl" }
    );
    expect(instances[0].telegram.setMyCommands).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          command: "water",
          description: "Water today",
        }),
        expect.objectContaining({
          command: "addmed",
          description: "Add medication reminder",
        }),
      ]),
      { language_code: "en" }
    );
    expect(instances[0].launchOptions).toEqual({ dropPendingUpdates: false });
    expect(service.getStatus()).toMatchObject({
      configured: true,
      polling: true,
      starting: false,
      retryScheduled: false,
      lastStartError: null,
      reminders: {
        enabled: true,
        polling: true,
        capabilities: {
          medication: false,
          task: false,
        },
      },
    });
    expect(service.getStatus()).not.toHaveProperty("medicationReminders");

    service.stop("test shutdown");
  });

  it("explains personal Telegram link requirement for plain start messages", async () => {
    const instances = [];
    class TestBot {
      constructor() {
        this.telegram = { sendMessage: vi.fn() };
        instances.push(this);
      }

      start = vi.fn((handler) => {
        this.startHandler = handler;
      });
      command = vi.fn();
      on = vi.fn();
      catch = vi.fn();
      stop = vi.fn();
      launch = vi.fn((_options, onLaunch) => {
        onLaunch();
        return new Promise(() => {});
      });
    }

    const service = createTelegramService({
      config: createConfig(),
      authRepository: createAuthRepository({
        findUserByTelegramChatId: vi.fn(async () => null),
      }),
      logger: { info: vi.fn(), warn: vi.fn() },
      TelegrafClass: TestBot,
    });

    await service.start();
    const reply = vi.fn();
    await instances[0].startHandler({
      startPayload: "",
      chat: { id: 42 },
      from: { language_code: "en" },
      reply,
    });

    expect(reply).toHaveBeenCalledWith(expect.stringContaining("personal link"));
    expect(reply).toHaveBeenCalledWith(expect.stringContaining("plain /start"));

    service.stop("test shutdown");
  });

  it("answers plain start as connected when the Telegram chat is already linked", async () => {
    const instances = [];
    class TestBot {
      constructor() {
        this.telegram = { sendMessage: vi.fn() };
        instances.push(this);
      }

      start = vi.fn((handler) => {
        this.startHandler = handler;
      });
      command = vi.fn();
      on = vi.fn();
      catch = vi.fn();
      stop = vi.fn();
      launch = vi.fn((_options, onLaunch) => {
        onLaunch();
        return new Promise(() => {});
      });
    }

    const service = createTelegramService({
      config: createConfig(),
      authRepository: createAuthRepository({
        findUserByTelegramChatId: vi.fn(async () => ({
          id: "user-1",
          name: "Ihor",
          role: "USER",
          telegramChatId: "42",
          languagePreference: "en",
        })),
      }),
      logger: { info: vi.fn(), warn: vi.fn() },
      TelegrafClass: TestBot,
    });

    await service.start();
    const reply = vi.fn();
    await instances[0].startHandler({
      startPayload: "",
      chat: { id: 42 },
      from: { language_code: "en" },
      reply,
    });

    expect(reply).toHaveBeenCalledWith(expect.stringContaining("already connected"));
    expect(reply).toHaveBeenCalledWith(expect.stringContaining("/meds"));

    service.stop("test shutdown");
  });

  it("shows the main Telegram workspace menu for linked users", async () => {
    const instances = [];
    class TestBot {
      constructor() {
        this.telegram = { sendMessage: vi.fn() };
        this.commands = {};
        instances.push(this);
      }

      start = vi.fn();
      command = vi.fn((name, handler) => {
        this.commands[name] = handler;
      });
      on = vi.fn();
      catch = vi.fn();
      stop = vi.fn();
      launch = vi.fn((_options, onLaunch) => {
        onLaunch();
        return new Promise(() => {});
      });
    }

    const connectedUser = {
      id: "user-1",
      name: "Ihor",
      role: "USER",
      telegramChatId: "42",
    };
    const service = createTelegramService({
      config: createConfig(),
      authRepository: createAuthRepository({
        findUserByTelegramChatId: vi.fn(async () => connectedUser),
      }),
      logger: { info: vi.fn(), warn: vi.fn() },
      TelegrafClass: TestBot,
    });

    await service.start();
    const reply = vi.fn();
    await instances[0].commands.menu({
      chat: { id: 42 },
      reply,
    });

    expect(reply).toHaveBeenCalledWith(
      expect.stringContaining("Smart Nutrition поруч, Ihor"),
      expect.objectContaining({
        reply_markup: expect.objectContaining({
          keyboard: expect.arrayContaining([
            expect.arrayContaining([expect.objectContaining({ text: "📊 День" })]),
            expect.arrayContaining([expect.objectContaining({ text: "💧 Вода" })]),
            expect.arrayContaining([expect.objectContaining({ text: "👤 Профіль" })]),
          ]),
          resize_keyboard: true,
        }),
      })
    );

    service.stop("test shutdown");
  });

  it("sends configured assistant greeting media before the Telegram menu", async () => {
    const instances = [];
    class TestBot {
      constructor() {
        this.telegram = { sendMessage: vi.fn() };
        this.commands = {};
        instances.push(this);
      }

      start = vi.fn();
      command = vi.fn((name, handler) => {
        this.commands[name] = handler;
      });
      on = vi.fn();
      catch = vi.fn();
      stop = vi.fn();
      launch = vi.fn((_options, onLaunch) => {
        onLaunch();
        return new Promise(() => {});
      });
    }

    const connectedUser = {
      id: "user-1",
      name: "Ihor",
      role: "USER",
      telegramChatId: "42",
    };
    const service = createTelegramService({
      config: createConfig({
        telegramAssistantMedia: {
          greeting: { type: "sticker", value: "assistant-greeting-sticker-id" },
        },
      }),
      authRepository: createAuthRepository({
        findUserByTelegramChatId: vi.fn(async () => connectedUser),
      }),
      logger: { info: vi.fn(), warn: vi.fn() },
      TelegrafClass: TestBot,
    });

    await service.start();
    const reply = vi.fn();
    const replyWithSticker = vi.fn();
    await instances[0].commands.menu({
      chat: { id: 42 },
      reply,
      replyWithSticker,
    });

    expect(replyWithSticker).toHaveBeenCalledWith("assistant-greeting-sticker-id");
    expect(reply).toHaveBeenCalledWith(
      expect.stringContaining("Smart Nutrition поруч, Ihor"),
      expect.any(Object)
    );

    service.stop("test shutdown");
  });

  it("uses the profile language for Telegram reply keyboard labels", async () => {
    const instances = [];
    class TestBot {
      constructor() {
        this.telegram = { sendMessage: vi.fn() };
        this.commands = {};
        instances.push(this);
      }

      start = vi.fn();
      command = vi.fn((name, handler) => {
        this.commands[name] = handler;
      });
      on = vi.fn();
      catch = vi.fn();
      stop = vi.fn();
      launch = vi.fn((_options, onLaunch) => {
        onLaunch();
        return new Promise(() => {});
      });
    }

    const connectedUser = {
      id: "user-1",
      name: "Ihor",
      role: "USER",
      telegramChatId: "42",
    };
    const service = createTelegramService({
      config: createConfig(),
      authRepository: createAuthRepository({
        findUserByTelegramChatId: vi.fn(async () => connectedUser),
      }),
      stateService: {
        getSnapshot: vi.fn(async () => ({
          ...snapshot,
          profile: {
            ...snapshot.profile,
            languagePreference: "pl",
          },
        })),
      },
      logger: { info: vi.fn(), warn: vi.fn() },
      TelegrafClass: TestBot,
    });

    await service.start();
    const reply = vi.fn();
    await instances[0].commands.menu({
      chat: { id: 42 },
      reply,
    });

    expect(reply).toHaveBeenCalledWith(
      expect.stringContaining("Smart Nutrition jest obok, Ihor"),
      expect.objectContaining({
        reply_markup: expect.objectContaining({
          keyboard: expect.arrayContaining([
            expect.arrayContaining([expect.objectContaining({ text: "📊 Dzień" })]),
            expect.arrayContaining([expect.objectContaining({ text: "💧 Woda" })]),
            expect.arrayContaining([expect.objectContaining({ text: "❔ Pomoc" })]),
          ]),
          input_field_placeholder: "Napisz działanie albo wybierz przycisk",
        }),
      })
    );

    service.stop("test shutdown");
  });

  it("routes localized Telegram menu button text through canonical snapshot handlers", async () => {
    const instances = [];
    class TestBot {
      constructor() {
        this.telegram = { sendMessage: vi.fn() };
        this.handlers = {};
        instances.push(this);
      }

      start = vi.fn();
      command = vi.fn();
      action = vi.fn();
      on = vi.fn((eventName, handler) => {
        this.handlers[eventName] = handler;
      });
      catch = vi.fn();
      stop = vi.fn();
      launch = vi.fn((_options, onLaunch) => {
        onLaunch();
        return new Promise(() => {});
      });
    }

    const connectedUser = {
      id: "user-1",
      name: "Ihor",
      role: "USER",
      telegramChatId: "42",
      languagePreference: "en",
    };
    const stateService = {
      getSnapshot: vi.fn(async () => ({
        ...snapshot,
        profile: {
          ...snapshot.profile,
          languagePreference: "en",
        },
      })),
    };
    const assistantAgent = {
      run: vi.fn(),
    };
    const reminderService = {
      getUserReminders: vi.fn(() => []),
    };
    const service = createTelegramService({
      config: createConfig(),
      authRepository: createAuthRepository({
        findUserByTelegramChatId: vi.fn(async () => connectedUser),
      }),
      stateService,
      reminderService,
      assistantAgent,
      logger: { info: vi.fn(), warn: vi.fn() },
      TelegrafClass: TestBot,
    });

    await service.start();
    const reply = vi.fn();

    await instances[0].handlers.text({
      chat: { id: 42 },
      message: { text: "💧 Water" },
      reply,
    });

    expect(reply).toHaveBeenCalledWith(
      expect.stringContaining("Water today"),
      expect.objectContaining({
        reply_markup: expect.objectContaining({
          inline_keyboard: expect.any(Array),
        }),
      })
    );
    expect(stateService.getSnapshot).toHaveBeenCalledWith(connectedUser);
    expect(assistantAgent.run).not.toHaveBeenCalled();

    await instances[0].handlers.text({
      chat: { id: 42 },
      message: { text: "📊 Day" },
      reply,
    });

    expect(reply).toHaveBeenCalledWith(expect.stringContaining("Today status:"));
    expect(assistantAgent.run).not.toHaveBeenCalled();

    await instances[0].handlers.text({
      chat: { id: 42 },
      message: { text: "⏰ Reminders" },
      reply,
    });

    expect(reply).toHaveBeenCalledWith(
      expect.stringContaining("There are no active reminders yet.")
    );
    expect(reminderService.getUserReminders).toHaveBeenCalledWith(connectedUser);
    expect(assistantAgent.run).not.toHaveBeenCalled();

    service.stop("test shutdown");
  });

  it("shows water status with storage-backed Telegram quick actions", async () => {
    const instances = [];
    class TestBot {
      constructor() {
        this.telegram = { sendMessage: vi.fn() };
        this.commands = {};
        instances.push(this);
      }

      start = vi.fn();
      command = vi.fn((name, handler) => {
        this.commands[name] = handler;
      });
      action = vi.fn();
      on = vi.fn();
      catch = vi.fn();
      stop = vi.fn();
      launch = vi.fn((_options, onLaunch) => {
        onLaunch();
        return new Promise(() => {});
      });
    }

    const connectedUser = {
      id: "user-1",
      name: "Ihor",
      role: "USER",
      telegramChatId: "42",
    };
    const service = createTelegramService({
      config: createConfig(),
      authRepository: createAuthRepository({
        findUserByTelegramChatId: vi.fn(async () => connectedUser),
      }),
      stateService: {
        getSnapshot: vi.fn(async () => snapshot),
      },
      logger: { info: vi.fn(), warn: vi.fn() },
      TelegrafClass: TestBot,
    });

    await service.start();
    const reply = vi.fn();
    await instances[0].commands.water({
      chat: { id: 42 },
      reply,
    });

    expect(reply).toHaveBeenCalledWith(
      expect.stringContaining("Вода сьогодні"),
      expect.objectContaining({
        reply_markup: expect.objectContaining({
          inline_keyboard: expect.arrayContaining([
            expect.arrayContaining([
              expect.objectContaining({ callback_data: "water:add:250" }),
              expect.objectContaining({ callback_data: "water:add:500" }),
            ]),
            expect.arrayContaining([
              expect.objectContaining({ callback_data: "water:status" }),
            ]),
          ]),
        }),
      })
    );

    service.stop("test shutdown");
  });

  it("uses the profile language for Telegram water quick actions", async () => {
    const instances = [];
    class TestBot {
      constructor() {
        this.telegram = { sendMessage: vi.fn() };
        this.commands = {};
        instances.push(this);
      }

      start = vi.fn();
      command = vi.fn((name, handler) => {
        this.commands[name] = handler;
      });
      action = vi.fn();
      on = vi.fn();
      catch = vi.fn();
      stop = vi.fn();
      launch = vi.fn((_options, onLaunch) => {
        onLaunch();
        return new Promise(() => {});
      });
    }

    const connectedUser = {
      id: "user-1",
      name: "Ihor",
      role: "USER",
      telegramChatId: "42",
    };
    const service = createTelegramService({
      config: createConfig(),
      authRepository: createAuthRepository({
        findUserByTelegramChatId: vi.fn(async () => connectedUser),
      }),
      stateService: {
        getSnapshot: vi.fn(async () => ({
          ...snapshot,
          profile: {
            ...snapshot.profile,
            languagePreference: "en",
          },
        })),
      },
      logger: { info: vi.fn(), warn: vi.fn() },
      TelegrafClass: TestBot,
    });

    await service.start();
    const reply = vi.fn();
    await instances[0].commands.water({
      chat: { id: 42 },
      reply,
    });

    expect(reply).toHaveBeenCalledWith(
      expect.stringContaining("Water today"),
      expect.objectContaining({
        reply_markup: expect.objectContaining({
          inline_keyboard: expect.arrayContaining([
            expect.arrayContaining([
              expect.objectContaining({ text: "+250 ml" }),
              expect.objectContaining({ text: "+500 ml" }),
            ]),
            expect.arrayContaining([expect.objectContaining({ text: "💧 Water status" })]),
          ]),
        }),
      })
    );

    service.stop("test shutdown");
  });

  it("logs water from Telegram inline button through the assistant agent", async () => {
    const instances = [];
    class TestBot {
      constructor() {
        this.telegram = { sendMessage: vi.fn() };
        this.actions = [];
        instances.push(this);
      }

      start = vi.fn();
      command = vi.fn();
      action = vi.fn((matcher, handler) => {
        this.actions.push({ matcher, handler });
      });
      on = vi.fn();
      catch = vi.fn();
      stop = vi.fn();
      launch = vi.fn((_options, onLaunch) => {
        onLaunch();
        return new Promise(() => {});
      });
    }

    const connectedUser = {
      id: "user-1",
      name: "Ihor",
      role: "USER",
      telegramChatId: "42",
    };
    const assistantAgent = {
      run: vi.fn(async () => ({
        handled: true,
        text: "Готово 💧 Додав 250 мл води.",
        intent: { intent: "add_water", entities: { amountMl: 250 } },
        actions: [{ id: "add_water", ok: true, resultType: "water_added" }],
      })),
    };
    const service = createTelegramService({
      config: createConfig(),
      authRepository: createAuthRepository({
        findUserByTelegramChatId: vi.fn(async () => connectedUser),
      }),
      assistantAgent,
      logger: { info: vi.fn(), warn: vi.fn() },
      TelegrafClass: TestBot,
    });

    await service.start();
    const addAction = instances[0].actions.find((item) => String(item.matcher).includes("water"));
    const reply = vi.fn();
    const answerCbQuery = vi.fn();

    await addAction.handler({
      match: ["water:add:250", "add", "250"],
      callbackQuery: {
        data: "water:add:250",
        message: { chat: { id: 42 } },
      },
      reply,
      answerCbQuery,
    });

    expect(assistantAgent.run).toHaveBeenCalledWith(
      expect.objectContaining({
        user: connectedUser,
        message: "додай 250 мл води",
        context: expect.objectContaining({
          interactionChannel: "telegram",
          language: "uk",
        }),
      })
    );
    expect(reply).toHaveBeenCalledWith(
      "Готово 💧 Додав 250 мл води.",
      expect.objectContaining({
        reply_markup: expect.objectContaining({
          inline_keyboard: expect.arrayContaining([
            expect.arrayContaining([
              expect.objectContaining({ callback_data: "water:add:250" }),
            ]),
          ]),
        }),
      })
    );
    expect(answerCbQuery).toHaveBeenCalledWith("Воду збережено.");

    service.stop("test shutdown");
  });

  it("uses the profile language for Telegram water callback replies", async () => {
    const instances = [];
    class TestBot {
      constructor() {
        this.telegram = { sendMessage: vi.fn() };
        this.actions = [];
        instances.push(this);
      }

      start = vi.fn();
      command = vi.fn();
      action = vi.fn((matcher, handler) => {
        this.actions.push({ matcher, handler });
      });
      on = vi.fn();
      catch = vi.fn();
      stop = vi.fn();
      launch = vi.fn((_options, onLaunch) => {
        onLaunch();
        return new Promise(() => {});
      });
    }

    const connectedUser = {
      id: "user-1",
      name: "Ihor",
      role: "USER",
      telegramChatId: "42",
      languagePreference: "en",
    };
    const assistantAgent = {
      run: vi.fn(async () => ({
        handled: true,
        text: "Done. Added 250 ml of water.",
        intent: { intent: "add_water", entities: { amountMl: 250 } },
        actions: [{ id: "add_water", ok: true, resultType: "water_added" }],
      })),
    };
    const service = createTelegramService({
      config: createConfig(),
      authRepository: createAuthRepository({
        findUserByTelegramChatId: vi.fn(async () => connectedUser),
      }),
      assistantAgent,
      logger: { info: vi.fn(), warn: vi.fn() },
      TelegrafClass: TestBot,
    });

    await service.start();
    const addAction = instances[0].actions.find((item) => String(item.matcher).includes("water"));
    const reply = vi.fn();
    const answerCbQuery = vi.fn();

    await addAction.handler({
      match: ["water:add:250", "add", "250"],
      callbackQuery: {
        data: "water:add:250",
        message: { chat: { id: 42 } },
      },
      reply,
      answerCbQuery,
    });

    expect(assistantAgent.run).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          interactionChannel: "telegram",
          language: "en",
        }),
      })
    );
    expect(reply).toHaveBeenCalledWith(
      "Done. Added 250 ml of water.",
      expect.objectContaining({
        reply_markup: expect.objectContaining({
          inline_keyboard: expect.arrayContaining([
            expect.arrayContaining([expect.objectContaining({ text: "+250 ml" })]),
            expect.arrayContaining([expect.objectContaining({ text: "💧 Water status" })]),
          ]),
        }),
      })
    );
    expect(answerCbQuery).toHaveBeenCalledWith("Water saved.");

    service.stop("test shutdown");
  });

  it("returns retry feedback when Telegram water save fails", async () => {
    const instances = [];
    class TestBot {
      constructor() {
        this.telegram = { sendMessage: vi.fn() };
        this.actions = [];
        instances.push(this);
      }

      start = vi.fn();
      command = vi.fn();
      action = vi.fn((matcher, handler) => {
        this.actions.push({ matcher, handler });
      });
      on = vi.fn();
      catch = vi.fn();
      stop = vi.fn();
      launch = vi.fn((_options, onLaunch) => {
        onLaunch();
        return new Promise(() => {});
      });
    }

    const assistantAgent = {
      run: vi.fn(async () => ({
        handled: true,
        text: "Я зрозумів дію з водою, але зараз не зміг підтвердити збереження в Smart Nutrition.",
        intent: { intent: "add_water", entities: { amountMl: 250 } },
        actions: [{ id: "add_water", ok: false, code: "STATE_DOWN" }],
      })),
    };
    const service = createTelegramService({
      config: createConfig(),
      authRepository: createAuthRepository({
        findUserByTelegramChatId: vi.fn(async () => ({
          id: "user-1",
          name: "Ihor",
          role: "USER",
          telegramChatId: "42",
        })),
      }),
      assistantAgent,
      logger: { info: vi.fn(), warn: vi.fn() },
      TelegrafClass: TestBot,
    });

    await service.start();
    const addAction = instances[0].actions.find((item) => String(item.matcher).includes("water"));
    const reply = vi.fn();
    const answerCbQuery = vi.fn();

    await addAction.handler({
      match: ["water:add:250", "add", "250"],
      callbackQuery: {
        data: "water:add:250",
        message: { chat: { id: 42 } },
      },
      reply,
      answerCbQuery,
    });

    expect(reply).toHaveBeenCalledWith(
      expect.stringContaining("не зміг підтвердити збереження"),
      expect.objectContaining({
        reply_markup: expect.objectContaining({
          inline_keyboard: expect.arrayContaining([
            expect.arrayContaining([
              expect.objectContaining({ callback_data: "water:retry:250" }),
            ]),
          ]),
        }),
      })
    );
    expect(answerCbQuery).toHaveBeenCalledWith("Не збереглося. Спробуйте ще раз.");

    service.stop("test shutdown");
  });

  it("handles reminder inline buttons from callback query chat context", async () => {
    const instances = [];
    class TestBot {
      constructor() {
        this.telegram = { sendMessage: vi.fn() };
        this.handlers = {};
        instances.push(this);
      }

      start = vi.fn();
      command = vi.fn();
      on = vi.fn((eventName, handler) => {
        this.handlers[eventName] = handler;
      });
      catch = vi.fn();
      stop = vi.fn();
      launch = vi.fn((_options, onLaunch) => {
        onLaunch();
        return new Promise(() => {});
      });
    }

    const reminder = {
      id: "task-1",
      type: "task",
      title: "Позвонить врачу",
      times: ["10:00"],
      timezone: "Europe/Warsaw",
      active: true,
      nextRunAt: "2026-06-20T08:00:00.000Z",
      createdAt: "2026-06-20T07:00:00.000Z",
      updatedAt: "2026-06-20T07:00:00.000Z",
      events: [],
    };
    const connectedUser = {
      id: "user-1",
      name: "Ihor",
      role: "USER",
      telegramChatId: "42",
      medicationReminders: [reminder],
    };
    const reminderService = {
      getUserReminders: vi.fn(() => [reminder]),
      pauseReminder: vi.fn(async () => ({
        ok: true,
        reminder: { ...reminder, active: false, nextRunAt: null },
        user: connectedUser,
      })),
      sendDueReminders: vi.fn(async () => []),
    };
    const repository = createAuthRepository({
      findUserByTelegramChatId: vi.fn(async (chatId) =>
        chatId === "42" ? connectedUser : null
      ),
    });
    const service = createTelegramService({
      config: createConfig(),
      authRepository: repository,
      reminderService,
      logger: { info: vi.fn(), warn: vi.fn() },
      TelegrafClass: TestBot,
    });

    await service.start();
    const answerCbQuery = vi.fn();
    await instances[0].handlers.callback_query({
      callbackQuery: {
        data: "rem:pause:task-1",
        message: {
          chat: { id: 42 },
        },
      },
      answerCbQuery,
      reply: vi.fn(),
    });

    expect(repository.findUserByTelegramChatId).toHaveBeenCalledWith("42");
    expect(reminderService.pauseReminder).toHaveBeenCalledWith(
      connectedUser,
      "task-1",
      expect.any(Date)
    );
    expect(answerCbQuery).toHaveBeenCalledWith("Нагадування на паузі.");
    expect(repository.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "telegram.task_reminder.pause",
        targetId: "user-1",
      })
    );

    service.stop("test shutdown");
  });

  it("routes connected free-text messages through the assistant agent", async () => {
    const instances = [];
    class TestBot {
      constructor() {
        this.telegram = { sendMessage: vi.fn() };
        instances.push(this);
      }

      start = vi.fn();
      command = vi.fn();
      on = vi.fn((eventName, handler) => {
        if (eventName === "text") {
          this.textHandler = handler;
        }
      });
      catch = vi.fn();
      stop = vi.fn();
      launch = vi.fn((_options, onLaunch) => {
        onLaunch();
        return new Promise(() => {});
      });
    }

    const assistantAgent = {
      run: vi.fn(async () => ({
        handled: true,
        text: "Готово 💧 Додав 300 мл води.",
      })),
    };
    const connectedUser = {
      id: "user-1",
      name: "Ihor",
      role: "USER",
      telegramChatId: "42",
    };
    const service = createTelegramService({
      config: createConfig(),
      authRepository: createAuthRepository({
        findUserByTelegramChatId: vi.fn(async () => connectedUser),
      }),
      assistantAgent,
      logger: { info: vi.fn(), warn: vi.fn() },
      TelegrafClass: TestBot,
    });

    await service.start();
    const reply = vi.fn();
    await instances[0].textHandler({
      chat: { id: 42 },
      message: { text: "Я випив 300 мл води" },
      reply,
    });

    expect(assistantAgent.run).toHaveBeenCalledWith(
      expect.objectContaining({
        user: connectedUser,
        message: "Я випив 300 мл води",
        context: expect.objectContaining({
          interactionChannel: "telegram",
          language: "uk",
        }),
      })
    );
    expect(reply).toHaveBeenCalledWith("Готово 💧 Додав 300 мл води.");

    service.stop("test shutdown");
  });

  it("uses assistant reaction media around confirmed Telegram agent actions", async () => {
    const instances = [];
    class TestBot {
      constructor() {
        this.telegram = { sendMessage: vi.fn() };
        instances.push(this);
      }

      start = vi.fn();
      command = vi.fn();
      on = vi.fn((eventName, handler) => {
        if (eventName === "text") {
          this.textHandler = handler;
        }
      });
      catch = vi.fn();
      stop = vi.fn();
      launch = vi.fn((_options, onLaunch) => {
        onLaunch();
        return new Promise(() => {});
      });
    }

    const assistantAgent = {
      run: vi.fn(async () => ({
        handled: true,
        text: "Готово. Я зберіг дію після підтвердження backend.",
      })),
    };
    const connectedUser = {
      id: "user-1",
      name: "Ihor",
      role: "USER",
      telegramChatId: "42",
    };
    const service = createTelegramService({
      config: createConfig({
        telegramAssistantMedia: {
          thinking: { type: "animation", value: "assistant-thinking-animation-id" },
          success: { type: "animation", value: "assistant-success-animation-id" },
        },
      }),
      authRepository: createAuthRepository({
        findUserByTelegramChatId: vi.fn(async () => connectedUser),
      }),
      assistantAgent,
      logger: { info: vi.fn(), warn: vi.fn() },
      TelegrafClass: TestBot,
    });

    await service.start();
    const reply = vi.fn();
    const replyWithAnimation = vi.fn();
    await instances[0].textHandler({
      chat: { id: 42 },
      message: { text: "Додай 250 мл води" },
      reply,
      replyWithAnimation,
    });

    expect(replyWithAnimation).toHaveBeenNthCalledWith(
      1,
      "assistant-thinking-animation-id"
    );
    expect(replyWithAnimation).toHaveBeenNthCalledWith(
      2,
      "assistant-success-animation-id"
    );
    expect(reply).toHaveBeenCalledWith(
      "Готово. Я зберіг дію після підтвердження backend."
    );

    service.stop("test shutdown");
  });

  it("routes connected free-text conversation through the same AI assistant as the website", async () => {
    const instances = [];
    class TestBot {
      constructor() {
        this.telegram = { sendMessage: vi.fn() };
        instances.push(this);
      }

      start = vi.fn();
      command = vi.fn();
      on = vi.fn((eventName, handler) => {
        if (eventName === "text") {
          this.textHandler = handler;
        }
      });
      catch = vi.fn();
      stop = vi.fn();
      launch = vi.fn((_options, onLaunch) => {
        onLaunch();
        return new Promise(() => {});
      });
    }

    const connectedUser = {
      id: "user-1",
      name: "Ihor",
      role: "USER",
      telegramChatId: "42",
    };
    const assistantAgent = {
      run: vi.fn(async () => ({
        handled: false,
        intent: { intent: "unknown" },
      })),
    };
    const aiService = {
      askQuestion: vi.fn(async () => ({
        text: "Я поруч. Давай спокійно розберемо твій день і харчування.",
        mode: "remote-cloud",
      })),
    };
    const service = createTelegramService({
      config: createConfig(),
      authRepository: createAuthRepository({
        findUserByTelegramChatId: vi.fn(async () => connectedUser),
      }),
      assistantAgent,
      aiService,
      logger: { info: vi.fn(), warn: vi.fn() },
      TelegrafClass: TestBot,
    });

    await service.start();
    const reply = vi.fn();
    await instances[0].textHandler({
      chat: { id: 42 },
      message: { text: "Поговори со мной как помощник" },
      reply,
    });

    expect(aiService.askQuestion).toHaveBeenCalledWith(connectedUser, {
      question: "Поговори со мной как помощник",
      context: expect.objectContaining({
        interactionChannel: "telegram",
        language: "uk",
      }),
    });
    expect(reply).toHaveBeenCalledWith(
      "Я поруч. Давай спокійно розберемо твій день і харчування."
    );

    service.stop("test shutdown");
  });

  it("sends configured thinking media before Telegram AI conversation fallback", async () => {
    const instances = [];
    class TestBot {
      constructor() {
        this.telegram = { sendMessage: vi.fn() };
        instances.push(this);
      }

      start = vi.fn();
      command = vi.fn();
      on = vi.fn((eventName, handler) => {
        if (eventName === "text") {
          this.textHandler = handler;
        }
      });
      catch = vi.fn();
      stop = vi.fn();
      launch = vi.fn((_options, onLaunch) => {
        onLaunch();
        return new Promise(() => {});
      });
    }

    const connectedUser = {
      id: "user-1",
      name: "Ihor",
      role: "USER",
      telegramChatId: "42",
    };
    const assistantAgent = {
      run: vi.fn(async () => ({
        handled: false,
        intent: { intent: "unknown" },
      })),
    };
    const aiService = {
      askQuestion: vi.fn(async () => ({
        text: "Я поруч як AI-помічник Smart Nutrition.",
        mode: "remote-cloud",
      })),
    };
    const service = createTelegramService({
      config: createConfig({
        telegramAssistantMedia: {
          thinking: { type: "animation", value: "assistant-thinking-animation-id" },
        },
      }),
      authRepository: createAuthRepository({
        findUserByTelegramChatId: vi.fn(async () => connectedUser),
      }),
      assistantAgent,
      aiService,
      logger: { info: vi.fn(), warn: vi.fn() },
      TelegrafClass: TestBot,
    });

    await service.start();
    const reply = vi.fn();
    const replyWithAnimation = vi.fn();
    await instances[0].textHandler({
      chat: { id: 42 },
      message: { text: "Поговори со мной" },
      reply,
      replyWithAnimation,
    });

    expect(replyWithAnimation).toHaveBeenCalledWith("assistant-thinking-animation-id");
    expect(reply).toHaveBeenCalledWith("Я поруч як AI-помічник Smart Nutrition.");

    service.stop("test shutdown");
  });

  it("passes women-health profile context into Telegram AI conversation", async () => {
    const instances = [];
    class TestBot {
      constructor() {
        this.telegram = { sendMessage: vi.fn() };
        instances.push(this);
      }

      start = vi.fn();
      command = vi.fn();
      on = vi.fn((eventName, handler) => {
        if (eventName === "text") {
          this.textHandler = handler;
        }
      });
      catch = vi.fn();
      stop = vi.fn();
      launch = vi.fn((_options, onLaunch) => {
        onLaunch();
        return new Promise(() => {});
      });
    }

    const connectedUser = {
      id: "user-1",
      name: "Ira",
      role: "USER",
      gender: "female",
      goal: "maintain",
      weight: 72,
      telegramChatId: "42",
    };
    const assistantAgent = {
      run: vi.fn(async () => ({
        handled: false,
        intent: { intent: "unknown" },
      })),
    };
    const aiService = {
      askQuestion: vi.fn(async () => ({
        text: "Тримаю контекст вагітності обережно і без медичних призначень.",
        mode: "remote-cloud",
      })),
    };
    const service = createTelegramService({
      config: createConfig(),
      authRepository: createAuthRepository({
        findUserByTelegramChatId: vi.fn(async () => connectedUser),
      }),
      stateService: {
        getSnapshot: vi.fn(async () => ({
          ...snapshot,
          profile: {
            ...snapshot.profile,
            goal: "maintain",
            dietStyle: "balanced",
            languagePreference: "uk",
            weightHistory: [
              { date: "2026-06-01T08:00:00.000Z", weight: 73 },
              { date: "2026-06-20T08:00:00.000Z", weight: 72 },
            ],
            personalDetails: {
              bloodGroup: "unknown",
              eyeColor: "green",
              relationshipStatus: "married",
              supportSystem: "partner_supports",
              petCompanion: "none",
            },
            womenHealth: {
              mode: "pregnant",
              pregnancyWeek: 19,
              dueDate: "2026-11-15T00:00:00.000Z",
              lastPeriodStartDate: null,
              doctorConfirmed: true,
              notes: "clinician confirmed prenatal plan",
            },
          },
        })),
      },
      assistantAgent,
      aiService,
      logger: { info: vi.fn(), warn: vi.fn() },
      TelegrafClass: TestBot,
    });

    await service.start();
    const reply = vi.fn();
    await instances[0].textHandler({
      chat: { id: 42 },
      message: { text: "Що мені краще сьогодні по харчуванню?" },
      reply,
    });

    expect(aiService.askQuestion).toHaveBeenCalledWith(connectedUser, {
      question: "Що мені краще сьогодні по харчуванню?",
      context: expect.objectContaining({
        interactionChannel: "telegram",
        language: "uk",
        userName: "Ira",
        gender: "female",
        womenHealth: expect.objectContaining({
          mode: "pregnant",
          pregnancyWeek: 19,
          doctorConfirmed: true,
        }),
        personalDetails: expect.objectContaining({
          eyeColor: "green",
        }),
      }),
    });
    expect(reply).toHaveBeenCalledWith(
      "Тримаю контекст вагітності обережно і без медичних призначень."
    );

    service.stop("test shutdown");
  });

  it("keeps women-health Telegram context when the user gender snapshot is stale", async () => {
    const instances = [];
    class TestBot {
      constructor() {
        this.telegram = { sendMessage: vi.fn() };
        instances.push(this);
      }

      start = vi.fn();
      command = vi.fn();
      on = vi.fn((eventName, handler) => {
        if (eventName === "text") {
          this.textHandler = handler;
        }
      });
      catch = vi.fn();
      stop = vi.fn();
      launch = vi.fn((_options, onLaunch) => {
        onLaunch();
        return new Promise(() => {});
      });
    }

    const connectedUser = {
      id: "user-1",
      name: "Ira",
      role: "USER",
      gender: "male",
      goal: "maintain",
      weight: 72,
      telegramChatId: "42",
    };
    const assistantAgent = {
      run: vi.fn(async () => ({
        handled: false,
        intent: { intent: "unknown" },
      })),
    };
    const aiService = {
      askQuestion: vi.fn(async () => ({
        text: "Бачу контекст вагітності з профілю і тримаю відповідь обережною.",
        mode: "remote-cloud",
      })),
    };
    const service = createTelegramService({
      config: createConfig(),
      authRepository: createAuthRepository({
        findUserByTelegramChatId: vi.fn(async () => connectedUser),
      }),
      stateService: {
        getSnapshot: vi.fn(async () => ({
          ...snapshot,
          profile: {
            ...snapshot.profile,
            languagePreference: "uk",
            womenHealth: {
              mode: "pregnant",
              pregnancyWeek: 13,
              dueDate: "2027-01-20T00:00:00.000Z",
              lastPeriodStartDate: null,
              doctorConfirmed: false,
              notes: "needs gentle family support",
            },
          },
        })),
      },
      assistantAgent,
      aiService,
      logger: { info: vi.fn(), warn: vi.fn() },
      TelegrafClass: TestBot,
    });

    await service.start();
    const reply = vi.fn();
    await instances[0].textHandler({
      chat: { id: 42 },
      message: { text: "Що зараз важливо?" },
      reply,
    });

    expect(aiService.askQuestion).toHaveBeenCalledWith(connectedUser, {
      question: "Що зараз важливо?",
      context: expect.objectContaining({
        interactionChannel: "telegram",
        language: "uk",
        gender: "male",
        womenHealth: expect.objectContaining({
          mode: "pregnant",
          pregnancyWeek: 13,
        }),
      }),
    });
    expect(reply).toHaveBeenCalledWith(
      "Бачу контекст вагітності з профілю і тримаю відповідь обережною."
    );

    service.stop("test shutdown");
  });

  it("reports Telegram AI assistant failures without fake success", async () => {
    const instances = [];
    class TestBot {
      constructor() {
        this.telegram = { sendMessage: vi.fn() };
        instances.push(this);
      }

      start = vi.fn();
      command = vi.fn();
      on = vi.fn((eventName, handler) => {
        if (eventName === "text") {
          this.textHandler = handler;
        }
      });
      catch = vi.fn();
      stop = vi.fn();
      launch = vi.fn((_options, onLaunch) => {
        onLaunch();
        return new Promise(() => {});
      });
    }

    const logger = { info: vi.fn(), warn: vi.fn() };
    const service = createTelegramService({
      config: createConfig(),
      authRepository: createAuthRepository({
        findUserByTelegramChatId: vi.fn(async () => ({
          id: "user-1",
          name: "Ihor",
          role: "USER",
          telegramChatId: "42",
        })),
      }),
      assistantAgent: {
        run: vi.fn(async () => ({ handled: false, intent: { intent: "unknown" } })),
      },
      aiService: {
        askQuestion: vi.fn(async () => {
          throw new Error("provider down");
        }),
      },
      logger,
      TelegrafClass: TestBot,
    });

    await service.start();
    const reply = vi.fn();
    await instances[0].textHandler({
      chat: { id: 42 },
      message: { text: "Мне нужна поддержка" },
      reply,
    });

    expect(reply).toHaveBeenCalledWith(
      "AI-помічник тимчасово недоступний. Спробуйте ще раз трохи пізніше."
    );
    expect(logger.warn).toHaveBeenCalledWith(
      "[telegram] ai assistant reply failed",
      expect.objectContaining({ code: "Error" })
    );

    service.stop("test shutdown");
  });

  it("explains connection requirement for free-text messages before linking", async () => {
    const instances = [];
    class TestBot {
      constructor() {
        this.telegram = { sendMessage: vi.fn() };
        instances.push(this);
      }

      start = vi.fn();
      command = vi.fn();
      on = vi.fn((eventName, handler) => {
        if (eventName === "text") {
          this.textHandler = handler;
        }
      });
      catch = vi.fn();
      stop = vi.fn();
      launch = vi.fn((_options, onLaunch) => {
        onLaunch();
        return new Promise(() => {});
      });
    }

    const assistantAgent = {
      run: vi.fn(),
    };
    const service = createTelegramService({
      config: createConfig(),
      authRepository: createAuthRepository({
        findUserByTelegramChatId: vi.fn(async () => null),
      }),
      assistantAgent,
      logger: { info: vi.fn(), warn: vi.fn() },
      TelegrafClass: TestBot,
    });

    await service.start();
    const reply = vi.fn();
    await instances[0].textHandler({
      chat: { id: 42 },
      from: { language_code: "en" },
      message: { text: "привет" },
      reply,
    });

    expect(assistantAgent.run).not.toHaveBeenCalled();
    expect(reply).toHaveBeenCalledTimes(1);
    expect(reply).toHaveBeenCalledWith(expect.stringContaining("Telegram is not connected yet"));
    expect(reply).toHaveBeenCalledWith(expect.stringContaining("personal link"));

    service.stop("test shutdown");
  });

  it("records safe Telegram polling failures and schedules retry", async () => {
    class FailingBot {
      constructor() {
        this.telegram = { sendMessage: vi.fn() };
      }

      start = vi.fn();
      command = vi.fn();
      on = vi.fn();
      catch = vi.fn();
      stop = vi.fn();
      launch = vi.fn(() => Promise.reject(new Error("409 Conflict: webhook is active")));
    }

    const service = createTelegramService({
      config: createConfig(),
      authRepository: createAuthRepository(),
      logger: { info: vi.fn(), warn: vi.fn() },
      TelegrafClass: FailingBot,
    });

    await service.start();
    await Promise.resolve();
    await Promise.resolve();

    expect(service.getStatus()).toMatchObject({
      configured: true,
      polling: false,
      retryScheduled: true,
      lastStartError: {
        code: "Error",
        message: "409 Conflict: webhook is active",
      },
    });

    service.stop("test shutdown");
  });
});
