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
  starting: Boolean(telegramStatus.starting),
  retryScheduled: Boolean(telegramStatus.retryScheduled),
  lastStartAttemptAt: telegramStatus.lastStartAttemptAt ?? null,
  lastStartedAt: telegramStatus.lastStartedAt ?? null,
  lastStartError: telegramStatus.lastStartError
    ? {
        code: telegramStatus.lastStartError.code ?? "TELEGRAM_START_FAILED",
        message: telegramStatus.lastStartError.message ?? "Telegram polling failed.",
      }
    : null,
  reminders: {
    enabled: Boolean(
      telegramStatus.reminders?.enabled ?? telegramStatus.medicationReminders?.enabled
    ),
    polling: Boolean(
      telegramStatus.reminders?.polling ?? telegramStatus.medicationReminders?.polling
    ),
    capabilities: telegramStatus.reminders?.capabilities ?? null,
  },
  medicationReminders: {
    enabled: Boolean(telegramStatus.medicationReminders?.enabled),
    polling: Boolean(telegramStatus.medicationReminders?.polling),
  },
});

export const getPublicKeepAliveStatus = (keepAliveStatus = {}) => ({
  enabled: Boolean(keepAliveStatus.enabled),
  configured: Boolean(keepAliveStatus.configured),
  running: Boolean(keepAliveStatus.running),
  urlConfigured: Boolean(keepAliveStatus.urlConfigured),
  intervalMs: keepAliveStatus.intervalMs ?? null,
  timeoutMs: keepAliveStatus.timeoutMs ?? null,
  lastPingAt: keepAliveStatus.lastPingAt ?? null,
  lastSuccessAt: keepAliveStatus.lastSuccessAt ?? null,
  lastStatusCode: keepAliveStatus.lastStatusCode ?? null,
  lastDurationMs: keepAliveStatus.lastDurationMs ?? null,
  totalPings: keepAliveStatus.totalPings ?? 0,
  failedPings: keepAliveStatus.failedPings ?? 0,
  lastError: keepAliveStatus.lastError
    ? {
        code: keepAliveStatus.lastError.code ?? "KEEPALIVE_FAILED",
        message: keepAliveStatus.lastError.message ?? "Keepalive ping failed.",
      }
    : null,
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
  keepAliveRuntime,
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
  const keepAliveStatus = getPublicKeepAliveStatus(keepAliveRuntime?.getStatus?.());
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
    keepAlive: keepAliveStatus,
    products: productLookupStatus,
    ai: aiStatus,
  };
};
