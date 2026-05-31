export const getPublicStorageStatus = (engineInfo = {}) => ({
  engine: engineInfo.engine ?? "unknown",
  ...(engineInfo.schemaVersion ? { schemaVersion: engineInfo.schemaVersion } : {}),
  ...(engineInfo.database ? { database: engineInfo.database } : {}),
  ...(typeof engineInfo.ssl === "boolean" ? { ssl: engineInfo.ssl } : {}),
});

export const getPublicCacheStatus = (cacheStatus = {}) => ({
  enabled: Boolean(cacheStatus.enabled),
  provider: cacheStatus.provider ?? "memory",
  ...(cacheStatus.enabled && cacheStatus.status ? { status: cacheStatus.status } : {}),
  fallback: !cacheStatus.enabled && Boolean(cacheStatus.fallbackReason),
});

export const getPublicEmailStatus = (emailStatus = {}) => ({
  configured: Boolean(emailStatus.configured),
});

export const getPublicAiStatus = (aiStatus = {}) => ({
  configured: Boolean(aiStatus.configured),
  providerCount: Math.max(Number(aiStatus.providerCount) || 0, 0),
  fallbackEnabled: Boolean(aiStatus.fallbackEnabled),
  primaryProviderId: aiStatus.primaryProviderId ?? null,
  dataProvider: aiStatus.dataProvider ?? "primary",
  abuseProtection: aiStatus.abuseProtection ?? null,
});

export const createReadinessSnapshot = ({
  storage,
  redisCache,
  emailService,
  aiService,
  serverConfig,
  staticAvailable,
}) => () => {
  const storageStatus = getPublicStorageStatus(storage.getEngineInfo());
  const cacheStatus = getPublicCacheStatus(redisCache.getStatus());
  const emailStatus = getPublicEmailStatus(emailService.getStatus());
  const aiStatus = getPublicAiStatus(aiService.getRuntimeStatus());
  const checks = {
    storage: storageStatus.engine !== "unknown",
    cache: cacheStatus.provider === "memory" || cacheStatus.status === "ready",
    static: !serverConfig.serveStatic || staticAvailable,
    email: !serverConfig.isProduction || emailStatus.configured,
  };
  const ready = Object.values(checks).every(Boolean);

  return {
    ok: ready,
    ready,
    checks,
    storage: storageStatus,
    cache: cacheStatus,
    static: {
      enabled: serverConfig.serveStatic,
      available: staticAvailable,
    },
    email: emailStatus,
    ai: aiStatus,
  };
};
