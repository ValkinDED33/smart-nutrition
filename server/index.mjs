import http from "node:http";
import { createAssistantAgentService } from "./agent/agent.service.mjs";
import { serverConfig } from "./config.mjs";
import { createRedisCache } from "./cache/redisCache.mjs";
import {
  sendError,
  sendNoContent,
  isUnsafeCrossSiteMutation,
  setCorsHeaders,
} from "./lib/http.mjs";
import { createAdminController } from "./controllers/admin.controller.mjs";
import { createAiController } from "./controllers/ai.controller.mjs";
import { createStateController } from "./controllers/state.controller.mjs";
import { createAiRepository } from "./repositories/aiRepository.mjs";
import { createAssistantMemoryRepository } from "./repositories/assistantMemoryRepository.mjs";
import { createAuthRepository } from "./repositories/authRepository.mjs";
import { createMongoAdminRepository } from "./repositories/mongoAdminRepository.mjs";
import { createMongoAiRepository } from "./repositories/mongoAiRepository.mjs";
import { createMongoAuthRepository } from "./repositories/mongoAuthRepository.mjs";
import { createMongoPlatformRepository } from "./repositories/mongoPlatformRepository.mjs";
import { createMongoStateRepository } from "./repositories/mongoStateRepository.mjs";
import { createPlatformRepository } from "./repositories/platformRepository.mjs";
import { createStateRepository } from "./repositories/stateRepository.mjs";
import { createApiRouter } from "./routes/index.mjs";
import { createAccountController } from "./routes/account.routes.mjs";
import { createAuthController } from "./routes/auth.routes.mjs";
import {
  createClientErrorController,
  createClientErrorMemoryStore,
} from "./routes/clientError.routes.mjs";
import { createHealthController } from "./routes/health.routes.mjs";
import { createReminderController } from "./routes/reminder.routes.mjs";
import { createTelegramController } from "./routes/telegram.routes.mjs";
import { createAiService } from "./services/ai/ai.service.mjs";
import { createAuthService } from "./services/authService.mjs";
import { createBrevoService } from "./services/brevoService.mjs";
import { createEmailService } from "./services/emailService.mjs";
import { createPhotoAnalysisService } from "./services/photoAnalysisService.mjs";
import { createPlatformService } from "./services/platformService.mjs";
import { createProductLookupService } from "./services/productLookupService.mjs";
import { createReminderService } from "./services/reminderService.mjs";
import { createStateService } from "./services/stateService.mjs";
import { createTelegramService } from "./services/telegramService.mjs";
import { createStorage } from "./storage/index.mjs";
import { createAuthSessionHelpers } from "./runtime/authCookies.mjs";
import {
  createRequestDiagnostics,
  createStartupDiagnostics,
  logStartupDiagnostics,
} from "./runtime/diagnostics.mjs";
import { handleRouteError } from "./runtime/errorHandler.mjs";
import { createKeepAliveRuntime } from "./runtime/keepAlive.mjs";
import { createRequestMetrics } from "./runtime/metrics.mjs";
import {
  getClientAddress,
  getRequestPathname,
  getRequestUrl,
  getSyncContext,
} from "./runtime/requestContext.mjs";
import { createRateLimiters } from "./runtime/rateLimits.mjs";
import { applySecurityHeaders } from "./runtime/securityHeaders.mjs";
import { createSentryRuntime } from "./runtime/sentry.mjs";
import {
  createReadinessSnapshot,
  getPublicAiStatus,
  getPublicBrevoStatus,
  getPublicCacheStatus,
  getPublicEmailStatus,
  getPublicKeepAliveStatus,
  getPublicProductLookupStatus,
  getPublicStorageStatus,
  getPublicTelegramStatus,
} from "./runtime/status.mjs";
import { createStateStreamRuntime } from "./runtime/stateStreams.mjs";
import { createStaticFileServer } from "./runtime/staticFiles.mjs";

