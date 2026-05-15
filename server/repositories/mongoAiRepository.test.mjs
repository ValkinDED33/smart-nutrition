import { beforeEach, describe, expect, it, vi } from "vitest";

const mongoMocks = vi.hoisted(() => ({
  connect: vi.fn(),
  close: vi.fn(),
  db: vi.fn(),
  command: vi.fn(),
  collection: vi.fn(),
  messagesCreateIndex: vi.fn(),
  usageEventsCreateIndex: vi.fn(),
}));

vi.mock("mongodb", () => ({
  MongoClient: vi.fn(function MongoClientMock(uri, options) {
    this.uri = uri;
    this.options = options;
    this.connect = mongoMocks.connect;
    this.close = mongoMocks.close;
    this.db = mongoMocks.db;
  }),
}));

const { MongoClient } = await import("mongodb");
const { createMongoAiRepository } = await import("./mongoAiRepository.mjs");

const createConfig = (overrides = {}) => ({
  mongoUri: "mongodb+srv://cluster0.example.mongodb.net/smart-nutrition",
  mongoDatabaseName: "smart-nutrition",
  mongoServerSelectionTimeoutMs: 5000,
  mongoConnectRetries: 3,
  mongoConnectRetryDelayMs: 1,
  mongoConnectTimeoutMs: 10000,
  mongoSocketTimeoutMs: 45000,
  mongoMinPoolSize: 0,
  mongoMaxPoolSize: 20,
  ...overrides,
});

describe("createMongoAiRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mongoMocks.connect.mockResolvedValue(undefined);
    mongoMocks.close.mockResolvedValue(undefined);
    mongoMocks.command.mockResolvedValue({ ok: 1 });
    mongoMocks.messagesCreateIndex.mockResolvedValue("messages-index");
    mongoMocks.usageEventsCreateIndex.mockResolvedValue("usage-index");
    mongoMocks.collection.mockImplementation((name) => {
      if (name === "assistant_messages") {
        return {
          createIndex: mongoMocks.messagesCreateIndex,
        };
      }

      return {
        createIndex: mongoMocks.usageEventsCreateIndex,
      };
    });
    mongoMocks.db.mockReturnValue({
      command: mongoMocks.command,
      collection: mongoMocks.collection,
    });
  });

  it("connects with production-safe MongoDB options and creates indexes", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const repository = await createMongoAiRepository({
      config: createConfig(),
      auditRepository: {
        createAuditLog: vi.fn(),
      },
    });

    expect(MongoClient).toHaveBeenCalledWith(
      "mongodb+srv://cluster0.example.mongodb.net/smart-nutrition",
      {
        appName: "smart-nutrition-ai",
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        minPoolSize: 0,
        maxPoolSize: 20,
        retryReads: true,
        retryWrites: true,
      }
    );
    expect(mongoMocks.connect).toHaveBeenCalledTimes(1);
    expect(mongoMocks.db).toHaveBeenCalledWith("smart-nutrition");
    expect(mongoMocks.command).toHaveBeenCalledWith({ ping: 1 });
    expect(mongoMocks.collection).toHaveBeenCalledWith("assistant_messages");
    expect(mongoMocks.collection).toHaveBeenCalledWith("ai_usage_events");
    expect(mongoMocks.messagesCreateIndex).toHaveBeenCalledWith({ userId: 1, createdAt: -1 });
    expect(mongoMocks.messagesCreateIndex).toHaveBeenCalledWith({ id: 1 }, { unique: true });
    expect(repository.getEngineInfo()).toEqual({
      engine: "mongodb",
      database: "smart-nutrition",
      collections: {
        messages: "assistant_messages",
        usageEvents: "ai_usage_events",
      },
    });

    logSpy.mockRestore();
  });

  it("retries transient MongoDB connection failures", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mongoMocks.connect
      .mockRejectedValueOnce(new Error("temporary network error"))
      .mockResolvedValueOnce(undefined);

    await createMongoAiRepository({
      config: createConfig({
        mongoConnectRetries: 2,
        mongoConnectRetryDelayMs: 1,
      }),
      auditRepository: {
        createAuditLog: vi.fn(),
      },
    });

    expect(mongoMocks.connect).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("MongoDB connection attempt 1/2 failed")
    );

    warnSpy.mockRestore();
    logSpy.mockRestore();
  });
});
