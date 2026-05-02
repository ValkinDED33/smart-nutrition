import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { serverConfig } from "./config.mjs";
import {
  AssistantApiError,
  AuthApiError,
  PlatformApiError,
  StateApiError,
} from "./lib/domain.mjs";
import {
  clearCookie,
  readJsonBody,
  setCookie,
  sendError,
  sendJson,
  sendNoContent,
  setCorsHeaders,
  setSecurityHeaders,
} from "./lib/http.mjs";
import { createAiController } from "./controllers/ai.controller.mjs";
import { createAiRepository } from "./repositories/aiRepository.mjs";
import { createAuthRepository } from "./repositories/authRepository.mjs";
import { createPlatformRepository } from "./repositories/platformRepository.mjs";
import { createStateRepository } from "./repositories/stateRepository.mjs";
import { createApiRouter } from "./routes/index.mjs";
import { createAiService } from "./services/ai/ai.service.mjs";
import { createAuthService } from "./services/authService.mjs";
import { createEmailService } from "./services/emailService.mjs";
import { createPhotoAnalysisService } from "./services/photoAnalysisService.mjs";
import { createPlatformService } from "./services/platformService.mjs";
import { createStateService } from "./services/stateService.mjs";
import { createSqliteStorage } from "./storage/sqlite.mjs";

const storage = await createSqliteStorage(serverConfig);
const aiRepository = createAiRepository(storage);
const authRepository = createAuthRepository(storage);
const platformRepository = createPlatformRepository(storage);
const stateRepository = createStateRepository(storage);
const emailService = createEmailService({
  config: serverConfig,
});
const aiService = createAiService({
  aiRepository,
  config: serverConfig,
});
const authService = createAuthService({
  authRepository,
  stateRepository,
  emailService,
  config: serverConfig,
});
const platformService = createPlatformService({
  platformRepository,
  config: serverConfig,
});
const stateService = createStateService({ stateRepository });
const photoAnalysisService = createPhotoAnalysisService({ config: serverConfig });
const aiController = createAiController({
  aiService,
  bodyLimitBytes: serverConfig.bodyLimitBytes,
});
const apiRouter = createApiRouter({ aiController });
platformService.bootstrapAccessControl();
const stateStreams = new Map();
const staticRoot = path.resolve(serverConfig.staticDir);

const clearAuthCookies = (response) => {
  clearCookie(response, {
    name: serverConfig.authAccessCookieName,
    sameSite: serverConfig.authCookieSameSite,
    secure: serverConfig.authCookieSecure,
  });
  clearCookie(response, {
    name: serverConfig.authRefreshCookieName,
    sameSite: serverConfig.authCookieSameSite,
    secure: serverConfig.authCookieSecure,
  });
};

const applyAuthCookies = (response, payload) => {
  if (payload?.token) {
    setCookie(response, {
      name: serverConfig.authAccessCookieName,
      value: payload.token,
      maxAge: Math.floor(serverConfig.accessTokenTtlMs / 1000),
      sameSite: serverConfig.authCookieSameSite,
      secure: serverConfig.authCookieSecure,
    });
  }

  if (payload?.refreshToken) {
    setCookie(response, {
      name: serverConfig.authRefreshCookieName,
      value: payload.refreshToken,
      maxAge: Math.floor(serverConfig.refreshTokenTtlMs / 1000),
      sameSite: serverConfig.authCookieSameSite,
      secure: serverConfig.authCookieSecure,
    });
  }
};

const sendAuthSession = (response, statusCode, payload) => {
  applyAuthCookies(response, payload);
  sendJson(response, statusCode, {
    user: payload.user,
    snapshot: payload.snapshot ?? null,
  });
};

const fileExists = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
};

const staticIndexPath = path.join(staticRoot, "index.html");
const staticAvailable =
  serverConfig.serveStatic && (await fileExists(staticIndexPath));

const requestMetrics = {
  startedAt: Date.now(),
  totalRequests: 0,
  activeRequests: 0,
  errorResponses: 0,
  rateLimitedResponses: 0,
  totalResponseMs: 0,
  routes: new Map(),
};

