import Redis from "ioredis";

const createMemoryCache = (fallbackReason = null) => ({
  enabled: false,
  client: null,
  getStatus: () => ({
    enabled: false,
    provider: "memory",
    fallbackReason,
  }),
  getJson: async () => null,
  setJson: async () => false,
  deleteKey: async () => false,
  close: async () => {},
});

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
