import Redis from "ioredis";

const createMemoryCache = (fallbackReason = null) => {
  const entries = new Map();
  const buildKey = (key) => String(key ?? "").replace(/^\:+/, "");
  const readEntry = (key) => {
    const normalizedKey = buildKey(key);
    const entry = entries.get(normalizedKey);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      entries.delete(normalizedKey);
      return null;
    }

    return entry.value;
  };

  return {
    enabled: true,
    client: null,
    getStatus: () => ({
      enabled: true,
      provider: "memory",
      fallbackReason,
      size: entries.size,
    }),
    getJson: async (key) => readEntry(key),
    setJson: async (key, value, ttlSeconds) => {
      const normalizedTtl = Math.max(Math.round(Number(ttlSeconds) || 0), 1);
      entries.set(buildKey(key), {
        value,
        expiresAt: Date.now() + normalizedTtl * 1000,
      });
      return true;
    },
    deleteKey: async (key) => {
      entries.delete(buildKey(key));
      return true;
    },
    close: async () => {
      entries.clear();
    },
  };
};

export const createRedisCache = async ({
  redisUrl,
  redisKeyPrefix = "smart-nutrition",
  redisConnectTimeoutMs = 5_000,
}) => {
  if (!redisUrl) {
    return createMemoryCache();
  }

  const client = new Redis(redisUrl, {
    keyPrefix: `${redisKeyPrefix}:`,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: redisConnectTimeoutMs,
  });

  client.on("error", () => {});

  try {
    await client.connect();
  } catch (error) {
    client.disconnect();
    return createMemoryCache(
      error instanceof Error ? error.message : "Redis connection failed"
    );
  }

  const buildKey = (key) => String(key ?? "").replace(/^\:+/, "");

  return {
    enabled: true,
    client,
    getStatus: () => ({
      enabled: true,
      provider: "redis",
      status: client.status,
      keyPrefix: redisKeyPrefix,
    }),
    getJson: async (key) => {
      const value = await client.get(buildKey(key));

      if (!value) {
        return null;
      }

      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    },
    setJson: async (key, value, ttlSeconds) => {
      const normalizedTtl = Math.max(Math.round(Number(ttlSeconds) || 0), 1);
      await client.set(buildKey(key), JSON.stringify(value), "EX", normalizedTtl);
      return true;
    },
    deleteKey: async (key) => {
      await client.del(buildKey(key));
      return true;
    },
    close: async () => {
      await client.quit().catch(() => {
        client.disconnect();
      });
    },
  };
};