const requestLimitState = new Map();
const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".txt", "text/plain; charset=utf-8"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

const normalizeRouteLabel = (pathname) =>
  pathname
    .replace(/^\/api\/meal-entries\/[^/]+$/, "/api/meal-entries/:id")
    .replace(/^\/api\/meal-templates\/[^/]+$/, "/api/meal-templates/:id")
    .replace(/^\/api\/meal-products\/(saved|recent)\/[^/]+$/, "/api/meal-products/$1/:id")
    .replace(/^\/api\/admin\/foods\/submissions\/[^/]+$/, "/api/admin/foods/submissions/:id")
    .replace(/^\/api\/admin\/users\/[^/]+\/role$/, "/api/admin/users/:id/role");

const getClientAddress = (request) =>
  String(request.headers["x-forwarded-for"] || request.socket.remoteAddress || "unknown")
    .split(",")[0]
    .trim();

const readSingleHeader = (value) =>
  Array.isArray(value) ? String(value[0] ?? "").trim() : String(value ?? "").trim();

const getRequestUrl = (request) => {
  try {
    return new URL(request.url ?? "/", `http://${request.headers.host || "localhost"}`);
  } catch {
    return null;
  }
};

const getRequestPathname = (request) => getRequestUrl(request)?.pathname ?? "/";

const getSyncContext = (request) => ({
  deviceId: readSingleHeader(request.headers["x-device-id"]) || null,
  baseVersion: readSingleHeader(request.headers["x-state-version"]) || null,
});

const isInsideDirectory = (rootDir, candidatePath) => {
  const relativePath = path.relative(rootDir, candidatePath);

  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  );
};

const getContentType = (filePath) =>
  mimeTypes.get(path.extname(filePath).toLowerCase()) ?? "application/octet-stream";