const redisCache = await createRedisCache(serverConfig);
const sentryRuntime = createSentryRuntime({ config: serverConfig });
const keepAliveRuntime = createKeepAliveRuntime({
  enabled: serverConfig.keepAliveEnabled,
  url: serverConfig.keepAliveUrl,
  intervalMs: serverConfig.keepAliveIntervalMs,
  timeoutMs: serverConfig.keepAliveTimeoutMs,
});
const storage = await createStorage(serverConfig);
const requestDiagnostics = createRequestDiagnostics();
const assistantMemoryRepository = await createAssistantMemoryRepository({
  dataDir: serverConfig.dataDir,
});
const primaryAiRepository = createAiRepository(storage);
const aiRepository = serverConfig.mongoAiEnabled && serverConfig.databaseProvider !== "mongodb"
  ? await createMongoAiRepository({
      config: serverConfig,
      auditRepository: primaryAiRepository,
    })
  : primaryAiRepository;
const authRepository =
  serverConfig.databaseProvider === "mongodb"
    ? createMongoAuthRepository(storage)
    : createAuthRepository(storage);
const platformRepository =
  serverConfig.databaseProvider === "mongodb"
    ? createMongoPlatformRepository(storage)
    : createPlatformRepository(storage);
const stateRepository =
  serverConfig.databaseProvider === "mongodb"
    ? createMongoStateRepository(storage)
    : createStateRepository(storage);
const adminRepository = createMongoAdminRepository(storage);
const emailService = createEmailService({
  config: serverConfig,
});
const brevoService = createBrevoService({
  config: serverConfig,
});
const productLookupService = createProductLookupService({
  config: serverConfig,
});
const authService = createAuthService({
  authRepository,
  stateRepository,
  emailService,
  brevoService,
  config: serverConfig,
});
const platformService = createPlatformService({
  platformRepository,
  productLookupService,
  config: serverConfig,
  cacheRepository: redisCache,
});
const stateService = createStateService({ stateRepository });
const reminderService = createReminderService({
  authRepository,
});
const assistantAgent = createAssistantAgentService({
  stateService,
  platformService,
  reminderService,
  assistantMemoryRepository,
});
const aiService = createAiService({
  aiRepository,
  assistantMemoryRepository,
  assistantAgent,
  config: serverConfig,
});
const telegramService = createTelegramService({
  config: serverConfig,
  authRepository,
  stateService,
  reminderService,
  assistantAgent,
});
const photoAnalysisService = createPhotoAnalysisService({ config: serverConfig });
const { clearAuthCookies, sendAuthSession } = createAuthSessionHelpers(serverConfig);
const clientErrorStore = createClientErrorMemoryStore();
const { staticAvailable, tryServeStatic } = await createStaticFileServer({
  staticDir: serverConfig.staticDir,
  serveStatic: serverConfig.serveStatic,
});
const { stateStreams, broadcastStateMeta, handleStateStream } = createStateStreamRuntime({
  stateService,
});
const { getMetricsSnapshot, trackRequest } = createRequestMetrics({
  getRequestPathname,
  stateStreams,
});
const getReadinessSnapshot = createReadinessSnapshot({
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
});
const {
  consumeRateLimit,
  consumeAiRateLimit,
  consumeAuthRateLimit,
  isAiMutationRoute,
} = createRateLimiters({
  redisCache,
  serverConfig,
  getClientAddress,
});
const aiController = createAiController({
  aiService,
  bodyLimitBytes: serverConfig.bodyLimitBytes,
});
const clientErrorController = createClientErrorController({
  bodyLimitBytes: serverConfig.bodyLimitBytes,
  sentryRuntime,
  clientErrorStore,
});
const adminController = createAdminController({
  platformService,
  adminRepository,
  bodyLimitBytes: serverConfig.bodyLimitBytes,
  clientErrorStore,
});
const stateController = createStateController({
  stateService,
  platformService,
  photoAnalysisService,
  bodyLimitBytes: serverConfig.bodyLimitBytes,
  getSyncContext,
  broadcastStateMeta,
});
const healthController = createHealthController({
  authService,
  getStorageStatus: () => getPublicStorageStatus(storage.getEngineInfo()),
  getCacheStatus: () => getPublicCacheStatus(redisCache.getStatus()),
  getStaticStatus: () => ({
    enabled: serverConfig.serveStatic,
    available: staticAvailable,
  }),
  getMetrics: () => getMetricsSnapshot(),
  getLimits: () => ({
    requestsPerWindow: serverConfig.requestLimitMax,
    windowMs: serverConfig.requestLimitWindowMs,
    authRequestsPerWindow: serverConfig.authRateLimits,
    authWindowMs: serverConfig.authRateLimitWindowMs,
    aiRequestsPerWindow: serverConfig.aiRateLimitMax,
    aiWindowMs: serverConfig.aiRateLimitWindowMs,
  }),
  getWarnings: () => serverConfig.warnings,
  getEmailStatus: () => getPublicEmailStatus(emailService.getStatus()),
  getBrevoStatus: () => getPublicBrevoStatus(brevoService.getStatus()),
  getTelegramStatus: () => getPublicTelegramStatus(telegramService.getStatus()),
  getKeepAliveStatus: () => getPublicKeepAliveStatus(keepAliveRuntime.getStatus()),
  getProductLookupStatus: () =>
    getPublicProductLookupStatus(productLookupService.getStatus()),
  getAiStatus: () => getPublicAiStatus(aiService.getRuntimeStatus()),
  getReadiness: () => getReadinessSnapshot(),
  getDebugStartup: () =>
    createStartupDiagnostics({
      config: serverConfig,
      requestDiagnostics,
    }),
  debugStartupEnabled: serverConfig.debugStartupEnabled,
});
const authController = createAuthController({
  authService,
  stateService,
  bodyLimitBytes: serverConfig.bodyLimitBytes,
  getSyncContext,
  sendAuthSession,
  clearAuthCookies,
});
const accountController = createAccountController({
  authService,
  clearAuthCookies,
});
const telegramController = createTelegramController({
  telegramService,
});
const reminderController = createReminderController({
  reminderService,
  bodyLimitBytes: serverConfig.bodyLimitBytes,
});
const publicApiRouter = createApiRouter({
  healthController,
  clientErrorController,
  authController,
  authRouteScope: "public",
});
const apiRouter = createApiRouter({
  authController,
  authRouteScope: "protected",
  accountController,
  telegramController,
  reminderController,
  stateController,
  aiController,
  adminController,
});
await platformService.bootstrapAccessControl();

