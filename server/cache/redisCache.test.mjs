import { beforeEach, describe, expect, it, vi } from "vitest";

const redisMocks = vi.hoisted(() => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  quit: vi.fn(),
  on: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

vi.mock("ioredis", () => ({
  default: vi.fn(function RedisMock() {
    return {
      status: "ready",
      connect: redisMocks.connect,
      disconnect: redisMocks.disconnect,
      quit: redisMocks.quit,
      on: redisMocks.on,
      get: redisMocks.get,
      set: redisMocks.set,
      del: redisMocks.del,
    };
  }),
}));

const { default: Redis } = await import("ioredis");
const { createRedisCache } = await import("./redisCache.mjs");

describe("createRedisCache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisMocks.connect.mockResolvedValue(undefined);
    redisMocks.quit.mockResolvedValue(undefined);
    redisMocks.get.mockResolvedValue(null);
    redisMocks.set.mockResolvedValue("OK");
    redisMocks.del.mockResolvedValue(1);
  });

  it("uses the memory fallback when no Redis URL is configured", async () => {
    const cache = await createRedisCache({ redisUrl: "" });

    expect(Redis).not.toHaveBeenCalled();
    expect(cache.enabled).toBe(false);
    expect(cache.client).toBeNull();
    expect(cache.getStatus()).toEqual({
      enabled: false,
      provider: "memory",
      fallbackReason: null,
    });
    await expect(cache.getJson("catalog")).resolves.toBeNull();
    await expect(cache.setJson("catalog", { ok: true }, 60)).resolves.toBe(false);
  });

  it("falls back to memory when Redis cannot connect", async () => {
    redisMocks.connect.mockRejectedValueOnce(new Error("connection refused"));

    const cache = await createRedisCache({
      redisUrl: "redis://localhost:6379",
      redisConnectTimeoutMs: 10,
    });

    expect(Redis).toHaveBeenCalledWith(
      "redis://localhost:6379",
      expect.objectContaining({
        lazyConnect: true,
        enableOfflineQueue: false,
        connectTimeout: 10,
      })
    );
    expect(redisMocks.on).toHaveBeenCalledWith("error", expect.any(Function));
    expect(redisMocks.disconnect).toHaveBeenCalled();
    expect(cache.enabled).toBe(false);
    expect(cache.getStatus()).toEqual({
      enabled: false,
      provider: "memory",
      fallbackReason: "connection refused",
    });
  });

  it("uses Redis commands after a successful connection", async () => {
    redisMocks.get.mockResolvedValueOnce(JSON.stringify({ ok: true }));

    const cache = await createRedisCache({
      redisUrl: "redis://localhost:6379",
      redisKeyPrefix: "smart-test",
    });

    expect(cache.enabled).toBe(true);
    expect(cache.getStatus()).toEqual({
      enabled: true,
      provider: "redis",
      status: "ready",
      keyPrefix: "smart-test",
    });

    await expect(cache.getJson(":catalog")).resolves.toEqual({ ok: true });
    await expect(cache.setJson(":catalog", { ok: true }, 0)).resolves.toBe(true);
    await expect(cache.deleteKey(":catalog")).resolves.toBe(true);
    await cache.close();

    expect(redisMocks.get).toHaveBeenCalledWith("catalog");
    expect(redisMocks.set).toHaveBeenCalledWith(
      "catalog",
      JSON.stringify({ ok: true }),
      "EX",
      1
    );
    expect(redisMocks.del).toHaveBeenCalledWith("catalog");
    expect(redisMocks.quit).toHaveBeenCalled();
  });
});