const sendStaticFile = async (request, response, filePath) => {
  const body = await fs.readFile(filePath);
  const isAsset = filePath.includes(`${path.sep}assets${path.sep}`);

  response.writeHead(200, {
    "Content-Type": getContentType(filePath),
    "Content-Length": String(body.byteLength),
    "Cache-Control": isAsset ? "public, max-age=31536000, immutable" : "no-cache",
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  response.end(body);
};

const tryServeStatic = async (request, response, pathname) => {
  if (!staticAvailable || !["GET", "HEAD"].includes(request.method ?? "")) {
    return false;
  }

  let decodedPathname = pathname;

  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch {
    sendError(response, 400, "INVALID_PATH", "Invalid request path.");
    return true;
  }

  const requestedPath =
    decodedPathname === "/"
      ? staticIndexPath
      : path.resolve(staticRoot, decodedPathname.replace(/^\/+/, ""));

  if (!isInsideDirectory(staticRoot, requestedPath)) {
    sendError(response, 404, "NOT_FOUND", "File not found.");
    return true;
  }

  if (await fileExists(requestedPath)) {
    await sendStaticFile(request, response, requestedPath);
    return true;
  }

  if (!path.extname(decodedPathname) && await fileExists(staticIndexPath)) {
    await sendStaticFile(request, response, staticIndexPath);
    return true;
  }

  return false;
};

const consumeRateLimit = (request) => {
  const clientAddress = getClientAddress(request);
  const now = Date.now();
  const current =
    requestLimitState.get(clientAddress) ?? {
      count: 0,
      resetAt: now + serverConfig.requestLimitWindowMs,
    };

  if (current.resetAt <= now) {
    current.count = 0;
    current.resetAt = now + serverConfig.requestLimitWindowMs;
  }

  current.count += 1;
  requestLimitState.set(clientAddress, current);

  return {
    allowed: current.count <= serverConfig.requestLimitMax,
    remaining: Math.max(serverConfig.requestLimitMax - current.count, 0),
    resetAt: current.resetAt,
  };
};

const getMetricsSnapshot = () => {
  const topRoutes = [...requestMetrics.routes.entries()]
    .sort((left, right) => right[1].count - left[1].count)
    .slice(0, 8)
    .map(([route, value]) => ({
      route,
      count: value.count,
      averageMs: value.totalMs > 0 ? Math.round(value.totalMs / value.count) : 0,
    }));

  return {
    uptimeSeconds: Math.round((Date.now() - requestMetrics.startedAt) / 1000),
    totalRequests: requestMetrics.totalRequests,
    activeRequests: requestMetrics.activeRequests,
    errorResponses: requestMetrics.errorResponses,
    rateLimitedResponses: requestMetrics.rateLimitedResponses,
    averageResponseMs:
      requestMetrics.totalRequests > 0
        ? Math.round(requestMetrics.totalResponseMs / requestMetrics.totalRequests)
        : 0,
    activeStateStreams: [...stateStreams.values()].reduce(
      (sum, streams) => sum + streams.size,
      0
    ),
    topRoutes,
  };
};

const addStateStream = (userId, response) => {
  const streams = stateStreams.get(userId) ?? new Set();
  streams.add(response);
  stateStreams.set(userId, streams);
};

const removeStateStream = (userId, response) => {
  const streams = stateStreams.get(userId);

  if (!streams) {
    return;
  }

  streams.delete(response);

  if (streams.size === 0) {
    stateStreams.delete(userId);
  }
};

const broadcastStateMeta = (user, stateService) => {
  const streams = stateStreams.get(user.id);

  if (!streams || streams.size === 0) {
    return;
  }

  const payload = JSON.stringify(stateService.getSnapshotMeta(user));

  streams.forEach((streamResponse) => {
    streamResponse.write(`event: state-updated\n`);
    streamResponse.write(`data: ${payload}\n\n`);
  });
};

const routeRequest = async (request, response) => {
  setSecurityHeaders(response);
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
  const rateLimit =
    pathname === "/api/health" ? null : consumeRateLimit(request);

  if (rateLimit && !rateLimit.allowed) {
    response.setHeader("Retry-After", String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)));
    sendError(response, 429, "RATE_LIMITED", "Too many requests. Please slow down.");
    return;
  }

  if (rateLimit) {
    response.setHeader("X-RateLimit-Remaining", String(rateLimit.remaining));
  }

  authService.cleanupExpiredSessions();

  const mealEntryMatch = pathname.match(/^\/api\/meal-entries\/([^/]+)$/);
  const mealTemplateMatch = pathname.match(/^\/api\/meal-templates\/([^/]+)$/);
  const mealProductMatch = pathname.match(
    /^\/api\/meal-products\/(saved|recent)(?:\/([^/]+))?$/
  );
  const accountBackupMatch = pathname.match(/^\/api\/account\/backups\/([^/]+)$/);
  const adminFoodSubmissionMatch = pathname.match(/^\/api\/admin\/foods\/submissions\/([^/]+)$/);
  const adminUserRoleMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)\/role$/);

  try {
    if (pathname === "/api/health" && request.method === "GET") {
      sendJson(response, 200, {
        ...authService.getHealthInfo(),
        storage: storage.getEngineInfo(),
        static: {
          enabled: serverConfig.serveStatic,
          available: staticAvailable,
          staticDir: serverConfig.staticDir,
        },
        metrics: getMetricsSnapshot(),
        limits: {
          requestsPerWindow: serverConfig.requestLimitMax,
          windowMs: serverConfig.requestLimitWindowMs,
        },
        warnings: serverConfig.warnings,
        email: emailService.getStatus(),
        ai: aiService.getRuntimeStatus(),
      });
      return;
    }

    if (pathname === "/api/auth/register" && request.method === "POST") {
      const body = await readJsonBody(request, serverConfig.bodyLimitBytes);
      sendAuthSession(response, 201, authService.register(body));
      return;
    }

    if (pathname === "/api/auth/login" && request.method === "POST") {
      const body = await readJsonBody(request, serverConfig.bodyLimitBytes);
      sendAuthSession(response, 200, authService.login(body));
      return;
    }

    if (pathname === "/api/auth/forgot-password" && request.method === "POST") {
      const body = await readJsonBody(request, serverConfig.bodyLimitBytes);
      sendJson(response, 200, await authService.requestPasswordReset(body));
      return;
    }

    if (pathname === "/api/auth/reset-password" && request.method === "POST") {
      const body = await readJsonBody(request, serverConfig.bodyLimitBytes);
      sendJson(response, 200, authService.resetPassword(body));
      return;
    }

    if (pathname === "/api/auth/session" && request.method === "GET") {
      const session = authService.restoreSession(request);

      if (!session) {
        sendError(response, 401, "INVALID_CREDENTIALS", "Session expired.");
        return;
      }

      sendAuthSession(response, 200, session);
      return;
    }

    if (pathname === "/api/auth/refresh" && request.method === "POST") {
      const body = await readJsonBody(request, serverConfig.bodyLimitBytes);
      sendAuthSession(response, 200, authService.refreshSession(request, body));
      return;
    }

    if (pathname === "/api/state/stream" && request.method === "GET") {
      const auth = authService.authenticateRequest(request);

      if (!auth) {
        sendError(response, 401, "INVALID_CREDENTIALS", "Session expired.");
        return;
      }

      response.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      });
      response.write(`event: connected\n`);
      response.write(`data: ${JSON.stringify(stateService.getSnapshotMeta(auth.user))}\n\n`);
      addStateStream(auth.user.id, response);

      const heartbeatId = setInterval(() => {
        response.write(`event: ping\ndata: {}\n\n`);
      }, 20_000);

      request.on("close", () => {
        clearInterval(heartbeatId);
        removeStateStream(auth.user.id, response);
      });
      return;
    }

    if (pathname === "/api/auth/logout" && request.method === "POST") {
      const body = await readJsonBody(request, serverConfig.bodyLimitBytes);
      authService.logout(request, body);
      clearAuthCookies(response);
      sendNoContent(response);
      return;
    }

    if (!pathname.startsWith("/api/")) {
      if (await tryServeStatic(request, response, pathname)) {
        return;
      }
    }

    const auth = authService.authenticateRequest(request);

    if (
      pathname !== "/api/health" &&
      !pathname.startsWith("/api/auth/") &&
      !auth
    ) {
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

    if (pathname === "/api/auth/profile" && request.method === "PATCH") {
      const body = await readJsonBody(request, serverConfig.bodyLimitBytes);
      sendJson(response, 200, authService.updateUserProfile(body, auth.user));
      return;
    }

    if (pathname === "/api/auth/logout-all" && request.method === "POST") {
      authService.logoutAll(auth.user);
      clearAuthCookies(response);
      sendNoContent(response);
      return;
    }

    if (pathname === "/api/access" && request.method === "GET") {
      sendJson(response, 200, platformService.getAccessOverview(auth.user));
      return;
    }

    if (pathname === "/api/state" && request.method === "GET") {
      sendJson(response, 200, stateService.getSnapshot(auth.user));
      return;
    }

    if (pathname === "/api/state/meta" && request.method === "GET") {
      sendJson(response, 200, stateService.getSnapshotMeta(auth.user));
      return;
    }

    if (pathname === "/api/state" && request.method === "PUT") {
      const body = await readJsonBody(request, serverConfig.bodyLimitBytes);
      stateService.saveSnapshot(auth.user, body, getSyncContext(request));
      broadcastStateMeta(auth.user, stateService);
      sendJson(response, 200, { ok: true, meta: stateService.getSnapshotMeta(auth.user) });
      return;
    }

    if (pathname === "/api/profile-state" && request.method === "GET") {
      sendJson(response, 200, stateService.getProfileState(auth.user));
      return;
    }

    if (pathname === "/api/profile-state" && request.method === "PUT") {
      const body = await readJsonBody(request, serverConfig.bodyLimitBytes);
      stateService.saveProfileState(auth.user, body, getSyncContext(request));
      broadcastStateMeta(auth.user, stateService);
      sendJson(response, 200, { ok: true, meta: stateService.getSnapshotMeta(auth.user) });
      return;
    }

    if (pathname === "/api/meal-state" && request.method === "GET") {
      sendJson(response, 200, stateService.getMealState(auth.user));
      return;
    }

    if (pathname === "/api/meal-state" && request.method === "PUT") {
      const body = await readJsonBody(request, serverConfig.bodyLimitBytes);
      stateService.saveMealState(auth.user, body, getSyncContext(request));
      broadcastStateMeta(auth.user, stateService);
      sendJson(response, 200, { ok: true, meta: stateService.getSnapshotMeta(auth.user) });
      return;
    }

    if (pathname === "/api/water-state" && request.method === "GET") {
      sendJson(response, 200, stateService.getWaterState(auth.user));
      return;
    }

    if (pathname === "/api/water-state" && request.method === "PUT") {
      const body = await readJsonBody(request, serverConfig.bodyLimitBytes);
      stateService.saveWaterState(auth.user, body, getSyncContext(request));
      broadcastStateMeta(auth.user, stateService);
      sendJson(response, 200, { ok: true, meta: stateService.getSnapshotMeta(auth.user) });
      return;
    }

    if (pathname === "/api/fridge-state" && request.method === "GET") {
      sendJson(response, 200, stateService.getFridgeState(auth.user));
      return;
    }

    if (pathname === "/api/fridge-state" && request.method === "PUT") {
      const body = await readJsonBody(request, serverConfig.bodyLimitBytes);
      stateService.saveFridgeState(auth.user, body, getSyncContext(request));
      broadcastStateMeta(auth.user, stateService);
      sendJson(response, 200, { ok: true, meta: stateService.getSnapshotMeta(auth.user) });
      return;
    }

    if (pathname === "/api/community-state" && request.method === "GET") {
      sendJson(response, 200, stateService.getCommunityState(auth.user));
      return;
    }

    if (pathname === "/api/community-state" && request.method === "PUT") {
      const body = await readJsonBody(request, serverConfig.bodyLimitBytes);
      stateService.saveCommunityState(auth.user, body, getSyncContext(request));
      broadcastStateMeta(auth.user, stateService);
      sendJson(response, 200, { ok: true, meta: stateService.getSnapshotMeta(auth.user) });
      return;
    }

    if (pathname === "/api/meal-entries" && request.method === "POST") {
      const body = await readJsonBody(request, serverConfig.bodyLimitBytes);
      stateService.addMealEntries(auth.user, body, getSyncContext(request));
      broadcastStateMeta(auth.user, stateService);
      sendJson(response, 201, { ok: true, meta: stateService.getSnapshotMeta(auth.user) });
      return;
    }

    if (mealEntryMatch && request.method === "DELETE") {
      const entryId = decodeURIComponent(mealEntryMatch[1]);
      stateService.removeMealEntry(auth.user, entryId, getSyncContext(request));
      broadcastStateMeta(auth.user, stateService);
      sendJson(response, 200, { ok: true, meta: stateService.getSnapshotMeta(auth.user) });
      return;
    }

    if (pathname === "/api/meal-templates" && request.method === "POST") {
      const body = await readJsonBody(request, serverConfig.bodyLimitBytes);
      stateService.addMealTemplate(auth.user, body, getSyncContext(request));
      broadcastStateMeta(auth.user, stateService);
      sendJson(response, 201, { ok: true, meta: stateService.getSnapshotMeta(auth.user) });
      return;
    }

    if (mealTemplateMatch && request.method === "DELETE") {
      const templateId = decodeURIComponent(mealTemplateMatch[1]);
      stateService.deleteMealTemplate(auth.user, templateId, getSyncContext(request));
      broadcastStateMeta(auth.user, stateService);
      sendJson(response, 200, { ok: true, meta: stateService.getSnapshotMeta(auth.user) });
      return;
    }

    if (mealProductMatch && request.method === "POST" && !mealProductMatch[2]) {
      const body = await readJsonBody(request, serverConfig.bodyLimitBytes);
      stateService.upsertMealProduct(auth.user, mealProductMatch[1], body, getSyncContext(request));
      broadcastStateMeta(auth.user, stateService);
      sendJson(response, 200, { ok: true, meta: stateService.getSnapshotMeta(auth.user) });
      return;
    }

    if (mealProductMatch && request.method === "DELETE" && mealProductMatch[2]) {
      const productKey = decodeURIComponent(mealProductMatch[2]);
      stateService.removeMealProduct(
        auth.user,
        mealProductMatch[1],
        productKey,
        getSyncContext(request)
      );
      broadcastStateMeta(auth.user, stateService);
      sendJson(response, 200, { ok: true, meta: stateService.getSnapshotMeta(auth.user) });
      return;
    }

    if (pathname === "/api/photo-analysis" && request.method === "POST") {
      const body = await readJsonBody(request, serverConfig.bodyLimitBytes);
      sendJson(
        response,
        200,
        await photoAnalysisService.analyzePhoto(
          stateService.getProfileState(auth.user),
          body
        )
      );
      return;
    }

    if (pathname === "/api/foods" && request.method === "GET") {
      sendJson(response, 200, {
        items: platformService.listVisibleCatalogProducts(auth.user, {
          status: url.searchParams.get("status"),
          search: url.searchParams.get("search") ?? "",
          limit: url.searchParams.get("limit") ?? undefined,
        }),
      });
      return;
    }

    if (pathname === "/api/foods/submissions" && request.method === "GET") {
      sendJson(response, 200, {
        items: platformService.listOwnCatalogProducts(auth.user, {
          status: url.searchParams.get("status"),
          search: url.searchParams.get("search") ?? "",
          limit: url.searchParams.get("limit") ?? undefined,
        }),
      });
      return;
    }

    if (pathname === "/api/foods/submissions" && request.method === "POST") {
      const body = await readJsonBody(request, serverConfig.bodyLimitBytes);
      sendJson(response, 201, platformService.submitCatalogProduct(auth.user, body));
      return;
    }

    if (pathname === "/api/admin/foods/submissions" && request.method === "GET") {
      sendJson(response, 200, {
        items: platformService.listModerationQueue(auth.user, {
          status: url.searchParams.get("status"),
          search: url.searchParams.get("search") ?? "",
          limit: url.searchParams.get("limit") ?? undefined,
        }),
      });
      return;
    }

    if (adminFoodSubmissionMatch && request.method === "PATCH") {
      const body = await readJsonBody(request, serverConfig.bodyLimitBytes);
      sendJson(
        response,
        200,
        platformService.reviewCatalogProduct(
          auth.user,
          decodeURIComponent(adminFoodSubmissionMatch[1]),
          body
        )
      );
      return;
    }

    if (pathname === "/api/admin/audit-logs" && request.method === "GET") {
      sendJson(response, 200, {
        items: platformService.listAuditLogs(auth.user, {
          limit: url.searchParams.get("limit") ?? undefined,
        }),
      });
      return;
    }

    if (pathname === "/api/admin/users" && request.method === "GET") {
      sendJson(response, 200, {
        items: platformService.listUsers(auth.user),
      });
      return;
    }

    if (adminUserRoleMatch && request.method === "PATCH") {
      const body = await readJsonBody(request, serverConfig.bodyLimitBytes);
      sendJson(
        response,
        200,
        platformService.updateUserRole(
          auth.user,
          decodeURIComponent(adminUserRoleMatch[1]),
          body
        )
      );
      return;
    }

    if (pathname === "/api/account" && request.method === "DELETE") {
      authService.deleteAccount(auth.user);
      clearAuthCookies(response);
      sendNoContent(response);
      return;
    }

    if (pathname === "/api/account/export" && request.method === "GET") {
      sendJson(response, 200, authService.exportAccountData(auth.user));
      return;
    }

    if (pathname === "/api/account/backups" && request.method === "GET") {
      sendJson(response, 200, {
        items: authService.listAccountBackups(auth.user),
      });
      return;
    }

    if (accountBackupMatch && request.method === "GET") {
      const backupId = decodeURIComponent(accountBackupMatch[1]);
      response.setHeader(
        "Content-Disposition",
        `attachment; filename="${backupId.replace(/"/g, "")}"`
      );
      sendJson(response, 200, authService.readAccountBackup(auth.user, backupId));
      return;
    }

    if (await tryServeStatic(request, response, pathname)) {
      return;
    }

    sendError(response, 404, "NOT_FOUND", "Route not found.");
  } catch (error) {
    if (error instanceof AuthApiError) {
      const statusCode =
        error.code === "INVALID_PROFILE"
          ? 400
          : error.code === "EMAIL_IN_USE"
          ? 409
          : error.code === "TOO_MANY_ATTEMPTS"
            ? 429
            : error.code === "EMAIL_DELIVERY_UNAVAILABLE"
              ? 503
            : error.code === "INVALID_RESET_TOKEN" || error.code === "WEAK_PASSWORD"
              ? 400
            : error.code === "BACKUP_NOT_FOUND"
              ? 404
            : error.code === "FORBIDDEN"
              ? 403
              : 401;
      sendError(response, statusCode, error.code, error.message);
      return;
    }

    if (error instanceof PlatformApiError) {
      const statusCode =
        error.code === "FORBIDDEN" || error.code === "ROLE_CHANGE_NOT_ALLOWED"
          ? 403
          : error.code === "FOOD_NOT_FOUND" || error.code === "USER_NOT_FOUND"
            ? 404
            : error.code === "SUBMISSION_LIMIT_REACHED"
              ? 429
              : error.code === "INVALID_ROLE" || error.code === "INVALID_FOOD_SUBMISSION"
                ? 400
                : 409;
      sendError(response, statusCode, error.code, error.message, error.details);
      return;
    }

    if (error instanceof AssistantApiError) {
      const statusCode =
        error.code === "ASSISTANT_RUNTIME_UNAVAILABLE"
          ? 503
          : error.code === "ASSISTANT_RUNTIME_FAILED"
            ? 502
            : 400;
      sendError(response, statusCode, error.code, error.message, error.details);
      return;
    }

    if (error instanceof StateApiError) {
      const statusCode =
        error.code === "PHOTO_ANALYSIS_UNAVAILABLE"
          ? 503
          : error.code === "PHOTO_ANALYSIS_FAILED"
            ? 502
            : error.code === "STATE_CONFLICT"
              ? 409
            : 400;
      sendError(response, statusCode, error.code, error.message, error.details);
      return;
    }

    if (error instanceof Error && error.message === "INVALID_JSON") {
      sendError(response, 400, "INVALID_JSON", "Request body must be valid JSON.");
      return;
    }

    if (error instanceof Error && error.message === "BODY_TOO_LARGE") {
      sendError(response, 413, "BODY_TOO_LARGE", "Request body is too large.");
      return;
    }

    console.error(error);
    sendError(response, 500, "SERVER_ERROR", "Unexpected server error.");
  }
};