const routeRequest = async (request, response) => {
  applySecurityHeaders(response, { isProduction: serverConfig.isProduction });
  setCorsHeaders(request, response, serverConfig.allowedCorsOrigins);

  if (!request.url) {
    sendError(response, 400, "INVALID_REQUEST", "Request URL is missing.");
    return;
  }

  if (request.method === "OPTIONS") {
    sendNoContent(response);
    return;
  }

  const url = getRequestUrl(request);
  if (!url) {
    sendError(response, 400, "INVALID_URL", "Request URL is invalid.");
    return;
  }

  const { pathname } = url;
  requestDiagnostics.logApiRequest({
    request,
    pathname,
    allowedOrigins: serverConfig.allowedCorsOrigins,
  });

  if (isUnsafeCrossSiteMutation(request, serverConfig.allowedCorsOrigins)) {
    requestDiagnostics.logCsrfBlocked({
      request,
      pathname,
      allowedOrigins: serverConfig.allowedCorsOrigins,
    });
    sendError(response, 403, "CSRF_BLOCKED", "Request origin is not allowed.");
    return;
  }

  const rateLimit =
    pathname === "/api/health" || pathname === "/api/ready"
      ? null
      : await consumeRateLimit(request);

  if (rateLimit && !rateLimit.allowed) {
    response.setHeader("Retry-After", String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)));
    sendError(response, 429, "RATE_LIMITED", "Too many requests. Please slow down.");
    return;
  }

  if (rateLimit) {
    response.setHeader("X-RateLimit-Remaining", String(rateLimit.remaining));
  }

  const authRateLimit = await consumeAuthRateLimit(request, pathname);

  if (authRateLimit && !authRateLimit.allowed) {
    response.setHeader(
      "Retry-After",
      String(Math.ceil((authRateLimit.resetAt - Date.now()) / 1000))
    );
    sendError(response, 429, "AUTH_RATE_LIMITED", "Too many auth requests. Please slow down.");
    return;
  }

  if (authRateLimit) {
    response.setHeader("X-Auth-RateLimit-Remaining", String(authRateLimit.remaining));
  }

  const aiRateLimit = isAiMutationRoute(pathname, request.method)
    ? await consumeAiRateLimit(request, pathname)
    : null;

  if (aiRateLimit && !aiRateLimit.allowed) {
    response.setHeader(
      "Retry-After",
      String(Math.ceil((aiRateLimit.resetAt - Date.now()) / 1000))
    );
    sendError(response, 429, "AI_RATE_LIMITED", "Too many AI requests. Please slow down.");
    return;
  }

  if (aiRateLimit) {
    response.setHeader("X-AI-RateLimit-Remaining", String(aiRateLimit.remaining));
  }

  await authService.cleanupExpiredSessions();

  try {
    if (
      await publicApiRouter({
        request,
        response,
        pathname,
        url,
        auth: null,
      })
    ) {
      return;
    }

    if (pathname === "/api/state/stream" && request.method === "GET") {
      await handleStateStream({ request, response, authService });
      return;
    }

    if (!pathname.startsWith("/api/")) {
      if (await tryServeStatic(request, response, pathname)) {
        return;
      }
    }

    const auth = await authService.authenticateRequest(request);

    if (pathname !== "/api/health" && pathname !== "/api/ready" && !auth) {
      sendError(response, 401, "INVALID_CREDENTIALS", "Session expired.");
      return;
    }

    if (
      await apiRouter({
        request,
        response,
        pathname,
        url,
        auth,
      })
    ) {
      return;
    }

    if (!pathname.startsWith("/api/") && (await tryServeStatic(request, response, pathname))) {
      return;
    }

    sendError(response, 404, "NOT_FOUND", "Route not found.");
  } catch (error) {
    if (handleRouteError(error, response)) {
      return;
    }

    sentryRuntime.captureException(error, { route: pathname, method: request.method });
    console.error(error);
    sendError(response, 500, "SERVER_ERROR", "Unexpected server error.");
  }
};

