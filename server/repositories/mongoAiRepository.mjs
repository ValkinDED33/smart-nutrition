import { MongoClient } from "mongodb";

const isAssistantMessageRole = (value) => value === "user" || value === "assistant";
const isAiUsageEventType = (value) =>
  value === "completed" || value === "blocked" || value === "failed";

const toNonNegativeInteger = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? Math.max(Math.round(next), 0) : fallback;
};

const toNonNegativeNumber = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) && next >= 0 ? next : fallback;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getErrorMessage = (error) =>
  error instanceof Error ? error.message : "Unknown MongoDB connection error";

const mapAssistantMessage = (doc) =>
  doc
    ? {
        id: doc.id,
        userId: doc.userId,
        role: isAssistantMessageRole(doc.role) ? doc.role : "assistant",
        text: String(doc.text ?? ""),
        createdAt: doc.createdAt,
      }
    : null;

const mapUsageEvent = (doc) =>
  doc
    ? {
        id: doc.id,
        userId: doc.userId,
        route: String(doc.route ?? "ai"),
        eventType: isAiUsageEventType(doc.eventType) ? doc.eventType : "completed",
        promptTokens: toNonNegativeInteger(doc.promptTokens),
        completionTokens: toNonNegativeInteger(doc.completionTokens),
        totalTokens: toNonNegativeInteger(doc.totalTokens),
        estimatedCostUsd: toNonNegativeNumber(doc.estimatedCostUsd),
        providerId: doc.providerId ?? null,
        blockedReason: doc.blockedReason ?? null,
        createdAt: doc.createdAt,
      }
    : null;

const connectMongoClient = async ({ client, config, logger = null }) => {
  let lastError = null;
  const maxAttempts = Math.max(Number(config.mongoConnectRetries) || 1, 1);
  const retryDelayMs = Math.max(Number(config.mongoConnectRetryDelayMs) || 0, 0);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await client.connect();
      await client.db(config.mongoDatabaseName).command({ ping: 1 });
      logger?.info?.("[mongodb-ai] repository connected", {
        database: config.mongoDatabaseName,
      });
      return;
    } catch (error) {
      lastError = error;

      if (attempt >= maxAttempts) {
        break;
      }

      console.warn(
        `MongoDB connection attempt ${attempt}/${maxAttempts} failed: ${getErrorMessage(
          error
        )}. Retrying...`
      );
      await wait(retryDelayMs * attempt);
    }
  }

  await client.close().catch(() => {});
  throw new Error(`MongoDB connection failed: ${getErrorMessage(lastError)}`);
};

export const createMongoAiRepository = async ({ config, auditRepository, logger = null }) => {
  const client = new MongoClient(config.mongoUri, {
    appName: "smart-nutrition-ai",
    serverSelectionTimeoutMS: config.mongoServerSelectionTimeoutMs,
    connectTimeoutMS: config.mongoConnectTimeoutMs,
    socketTimeoutMS: config.mongoSocketTimeoutMs,
    minPoolSize: config.mongoMinPoolSize,
    maxPoolSize: config.mongoMaxPoolSize,
    retryReads: true,
    retryWrites: true,
  });

  await connectMongoClient({ client, config, logger });

  const database = client.db(config.mongoDatabaseName);
  const messages = database.collection("assistant_messages");
  const usageEvents = database.collection("ai_usage_events");

  await Promise.all([
    messages.createIndex({ userId: 1, createdAt: -1 }),
    messages.createIndex({ id: 1 }, { unique: true }),
    usageEvents.createIndex({ userId: 1, createdAt: -1 }),
    usageEvents.createIndex({ route: 1, createdAt: -1 }),
    usageEvents.createIndex({ id: 1 }, { unique: true }),
  ]);

  return {
    getEngineInfo: () => ({
      engine: "mongodb",
      database: config.mongoDatabaseName,
      collections: {
        messages: "assistant_messages",
        usageEvents: "ai_usage_events",
      },
    }),

    close: () => client.close(),

    listConversationMessages: async (userId, limit = 16) =>
      (
        await messages
          .find({ userId })
          .sort({ createdAt: -1 })
          .limit(Math.max(Number(limit) || 0, 1))
          .toArray()
      )
        .map(mapAssistantMessage)
        .filter(Boolean)
        .reverse(),

    insertConversationMessage: async ({ id, userId, role, text, createdAt }) => {
      await messages.insertOne({
        id,
        userId,
        role: isAssistantMessageRole(role) ? role : "assistant",
        text: String(text ?? ""),
        createdAt,
      });
    },

    clearConversationMessages: async (userId) => {
      await messages.deleteMany({ userId });
    },

    pruneConversationMessages: async (userId, keepLast = 16) => {
      const keepIds = (
        await messages
          .find({ userId }, { projection: { id: 1 } })
          .sort({ createdAt: -1 })
          .limit(Math.max(Number(keepLast) || 0, 1))
          .toArray()
      ).map((doc) => doc.id);

      await messages.deleteMany({
        userId,
        id: { $nin: keepIds },
      });
    },

    insertUsageEvent: async ({
      id,
      userId,
      route,
      eventType,
      promptTokens = 0,
      completionTokens = 0,
      totalTokens = 0,
      estimatedCostUsd = 0,
      providerId = null,
      blockedReason = null,
      createdAt,
    }) => {
      const normalizedPromptTokens = toNonNegativeInteger(promptTokens);
      const normalizedCompletionTokens = toNonNegativeInteger(completionTokens);
      const normalizedTotalTokens = toNonNegativeInteger(
        totalTokens,
        normalizedPromptTokens + normalizedCompletionTokens
      );

      await usageEvents.insertOne({
        id,
        userId,
        route: String(route ?? "ai"),
        eventType: isAiUsageEventType(eventType) ? eventType : "completed",
        promptTokens: normalizedPromptTokens,
        completionTokens: normalizedCompletionTokens,
        totalTokens: normalizedTotalTokens,
        estimatedCostUsd: toNonNegativeNumber(estimatedCostUsd),
        providerId,
        blockedReason,
        createdAt,
      });
    },

    getUsageSummary: async ({ userId, sinceIso, route = null }) => {
      const match = {
        userId,
        createdAt: { $gte: sinceIso },
      };

      if (typeof route === "string" && route.trim()) {
        match.route = route.trim();
      }

      const [summary] = await usageEvents
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              requestCount: { $sum: 1 },
              promptTokens: { $sum: "$promptTokens" },
              completionTokens: { $sum: "$completionTokens" },
              totalTokens: { $sum: "$totalTokens" },
              estimatedCostUsd: { $sum: "$estimatedCostUsd" },
            },
          },
        ])
        .toArray();

      return {
        requestCount: toNonNegativeInteger(summary?.requestCount),
        promptTokens: toNonNegativeInteger(summary?.promptTokens),
        completionTokens: toNonNegativeInteger(summary?.completionTokens),
        totalTokens: toNonNegativeInteger(summary?.totalTokens),
        estimatedCostUsd: toNonNegativeNumber(summary?.estimatedCostUsd),
      };
    },

    findLatestUsageEvent: async ({ userId, route = null, eventType = null }) => {
      const query = { userId };

      if (typeof route === "string" && route.trim()) {
        query.route = route.trim();
      }

      if (typeof eventType === "string" && eventType.trim()) {
        query.eventType = eventType.trim();
      }

      return mapUsageEvent(await usageEvents.findOne(query, { sort: { createdAt: -1 } }));
    },

    createAuditLog: (entry) => auditRepository.createAuditLog(entry),
  };
};
