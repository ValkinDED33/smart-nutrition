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
  fallback: Boolean(cacheStatus.fallbackReason),
});

export const getPublicEmailStatus = (emailStatus = {}) => ({
  configured: Boolean(emailStatus.configured),
});

export const getPublicBrevoStatus = (brevoStatus = {}) => ({
  configured: Boolean(brevoStatus.configured),
  provider: brevoStatus.provider ?? "brevo",
  listIdConfigured: Boolean(brevoStatus.listIdConfigured),
});

export const getPublicTelegramStatus = (telegramStatus = {}) => ({
  configured: Boolean(telegramStatus.configured),
  provider: telegramStatus.provider ?? "telegram",
  botUsername: telegramStatus.botUsername ?? null,
  polling: Boolean(telegramStatus.polling),
});

export const getPublicProductLookupStatus = (productLookupStatus = {}) => ({
  configured: Boolean(productLookupStatus.configured),
  provider: productLookupStatus.provider ?? "external-products",
  timeoutMs: productLookupStatus.timeoutMs ?? null,
  providers: Array.isArray(productLookupStatus.providers)
    ? productLookupStatus.providers.map((provider) => ({
        id: provider.id,
        configured: Boolean(provider.configured),
        requiresApiKey: Boolean(provider.requiresApiKey),
      }))
    : [],
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
  brevoService,
  telegramService,
  productLookupService,
  aiService,
  serverConfig,
  staticAvailable,
}) => () => {
  const storageStatus = getPublicStorageStatus(storage.getEngineInfo());
  const cacheStatus = getPublicCacheStatus(redisCache.getStatus());
  const emailStatus = getPublicEmailStatus(emailService.getStatus());
  const brevoStatus = getPublicBrevoStatus(brevoService?.getStatus?.());
  const telegramStatus = getPublicTelegramStatus(telegramService?.getStatus?.());
  const productLookupStatus = getPublicProductLookupStatus(
    productLookupService?.getStatus?.()
  );
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
    brevo: brevoStatus,
    telegram: telegramStatus,
    products: productLookupStatus,
    ai: aiStatus,
  };
};