const server = http.createServer((request, response) => {
  trackRequest(request, response);

  routeRequest(request, response).catch((error) => {
    sentryRuntime.captureException(error, { route: "unhandled_request" });
    console.error(error);
    sendError(response, 500, "SERVER_ERROR", "Unexpected server error.");
  });
});

const getMsUntilNextTokenCleanup = (now = new Date()) => {
  const nextRun = new Date(now);
  nextRun.setHours(3, 0, 0, 0);

  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  return nextRun.getTime() - now.getTime();
};

let tokenCleanupTimeout = null;

const scheduleTokenCleanup = (delayMs = getMsUntilNextTokenCleanup()) => {
  tokenCleanupTimeout = setTimeout(() => {
    authService.cleanupExpiredSessions()
      .catch((error) => {
        console.error("Expired token cleanup failed.", error);
      })
      .finally(() => {
        scheduleTokenCleanup(serverConfig.tokenCleanupIntervalMs);
      });
  }, delayMs);
  tokenCleanupTimeout.unref?.();
};

scheduleTokenCleanup();

const closeRuntime = async () => {
  if (tokenCleanupTimeout) {
    clearTimeout(tokenCleanupTimeout);
  }

  telegramService.stop?.("Smart Nutrition API shutdown");
  keepAliveRuntime.stop?.();

  await Promise.allSettled([
    sentryRuntime.flush?.(),
    redisCache.close?.(),
    aiRepository.close?.(),
    storage.close?.(),
  ]);
};

let isShuttingDown = false;

const shutdown = (signal) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`Received ${signal}. Shutting down Smart Nutrition API...`);

  const forceExitTimeout = setTimeout(() => {
    console.error("Graceful shutdown timed out.");
    process.exit(1);
  }, 10_000);
  forceExitTimeout.unref?.();

  server.close(() => {
    closeRuntime()
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        clearTimeout(forceExitTimeout);
        process.exit(0);
      });
  });
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

server.listen(serverConfig.port, () => {
  logStartupDiagnostics(
    createStartupDiagnostics({
      config: serverConfig,
      requestDiagnostics,
    })
  );

  console.log(`Smart Nutrition API listening on port ${serverConfig.port}`);
  void telegramService.start();
  keepAliveRuntime.start();

  if (serverConfig.serveStatic) {
    console.log(
      staticAvailable
        ? `Static frontend serving enabled from ${serverConfig.staticDir}`
        : `Static frontend serving enabled, but no build was found at ${serverConfig.staticDir}`
    );
  }
});
