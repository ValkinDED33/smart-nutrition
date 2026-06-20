import { describe, expect, it, vi } from "vitest";
import {
  buildTelegramAssistantCapabilitiesMessage,
  buildTelegramDailySummary,
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
    expect(message).toContain("/today");
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
    expect(link.url).not.toContain("telegram-token");
    expect(repository.findUserById).toHaveBeenCalledWith("user-1");
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
        this.telegram = { sendMessage: vi.fn() };
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
    expect(instances[0].launchOptions).toEqual({ dropPendingUpdates: false });
    expect(service.getStatus()).toMatchObject({
      configured: true,
      polling: true,
      starting: false,
      retryScheduled: false,
      lastStartError: null,
      medicationReminders: {
        enabled: true,
        polling: true,
      },
    });

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