const server = http.createServer((request, response) => {
  const startedAt = Date.now();
  const routeLabel = normalizeRouteLabel(getRequestPathname(request));

  requestMetrics.totalRequests += 1;
  requestMetrics.activeRequests += 1;

  response.on("finish", () => {
    const elapsedMs = Date.now() - startedAt;
    requestMetrics.activeRequests = Math.max(requestMetrics.activeRequests - 1, 0);
    requestMetrics.totalResponseMs += elapsedMs;

    if (response.statusCode >= 400) {
      requestMetrics.errorResponses += 1;
    }

    if (response.statusCode === 429) {
      requestMetrics.rateLimitedResponses += 1;
    }

    const routeStats = requestMetrics.routes.get(routeLabel) ?? { count: 0, totalMs: 0 };
    routeStats.count += 1;
    routeStats.totalMs += elapsedMs;
    requestMetrics.routes.set(routeLabel, routeStats);
  });

  routeRequest(request, response).catch((error) => {
    console.error(error);
    sendError(response, 500, "SERVER_ERROR", "Unexpected server error.");
  });
});

server.listen(serverConfig.port, () => {
  serverConfig.warnings.forEach((warning) => {
    console.warn(`[config warning] ${warning}`);
  });

  console.log(`Smart Nutrition API listening on http://localhost:${serverConfig.port}`);

  if (serverConfig.serveStatic) {
    console.log(
      staticAvailable
        ? `Static frontend serving enabled from ${serverConfig.staticDir}`
        : `Static frontend serving enabled, but no build was found at ${serverConfig.staticDir}`
    );
  }
});
