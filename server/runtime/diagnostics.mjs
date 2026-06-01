import { isCorsOriginAllowed } from "../lib/http.mjs";
import { readSingleHeader } from "./requestContext.mjs";

const truthy = (value) => Boolean(String(value ?? "").trim());

const readEnvFlag = (env, ...names) => names.some((name) => truthy(env[name]));

const readOrigin = (request) => readSingleHeader(request.headers.origin) || null;

const readUserAgent = (request) => {
  const userAgent = readSingleHeader(request.headers["user-agent"]);
  return userAgent ? userAgent.slice(0, 160) : null;
};

const redactProvider = (provider) => ({
  id: provider.id,
  label: provider.label,
  model: provider.model,
  baseUrl: provider.baseUrl,
  hasApiKey: truthy(provider.apiKey),
  timeoutMs: provider.timeoutMs,
});

export const createRequestDiagnostics = () => {
  const seenOrigins = new Map();
  let lastApiRequest = null;
  let lastCsrfBlock = null;

  const rememberOrigin = ({ origin, allowed }) => {
    if (!origin) {
      return;
    }

    seenOrigins.set(origin, {
      origin,
      allowed,
      lastSeenAt: new Date().toISOString(),
      count: (seenOrigins.get(origin)?.count ?? 0) + 1,
    });
  };

  return {
    logApiRequest: ({ request, pathname, allowedOrigins }) => {
      if (!pathname.startsWith("/api/")) {
        return;
      }

      const origin = readOrigin(request);
      const allowed = origin ? isCorsOriginAllowed(origin, allowedOrigins) : null;
      const entry = {
        at: new Date().toISOString(),
        method: request.method ?? "GET",
        pathname,
        origin,
        originAllowed: allowed,
        secFetchSite: readSingleHeader(request.headers["sec-fetch-site"]) || null,
        userAgent: readUserAgent(request),
      };

      lastApiRequest = entry;
      rememberOrigin({ origin, allowed });

      console.log(
        `[api] ${entry.at} ${entry.method} ${entry.pathname} origin=${
          entry.origin ?? "none"
        } allowed=${entry.originAllowed ?? "n/a"}`
      );
    },

    logCsrfBlocked: ({ request, pathname, allowedOrigins }) => {
      const origin = readOrigin(request);
      const referer = readSingleHeader(request.headers.referer ?? request.headers.referrer);
      const entry = {
        at: new Date().toISOString(),
        method: request.method ?? "GET",
        pathname,
        origin,
        referer: referer || null,
        secFetchSite: readSingleHeader(request.headers["sec-fetch-site"]) || null,
        allowedOrigins,
      };

      lastCsrfBlock = entry;
      rememberOrigin({ origin, allowed: false });

      console.error("❌ CSRF BLOCKED");
      console.error("Method:", entry.method);
      console.error("Path:", entry.pathname);
      console.error("Origin:", entry.origin ?? "none");
      console.error("Referer:", entry.referer ?? "none");
      console.error("Sec-Fetch-Site:", entry.secFetchSite ?? "none");
      console.error("Allowed origins:", allowedOrigins.join(", ") || "none");
    },

    getSnapshot: () => ({
      lastApiRequest,
      lastCsrfBlock,
      seenOrigins: [...seenOrigins.values()],
    }),
  };
};

export const createStartupDiagnostics = ({
  config,
  env = process.env,
  requestDiagnostics = null,
} = {}) => {
  const envChecks = {
    mongoUri: readEnvFlag(env, "SMART_NUTRITION_MONGO_URI", "SMART_NUTRITION_MONGODB_URI", "MONGODB_URI"),
    databaseUrl: readEnvFlag(env, "SMART_NUTRITION_DATABASE_URL", "DATABASE_URL", "POSTGRES_URL"),
    openrouterKey: readEnvFlag(env, "SMART_NUTRITION_OPENROUTER_API_KEY"),
    googleKey: readEnvFlag(env, "SMART_NUTRITION_GOOGLE_API_KEY"),
    groqKey: readEnvFlag(env, "SMART_NUTRITION_GROQ_API_KEY"),
    assistantApiKey: readEnvFlag(env, "SMART_NUTRITION_ASSISTANT_API_KEY"),
    resendKey: readEnvFlag(env, "SMART_NUTRITION_RESEND_API_KEY"),
    jwtSecret: readEnvFlag(env, "SMART_NUTRITION_JWT_SECRET"),
    corsOrigins: readEnvFlag(env, "SMART_NUTRITION_CORS_ORIGINS"),
    appBaseUrl: readEnvFlag(env, "SMART_NUTRITION_APP_BASE_URL"),
    cookieSameSite: readEnvFlag(env, "SMART_NUTRITION_AUTH_COOKIE_SAME_SITE"),
    cookieSecure: readEnvFlag(env, "SMART_NUTRITION_AUTH_COOKIE_SECURE"),
    viteApiBaseUrl: readEnvFlag(env, "VITE_SMART_NUTRITION_API_BASE_URL"),
  };

  return {
    generatedAt: new Date().toISOString(),
    env: envChecks,
    config: {
      nodeEnv: config.nodeEnv,
      isProduction: config.isProduction,
      port: config.port,
      appBaseUrl: config.appBaseUrl,
      allowedCorsOrigins: config.allowedCorsOrigins,
      authCookieSameSite: config.authCookieSameSite,
      authCookieSecure: config.authCookieSecure,
      databaseProvider: config.databaseProvider,
      aiDataProvider: config.aiDataProvider,
      mongoAiEnabled: config.mongoAiEnabled,
      redisEnabled: config.redisEnabled,
      emailTransportConfigured: config.emailTransportConfigured,
      assistantRuntimeConfigured: config.assistantRuntimeConfigured,
      assistantProviderOrder: config.assistantProviderOrder,
      assistantPrimaryProviderId: config.assistantPrimaryProviderId,
      assistantProviders: config.assistantProviders.map(redactProvider),
      serveStatic: config.serveStatic,
      staticDir: config.staticDir,
      warnings: config.warnings,
    },
    requestDiagnostics: requestDiagnostics?.getSnapshot?.() ?? null,
  };
};

export const logStartupDiagnostics = (diagnostics) => {
  console.log("========== SMART NUTRITION STARTUP ==========");
  Object.entries(diagnostics.env).forEach(([name, ok]) => {
    console.log(`${ok ? "✅" : "❌"} env.${name}`);
  });
  console.log("Runtime:");
  console.log(`- nodeEnv: ${diagnostics.config.nodeEnv}`);
  console.log(`- appBaseUrl: ${diagnostics.config.appBaseUrl}`);
  console.log(
    `- allowedCorsOrigins: ${
      diagnostics.config.allowedCorsOrigins.join(", ") || "none"
    }`
  );
  console.log(
    `- cookies: SameSite=${diagnostics.config.authCookieSameSite}, Secure=${diagnostics.config.authCookieSecure}`
  );
  console.log(`- databaseProvider: ${diagnostics.config.databaseProvider}`);
  console.log(`- aiDataProvider: ${diagnostics.config.aiDataProvider}`);
  console.log(
    `- assistant providers: ${
      diagnostics.config.assistantProviders
        .map((provider) => `${provider.label}:${provider.model}`)
        .join(" -> ") || "none"
    }`
  );
  console.log(`- emailTransportConfigured: ${diagnostics.config.emailTransportConfigured}`);
  console.log(`- redisEnabled: ${diagnostics.config.redisEnabled}`);
  diagnostics.config.warnings.forEach((warning) => {
    console.warn(`[config warning] ${warning}`);
  });
  console.log("============================================");
};
